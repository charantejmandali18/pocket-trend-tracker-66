import { gmailOAuthService } from './gmailOAuth';
import { supabase } from '@/integrations/supabase/client';
import { simpleParser } from 'mailparser';

// Types for parsed data
export interface ParsedTransaction {
  id: string;
  raw_email_id: string;
  email_subject: string;
  email_date: string;
  sender: string;
  
  // Transaction details
  transaction_type: 'credit' | 'debit' | 'unknown';
  amount: number;
  currency: string;
  transaction_date: string;
  description: string;
  merchant?: string;
  category?: string;
  
  // Account information
  account_info: {
    bank_name?: string;
    account_number_partial?: string;
    account_type?: string;
  };
  
  // Processing metadata
  confidence_score: number;
  needs_review: boolean;
  parsing_notes?: string;
}

export interface ParsedAccount {
  id: string;
  discovered_from_email_id: string;
  bank_name: string;
  account_number_partial?: string;
  account_type?: string;
  current_balance?: number;
  account_holder_name?: string;
  confidence_score: number;
  needs_review: boolean;
  discovery_notes?: string;
}

class EmailParsingService {
  // Bank and financial service patterns
  private readonly BANK_PATTERNS = {
    // Major Indian Banks
    sbi: /state bank|sbi|sbicard/i,
    hdfc: /hdfc|hdfcbank/i,
    icici: /icici|icicbank/i,
    axis: /axis|axisbank/i,
    kotak: /kotak|kotakbank/i,
    pnb: /punjab national|pnb/i,
    bob: /bank of baroda|bob/i,
    canara: /canara bank/i,
    union: /union bank/i,
    indian: /indian bank/i,
    
    // Payment services
    paytm: /paytm/i,
    phonepe: /phonepe/i,
    googlepay: /google pay|gpay/i,
    amazonpay: /amazon pay/i,
    
    // Credit cards
    amex: /american express|amex/i,
    visa: /visa/i,
    mastercard: /mastercard/i,
  };

