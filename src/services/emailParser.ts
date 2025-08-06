import { gmailOAuthService } from './gmailOAuth';
import { supabase } from '@/integrations/supabase/client';
import { convert } from 'html-to-text';
import { BankParserFactory } from './bankParsers/BankParserFactory';
import type { ParsedTransaction, ParsedAccount } from './bankParsers/BankParserInterface';

// Re-export types for compatibility
export type { ParsedTransaction, ParsedAccount } from './bankParsers/BankParserInterface';

class EmailParsingService {

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

  // Parse individual email message using bank-specific parsers
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

      // Extract email body using improved HTML-to-text conversion
      const body = this.extractEmailBody(message.payload);
      
      console.log('🔍 Processing email with bank-specific parsers:', { 
        subject: subject.substring(0, 100), 
        from, 
        bodyLength: body.length,
        supportedBanks: BankParserFactory.getSupportedBanks()
      });

      // Log the full email body for debugging
      console.log('📧 Full Email Body Content:');
      console.log('================================');
      console.log(body);
      console.log('================================');

      // 1. Find the appropriate bank parser
      const bankParser = BankParserFactory.getParserForEmail(subject, body, from);
      
      if (!bankParser) {
        console.log('❌ No bank parser found for this email - skipping');
        return result;
      }

      console.log(`🏦 Using ${bankParser.getBankName()} parser`);

      // 2. Use bank-specific parser to extract transaction and account data
      const parseResult = bankParser.parseEmail(message.id, subject, from, date, body);
      
      if (parseResult) {
        if (parseResult.transaction) {
          result.transaction = parseResult.transaction;
          console.log('✅ Transaction parsed successfully');
        }
        
        if (parseResult.account) {
          result.account = parseResult.account;
          console.log('✅ Account discovered successfully');
        }
      } else {
        console.log('❌ Bank parser returned no results');
      }

    } catch (error) {
      console.error('Error parsing email message:', error);
    }

    return result;
  }

  // Extract email body with improved HTML-to-text conversion
  private extractEmailBody(payload: any): string {
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

  // Convert HTML to plain text using html-to-text library
  private htmlToText(html: string): string {
    try {
      return convert(html, {
        wordwrap: false,
        preserveNewlines: true,
        selectors: [
          // Remove script and style content
          { selector: 'script', format: 'skip' },
          { selector: 'style', format: 'skip' },
          // Keep important elements
          { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
          { selector: 'br', format: 'lineBreak' },
          { selector: 'div', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        ]
      }).trim();
    } catch (error) {
      console.error('Error converting HTML to text:', error);
      // Fallback to simple DOM parsing
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const scripts = tempDiv.querySelectorAll('script, style');
      scripts.forEach(script => script.remove());
      return (tempDiv.textContent || tempDiv.innerText || '').trim();
    }
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