  // Transaction keywords and patterns
  private readonly TRANSACTION_PATTERNS = {
    // Debit patterns
    debit: /debited|debit|withdrawn|purchase|spent|paid|dr\b|charged/i,
    // Credit patterns  
    credit: /credited|credit|received|deposit|refund|cr\b|cashback/i,
    // Amount patterns
    amount: /(?:rs\.?\s*|₹\s*|inr\s*)?([\d,]+\.?\d*)/i,
    // Account patterns
    account: /a\/c\s*(?:no\.?)?\s*[\*x]*(\d{4,})|account\s*(?:no\.?)?\s*[\*x]*(\d{4,})/i,
    // Date patterns
    date: /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2}\s+\w+\s+\d{2,4})/i,
  };

  // Optimized email search queries - more specific and fewer calls
  private readonly SEARCH_QUERIES = [
    // Combined bank and payment notifications (last 30 days)
    'newer_than:30d AND ((from:(*bank* OR *sbi* OR *hdfc* OR *icici* OR *axis* OR *kotak* OR *paytm* OR *phonepe* OR *gpay*) AND (debited OR credited OR transaction OR payment)) OR (subject:(transaction OR payment OR debited OR credited)))',
    
    // Credit card and EMI notifications (last 30 days)  
    'newer_than:30d AND (from:(*card* OR *visa* OR *mastercard* OR *amex* OR *finance* OR *loan*) AND (payment OR transaction OR statement OR emi OR installment))',
  ];

  // Main method to process emails for a user
  async processEmailsForUser(userId: string, emailIntegrationId: string): Promise<{
    transactions: ParsedTransaction[];
    accounts: ParsedAccount[];
    processed_count: number;
    errors: string[];
  }> {
    const results = {
      transactions: [] as ParsedTransaction[],
      accounts: [] as ParsedAccount[],
      processed_count: 0,
      errors: [] as string[]
    };

    try {
      // Get the email integration to get access token
      const integrations = await gmailOAuthService.getEmailIntegrations(userId);
      const integration = integrations.find(int => int.id === emailIntegrationId);
      
      if (!integration) {
        throw new Error('Email integration not found');
      }

      console.log('Starting email processing for user:', userId);
      
      // Get the last sync timestamp to only fetch new emails
      const lastSync = integration.last_sync ? new Date(integration.last_sync) : null;
      const sinceDate = lastSync ? Math.floor(lastSync.getTime() / 1000) : null;
      
      // Process each search query
      for (const query of this.SEARCH_QUERIES) {
        try {
          // Add timestamp filter to only get emails since last sync
          const timeFilteredQuery = sinceDate 
            ? `${query} AND after:${sinceDate}`
            : query;
            
          console.log('Processing query:', timeFilteredQuery);
          
          // Fetch messages matching the query - limit to 20 per query to reduce API calls
          const messages = await gmailOAuthService.getGmailMessages(
            integration.access_token,
            timeFilteredQuery,
            20, // Process last 20 emails per query to avoid rate limits
            emailIntegrationId // Pass integration ID for token refresh
          );

          console.log(`Found ${messages.length} messages for query`);

          // Process each message with rate limiting
          for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            try {
              const messageContent = await gmailOAuthService.getMessageContent(
                integration.access_token,
                message.id!,
                emailIntegrationId // Pass integration ID for token refresh
              );

              const parsed = await this.parseEmailMessage(messageContent);
              
              if (parsed.transaction) {
                results.transactions.push(parsed.transaction);
              }
              
              if (parsed.account) {
                results.accounts.push(parsed.account);
              }
              
              results.processed_count++;
              
              // Add small delay between API calls to avoid rate limits
              if (i < messages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
              
            } catch (error) {
              console.error('Error processing message:', message.id, error);
              results.errors.push(`Failed to process message ${message.id}: ${error}`);
            }
          }
          
        } catch (error) {
          console.error('Error with query:', query, error);
          results.errors.push(`Query failed: ${query} - ${error}`);
        }
      }

      console.log('Email processing completed:', {
        transactions: results.transactions.length,
        accounts: results.accounts.length,
        processed: results.processed_count,
        errors: results.errors.length
      });

      // Store parsed data and auto-process high-confidence transactions
      await this.storeParsedDataWithAutoProcessing(userId, emailIntegrationId, results);

      return results;
      
    } catch (error) {
      console.error('Error processing emails:', error);
      throw new Error(`Failed to process emails: ${error}`);
    }
  }

  // Parse individual email message
  private async parseEmailMessage(message: any): Promise<{
    transaction?: ParsedTransaction;
    account?: ParsedAccount;
  }> {
    const result: { transaction?: ParsedTransaction; account?: ParsedAccount } = {};

    try {
      // Extract email metadata
      const headers = message.payload?.headers || [];
      const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
      const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
      const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

      // Extract email body using simpleParser
      const body = await this.extractEmailBody(message.payload);
      
      console.log('Parsing email with simpleParser:', { 
        subject, 
        from, 
        bodyLength: body.length,
        bodyPreview: body.substring(0, 200) + '...' // First 200 chars of body for debugging
      });

      // Parse transaction if this looks like a transaction email
      if (this.isTransactionEmail(subject, body, from)) {
        const transaction = this.parseTransaction(message.id, subject, from, date, body);
        if (transaction) {
          result.transaction = transaction;
        }
      }

      // Parse account information if discoverable
      const accountInfo = this.parseAccountInfo(message.id, subject, from, body);
      if (accountInfo) {
        result.account = accountInfo;
      }

    } catch (error) {
      console.error('Error parsing email message:', error);
    }

    return result;
  }

  // Extract email body using simpleParser for better MIME handling
  private async extractEmailBody(payload: any): Promise<string> {
    try {
      // First try to get the raw MIME content if available
      const rawContent = this.extractRawContent(payload);
      
      if (rawContent) {
        // Use simpleParser to parse the raw MIME content
        const parsed = await simpleParser(rawContent);
        return parsed.text || parsed.textAsHtml || '';
      }
      
      // Fallback to manual extraction if no raw content
      return this.extractBodyFallback(payload);
      
    } catch (error) {
      console.error('Error parsing email with simpleParser:', error);
      // Fallback to manual extraction
      return this.extractBodyFallback(payload);
    }
  }

  // Extract raw MIME content from Gmail payload
  private extractRawContent(payload: any): Buffer | null {
    try {
      let rawData = '';
      
      // Handle single part message
      if (payload.body?.data) {
        rawData = this.decodeBase64(payload.body.data);
      } 
      // Handle multi-part message - reconstruct MIME
      else if (payload.parts) {
        for (const part of payload.parts) {
          if (part.body?.data) {
            rawData += this.decodeBase64(part.body.data) + '\n';
          }
        }
      }
      
      return rawData ? Buffer.from(rawData, 'utf-8') : null;
    } catch (error) {
      console.error('Error extracting raw content:', error);
      return null;
    }
  }

  // Fallback method for manual body extraction
  private extractBodyFallback(payload: any): string {
    let body = '';
    let htmlBody = '';
    let textBody = '';

    // Handle single part message
    if (payload.body?.data) {
      const rawBody = this.decodeBase64(payload.body.data);
      if (payload.mimeType === 'text/html') {
        htmlBody = rawBody;
      } else {
        textBody = rawBody;
      }
    } 
    // Handle multi-part message
    else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.body?.data) {
          const partBody = this.decodeBase64(part.body.data);
          
          if (part.mimeType === 'text/plain') {
            textBody += partBody + '\n';
          } else if (part.mimeType === 'text/html') {
            htmlBody += partBody + '\n';
          }
        }
      }
    }

    // Prefer plain text, but convert HTML to text if no plain text available
    if (textBody.trim()) {
      body = textBody.trim();
    } else if (htmlBody.trim()) {
      body = this.htmlToText(htmlBody);
    }

    return body;
  }

  // Browser-safe base64 decoding
  private decodeBase64(base64String: string): string {
    try {
      // Replace URL-safe characters
      const standardBase64 = base64String.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      const paddedBase64 = standardBase64 + '=='.substring(0, (4 - standardBase64.length % 4) % 4);
      // Decode using browser's atob
      return decodeURIComponent(escape(atob(paddedBase64)));
    } catch (error) {
      console.error('Error decoding base64:', error);
      return '';
    }
  }

  // Convert HTML to plain text
  private htmlToText(html: string): string {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove script and style elements
    const scripts = tempDiv.querySelectorAll('script, style');
    scripts.forEach(script => script.remove());
    
    // Get text content and clean up
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up whitespace and normalize
    text = text.replace(/\s+/g, ' ')  // Multiple spaces to single space
              .replace(/\n\s*\n/g, '\n')  // Multiple newlines to single
              .trim();
    
    return text;
  }

  // Check if email is likely a transaction notification
  private isTransactionEmail(subject: string, body: string, from: string): boolean {
    // STRICT validation - must have ALL three: debit/credit + amount + account
    const bodyText = body.toLowerCase();
    const subjectText = subject.toLowerCase();
    
    console.log('Validating transaction email:', { 
      subject: subject.substring(0, 100),
      bodyPreview: bodyText.substring(0, 200),
      from 
    });

    // 1. Must be from a financial institution
    const isFromBank = Object.values(this.BANK_PATTERNS).some(pattern => pattern.test(from));
    const isFromFinancial = isFromBank || /bank|card|payment|paytm|phonepe|gpay|upi|neft|imps|rtgs/i.test(from);
    
    if (!isFromFinancial) {
      console.log('❌ Not from financial institution');
      return false;
    }

    // 2. Must have clear debit/credit indicator (not just "transaction")
    const hasDebitCredit = /debited|credited|debit|credit|dr\b|cr\b|withdrawn|received|charged|refund/i.test(bodyText) ||
                          /debited|credited|debit|credit|dr\b|cr\b|withdrawn|received|charged|refund/i.test(subjectText);
    
    if (!hasDebitCredit) {
      console.log('❌ No clear debit/credit indicator');
      return false;
    }

    // 3. Must have amount with currency
    const hasAmount = /(?:rs\.?\s*|₹\s*|inr\s*)\d+(?:,\d+)*(?:\.\d+)?|(?:\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|₹|inr)/i.test(bodyText) ||
                     /(?:rs\.?\s*|₹\s*|inr\s*)\d+(?:,\d+)*(?:\.\d+)?|(?:\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|₹|inr)/i.test(subjectText);
    
    if (!hasAmount) {
      console.log('❌ No amount with currency found');
      return false;
    }

    // 4. Must have account indicator (masked account number or card)
    const hasAccount = /a\/c\s*(?:no\.?)?\s*[*x]+\d+|account\s*(?:no\.?)?\s*[*x]+\d+|card\s*[*x]+\d+|\*{4}\d{4}|xxxx\d{4}/i.test(bodyText) ||
                      /a\/c\s*(?:no\.?)?\s*[*x]+\d+|account\s*(?:no\.?)?\s*[*x]+\d+|card\s*[*x]+\d+|\*{4}\d{4}|xxxx\d{4}/i.test(subjectText);
    
    if (!hasAccount) {
      console.log('❌ No account/card number found');
      return false;
    }

    // 5. Exclude promotional/offer emails
    const isPromotional = /offer|discount|cashback\s+offer|reward|points|bonus|win|prize|congratulations|limited\s+time|exclusive/i.test(bodyText) ||
                         /offer|discount|cashback\s+offer|reward|points|bonus|win|prize|congratulations|limited\s+time|exclusive/i.test(subjectText);
    
    if (isPromotional) {
      console.log('❌ Detected as promotional email');
      return false;
    }

    console.log('✅ Valid transaction email detected');
    return true;
  }

  // Parse transaction details from email
  private parseTransaction(emailId: string, subject: string, from: string, date: string, body: string): ParsedTransaction | null {
    // Prioritize body content for parsing, use subject as fallback
    const bodyText = body;
    const fullText = `${body} ${subject}`; // Body first, then subject
    
    // Determine transaction type - MUST be clearly debit or credit
    // Check body first, then subject
    let transactionType: 'credit' | 'debit' | 'unknown' = 'unknown';
    if (this.TRANSACTION_PATTERNS.debit.test(bodyText)) {
      transactionType = 'debit';
    } else if (this.TRANSACTION_PATTERNS.credit.test(bodyText)) {
      transactionType = 'credit';
    } else if (this.TRANSACTION_PATTERNS.debit.test(subject)) {
      transactionType = 'debit';
    } else if (this.TRANSACTION_PATTERNS.credit.test(subject)) {
      transactionType = 'credit';
    }
    
    // If we can't determine if it's debit or credit, don't process it as a transaction
    if (transactionType === 'unknown') {
      console.log('Skipping email - not clearly debit or credit:', subject);
      return null;
    }

    // Extract amount - prioritize body content and ensure it has currency
    const amountRegex = /(?:rs\.?\s*|₹\s*|inr\s*)(\d+(?:,\d+)*(?:\.\d+)?)|(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|₹|inr)/i;
    let amountMatch = bodyText.match(amountRegex);
    if (!amountMatch) {
      amountMatch = subject.match(amountRegex);
    }
    const amount = amountMatch ? parseFloat((amountMatch[1] || amountMatch[2]).replace(/,/g, '')) : 0;
    
    if (amount <= 0) {
      console.log('Skipping email - no valid amount found:', subject);
      return null;
    }

    // Extract account info - must have masked account number
    const accountRegex = /(?:a\/c\s*(?:no\.?)?\s*|account\s*(?:no\.?)?\s*|card\s*)?([*x]+\d{4,}|\*{4}\d{4}|xxxx\d{4})/i;
    let accountMatch = bodyText.match(accountRegex);
    if (!accountMatch) {
      accountMatch = subject.match(accountRegex);
    }
    const accountPartial = accountMatch ? accountMatch[1].replace(/[*x]/g, '').slice(-4) : undefined;
    
    if (!accountPartial) {
      console.log('Skipping email - no account number found:', subject);
      return null;
    }

    // Determine bank - check sender first, then body, then subject
    let bankName = '';
    for (const [bank, pattern] of Object.entries(this.BANK_PATTERNS)) {
      if (pattern.test(from) || pattern.test(bodyText) || pattern.test(subject)) {
        bankName = bank.toUpperCase();
        break;
      }
    }

    // Extract merchant/description - prioritize body content
    let description = subject; // Default to subject
    const merchantPatterns = [
      /(?:at|to)\s+([A-Z\s&]+?)(?:\s+on|\s+\d|\s*$)/i,
      /merchant[:\s]+([A-Z\s&]+?)(?:\s+on|\s+\d|\s*$)/i,
      /transaction\s+(?:at|with)\s+([A-Z\s&]+?)(?:\s+on|\s+\d|\s*$)/i,
      /payment\s+(?:to|at)\s+([A-Z\s&]+?)(?:\s+on|\s+\d|\s*$)/i,
    ];
    
    // First try to extract from body
    for (const pattern of merchantPatterns) {
      const match = bodyText.match(pattern);
      if (match && match[1].trim().length > 2) {
        description = match[1].trim();
        break;
      }
    }
    
    // If no good match in body, try subject
    if (description === subject) {
      for (const pattern of merchantPatterns) {
        const match = subject.match(pattern);
        if (match && match[1].trim().length > 2) {
          description = match[1].trim();
          break;
        }
      }
    }

    // Auto-categorize based on description
    const category = this.categorizeTransaction(description, fullText);

    // Calculate confidence score based on data quality
    let confidence = 0.1; // Base confidence
    if (bankName) confidence += 0.3; // Bank name adds high confidence
    if (amount > 0) confidence += 0.3; // Valid amount adds high confidence
    if (accountPartial && accountPartial.length === 4) confidence += 0.3; // Valid account number
    if (transactionType !== 'unknown') confidence += 0.1; // Transaction type confirmed
    
    console.log(`Transaction confidence: ${confidence} (bank: ${!!bankName}, amount: ${amount}, account: ${accountPartial}, type: ${transactionType})`);
    
    return {
      id: `parsed_${emailId}_${Date.now()}`,
      raw_email_id: emailId,
      email_subject: subject,
      email_date: date,
      sender: from,
      transaction_type: transactionType,
      amount,
      currency: 'INR',
      transaction_date: this.extractTransactionDate(bodyText) || this.extractTransactionDate(subject) || date,
      description,
      merchant: description !== subject ? description : undefined,
      category,
      account_info: {
        bank_name: bankName || undefined,
        account_number_partial: accountPartial,
        account_type: this.guessAccountType(bodyText) || this.guessAccountType(subject),
      },
      confidence_score: confidence,
      needs_review: confidence < 0.7,
      parsing_notes: `Auto-parsed from ${from}`
    };
  }

  // Parse account information from email
  private parseAccountInfo(emailId: string, subject: string, from: string, body: string): ParsedAccount | null {
    // Prioritize body content for account parsing
    const bodyText = body;
    const fullText = `${body} ${subject}`; // Body first, then subject
    
    // Look for balance information - prioritize body content
    let balanceMatch = bodyText.match(/(?:balance|bal)[\s:]*(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i);
    if (!balanceMatch) {
      balanceMatch = subject.match(/(?:balance|bal)[\s:]*(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i);
    }
    const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : undefined;
    
    // Only create account if we have meaningful information
    const hasAccountInBody = this.TRANSACTION_PATTERNS.account.test(bodyText);
    const hasAccountInSubject = this.TRANSACTION_PATTERNS.account.test(subject);
    
    if (!balance && !hasAccountInBody && !hasAccountInSubject) {
      return null;
    }

    // Extract account details - prioritize body content
    let accountMatch = bodyText.match(this.TRANSACTION_PATTERNS.account);
    if (!accountMatch) {
      accountMatch = subject.match(this.TRANSACTION_PATTERNS.account);
    }
    const accountPartial = accountMatch ? (accountMatch[1] || accountMatch[2]) : undefined;

    // Determine bank - check sender first, then body, then subject
    let bankName = '';
    for (const [bank, pattern] of Object.entries(this.BANK_PATTERNS)) {
      if (pattern.test(from) || pattern.test(bodyText) || pattern.test(subject)) {
        bankName = bank.toUpperCase();
        break;
      }
    }

    if (!bankName && !accountPartial) {
      return null;
    }

    return {
      id: `account_${emailId}_${Date.now()}`,
      discovered_from_email_id: emailId,
      bank_name: bankName,
      account_number_partial: accountPartial,
      account_type: this.guessAccountType(bodyText) || this.guessAccountType(subject),
      current_balance: balance,
      confidence_score: (bankName ? 0.3 : 0) + (accountPartial ? 0.3 : 0) + (balance ? 0.4 : 0),
      needs_review: true, // Always require review for auto-discovered accounts
      discovery_notes: `Discovered from email: ${subject}`
    };
  }

  // Guess account type from email content
  private guessAccountType(text: string): string | undefined {
    // Be more specific about credit cards - only if explicitly mentioned
    if (/credit card|cc\s/i.test(text) && !/debit|savings account|current account/i.test(text)) return 'credit_card';
    
    // Bank account types
    if (/savings account|savings|sb account|sb/i.test(text)) return 'savings';
    if (/current account|current|ca account|ca/i.test(text)) return 'current';
    
    // Loan accounts
    if (/loan account|loan|emi|home loan|personal loan/i.test(text)) return 'loan';
    
    // If it mentions "account" but no specific type, default to savings (most common)
    if (/account/i.test(text) && !/credit card/i.test(text)) return 'savings';
    
    return undefined;
  }

  // Extract transaction date from email content
  private extractTransactionDate(text: string): string | null {
    const dateMatch = text.match(this.TRANSACTION_PATTERNS.date);
    if (dateMatch) {
      try {
        const date = new Date(dateMatch[1]);
        return date.toISOString();
      } catch {
        return null;
      }
    }
    return null;
  }

  // Auto-categorize transactions
  private categorizeTransaction(description: string, fullText: string): string {
    const text = `${description} ${fullText}`.toLowerCase();
    
    // Category patterns
    const categories = {
      'Food & Dining': /restaurant|food|dining|zomato|swiggy|dominos|pizza|cafe|hotel/,
      'Transportation': /uber|ola|metro|bus|taxi|fuel|petrol|diesel|parking/,
      'Shopping': /amazon|flipkart|myntra|shopping|mall|store|purchase/,
      'Utilities': /electricity|water|gas|internet|mobile|recharge|bill/,
      'Healthcare': /hospital|medical|pharmacy|doctor|medicine|health/,
      'Entertainment': /movie|cinema|netflix|spotify|entertainment|game/,
      'Groceries': /grocery|supermarket|vegetables|market|bigbasket/,
      'Transfer': /transfer|sent|received|family|friend/,
      'ATM': /atm|cash withdrawal/,
      'EMI': /emi|loan|installment/,
    };

    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(text)) {
        return category;
      }
    }

    return 'Other';
  }

  // Store parsed data with auto-processing for high-confidence transactions
  private async storeParsedDataWithAutoProcessing(
    userId: string, 
    emailIntegrationId: string, 
    results: {
      transactions: ParsedTransaction[];
      accounts: ParsedAccount[];
      processed_count: number;
      errors: string[];
    }
  ) {
    try {
      console.log('Processing transactions with auto-processing logic...');

      const highConfidenceTransactions = [];
      const lowConfidenceTransactions = [];

      // Separate high and low confidence transactions
      for (const tx of results.transactions) {
        const canAutoProcess = this.canAutoProcessTransaction(tx);
        
        if (canAutoProcess) {
          console.log(`Auto-processing transaction: ${tx.description} (${tx.confidence_score})`);
          
          // Try to auto-create the transaction
          const success = await this.autoCreateTransaction(userId, tx);
          if (success) {
            highConfidenceTransactions.push(tx);
          } else {
            // If auto-creation fails, add to manual review
            lowConfidenceTransactions.push(tx);
          }
        } else {
          console.log(`Manual review needed: ${tx.description} (${tx.confidence_score})`);
          lowConfidenceTransactions.push(tx);
        }
      }

      // Store only low-confidence transactions for manual review
      if (lowConfidenceTransactions.length > 0) {
        await this.storeParsedTransactions(userId, emailIntegrationId, lowConfidenceTransactions);
      }

      // Store all discovered accounts for review
      if (results.accounts.length > 0) {
        await this.storeDiscoveredAccounts(userId, emailIntegrationId, results.accounts);
      }

      console.log(`Auto-processed: ${highConfidenceTransactions.length}, Manual review: ${lowConfidenceTransactions.length}`);
      
    } catch (error) {
      console.error('Error in auto-processing:', error);
      // Fallback to storing all transactions for manual review
      await this.storeParsedTransactions(userId, emailIntegrationId, results.transactions);
      await this.storeDiscoveredAccounts(userId, emailIntegrationId, results.accounts);
    }
  }

  // Check if transaction can be auto-processed
  private canAutoProcessTransaction(tx: ParsedTransaction): boolean {
    return (
      tx.confidence_score >= 0.9 && // 90%+ confidence (higher threshold)
      tx.amount > 0 && // Valid amount
      (tx.transaction_type === 'debit' || tx.transaction_type === 'credit') && // MUST be debit or credit
      tx.description && tx.description.length > 5 && // Valid description
      tx.transaction_date && // Valid date
      tx.account_info.bank_name && // Must have bank name
      tx.account_info.account_number_partial && // Must have account number
      tx.account_info.account_number_partial.length === 4 && // Must be exactly 4 digits
      !tx.needs_review // Not flagged for manual review
    );
  }

  // Auto-create transaction directly
  private async autoCreateTransaction(userId: string, tx: ParsedTransaction): Promise<boolean> {
    try {
      // Import addStoredTransaction function
      const { addStoredTransaction } = await import('@/utils/storageService');
      
      const transactionData = {
        description: tx.description,
        amount: tx.amount,
        transaction_type: tx.transaction_type,
        transaction_date: tx.transaction_date,
        category_id: null, // Will be auto-assigned based on category name
        payment_method: 'bank_transfer',
        account_name: tx.account_info.bank_name && tx.account_info.account_number_partial 
          ? `${tx.account_info.bank_name} ****${tx.account_info.account_number_partial}`
          : tx.account_info.bank_name || 'Auto-detected Account',
        notes: `Auto-imported from ${tx.sender}`,
        user_id: userId,
        group_id: null // Personal transactions for now
      };

      const success = await addStoredTransaction(transactionData);
      return success;
    } catch (error) {
      console.error('Error auto-creating transaction:', error);
      return false;
    }
  }

  // Store parsed transactions (for manual review)
  private async storeParsedTransactions(
    userId: string,
    emailIntegrationId: string,
    transactions: ParsedTransaction[]
  ) {
    if (transactions.length === 0) return;

    const transactionData = transactions.map(tx => ({
      user_id: userId,
      email_integration_id: emailIntegrationId,
      raw_email_id: tx.raw_email_id,
      email_subject: tx.email_subject,
      email_date: tx.email_date,
      sender: tx.sender,
      transaction_type: tx.transaction_type,
      amount: tx.amount,
      currency: tx.currency,
      transaction_date: tx.transaction_date,
      description: tx.description,
      merchant: tx.merchant,
      category: tx.category,
      bank_name: tx.account_info.bank_name,
      account_number_partial: tx.account_info.account_number_partial,
      account_type: tx.account_info.account_type,
      confidence_score: tx.confidence_score,
      needs_review: tx.needs_review,
      parsing_notes: tx.parsing_notes,
      status: 'pending'
    }));

    const { error } = await supabase
      .from('parsed_transactions')
      .upsert(transactionData, { 
        onConflict: 'email_integration_id,raw_email_id',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Error storing parsed transactions:', error);
    } else {
      console.log(`Stored ${transactionData.length} transactions for manual review`);
    }
  }

  // Store discovered accounts
  private async storeDiscoveredAccounts(
    userId: string,
    emailIntegrationId: string,
    accounts: ParsedAccount[]
  ) {
    if (accounts.length === 0) return;

    const accountData = accounts.map(acc => ({
      user_id: userId,
      email_integration_id: emailIntegrationId,
      discovered_from_email_id: acc.discovered_from_email_id,
      discovery_method: 'email_parsing',
      bank_name: acc.bank_name,
      account_number_partial: acc.account_number_partial,
      account_type: acc.account_type,
      current_balance: acc.current_balance,
      account_holder_name: acc.account_holder_name,
      confidence_score: acc.confidence_score,
      needs_review: acc.needs_review,
      discovery_notes: acc.discovery_notes,
      status: 'pending'
    }));

    const { error } = await supabase
      .from('discovered_accounts')
      .upsert(accountData, { 
        onConflict: 'email_integration_id,bank_name,account_number_partial',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Error storing discovered accounts:', error);
    } else {
      console.log(`Stored ${accountData.length} discovered accounts`);
    }
  }

  // Store parsed data in database (legacy method - keeping for compatibility)
  private async storeParsedData(
    userId: string, 
    emailIntegrationId: string, 
    results: {
      transactions: ParsedTransaction[];
      accounts: ParsedAccount[];
      processed_count: number;
      errors: string[];
    }
  ) {
    try {
      console.log('Storing parsed data in database...');

      // Store parsed transactions
      if (results.transactions.length > 0) {
        const transactionData = results.transactions.map(tx => ({
          user_id: userId,
          email_integration_id: emailIntegrationId,
          raw_email_id: tx.raw_email_id,
          email_subject: tx.email_subject,
          email_date: tx.email_date,
          sender: tx.sender,
          transaction_type: tx.transaction_type,
          amount: tx.amount,
          currency: tx.currency,
          transaction_date: tx.transaction_date,
          description: tx.description,
          merchant: tx.merchant,
          category: tx.category,
          bank_name: tx.account_info.bank_name,
          account_number_partial: tx.account_info.account_number_partial,
          account_type: tx.account_info.account_type,
          confidence_score: tx.confidence_score,
          needs_review: tx.needs_review,
          parsing_notes: tx.parsing_notes,
          status: 'pending'
        }));

        const { error: txError } = await supabase
          .from('parsed_transactions')
          .upsert(transactionData, { 
            onConflict: 'email_integration_id,raw_email_id',
            ignoreDuplicates: true 
          });

        if (txError) {
          console.error('Error storing parsed transactions:', txError);
        } else {
          console.log(`Stored ${transactionData.length} parsed transactions`);
        }
      }

      // Store discovered accounts
      if (results.accounts.length > 0) {
        const accountData = results.accounts.map(acc => ({
          user_id: userId,
          email_integration_id: emailIntegrationId,
          discovered_from_email_id: acc.discovered_from_email_id,
          discovery_method: 'email_parsing',
          bank_name: acc.bank_name,
          account_number_partial: acc.account_number_partial,
          account_type: acc.account_type,
          current_balance: acc.current_balance,
          account_holder_name: acc.account_holder_name,
          confidence_score: acc.confidence_score,
          needs_review: acc.needs_review,
          discovery_notes: acc.discovery_notes,
          status: 'pending'
        }));

        const { error: accError } = await supabase
          .from('discovered_accounts')
          .upsert(accountData, { 
            onConflict: 'email_integration_id,bank_name,account_number_partial',
            ignoreDuplicates: true 
          });

        if (accError) {
          console.error('Error storing discovered accounts:', accError);
        } else {
          console.log(`Stored ${accountData.length} discovered accounts`);
        }
      }

    } catch (error) {
      console.error('Error storing parsed data:', error);
      // Don't throw error here as we still want to return the parsed results
    }
  }

  // Get unprocessed transactions for user
  async getUnprocessedTransactions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('unprocessed_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unprocessed transactions:', error);
      return [];
    }
  }

  // Get pending account discoveries for user
  async getPendingAccountDiscoveries(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('pending_account_discoveries')
        .select('*')
        .eq('user_id', userId)
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending account discoveries:', error);
      return [];
    }
  }

  // Reprocess emails without fetching new ones from Gmail API
  async reprocessStoredEmails(userId: string, emailIntegrationId: string): Promise<{
    transactions: ParsedTransaction[];
    accounts: ParsedAccount[];
    processed_count: number;
    errors: string[];
  }> {
    try {
      console.log('Reprocessing stored emails for user:', userId);
      
      // This is a placeholder - we need to store raw email content to make this work
      // For now, we'll need to re-fetch from Gmail but with a timestamp to avoid new emails
      
      // Get the integration details
      const { data: integration, error } = await supabase
        .from('email_integrations')
        .select('*')
        .eq('id', emailIntegrationId)
        .single();

      if (error || !integration) {
        throw new Error('Integration not found');
      }

      // Set last_sync to a past date temporarily to reprocess all emails
      const originalLastSync = integration.last_sync;
      await supabase
        .from('email_integrations')
        .update({ last_sync: null })
        .eq('id', emailIntegrationId);

      // Process emails normally (this will reprocess all emails from the past 30 days)
      const results = await this.processEmailsForUser(userId, emailIntegrationId);

      // Restore the original last_sync timestamp
      await supabase
        .from('email_integrations')
        .update({ last_sync: originalLastSync })
        .eq('id', emailIntegrationId);

      return results;
      
    } catch (error) {
      console.error('Error reprocessing stored emails:', error);
      throw new Error(`Failed to reprocess emails: ${error}`);
    }
  }
}

export const emailParsingService = new EmailParsingService();