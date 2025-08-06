import { BankParser, BankParserResult, ParsedTransaction, ParsedAccount } from './BankParserInterface';

export class AxisBankParser implements BankParser {
  
  getBankName(): string {
    return 'AXIS';
  }

  getBankPatterns(): RegExp[] {
    return [/axis|axis\s*bank/i];
  }

  canParse(subject: string, body: string, from: string): boolean {
    return this.getBankPatterns().some(pattern => pattern.test(from));
  }

  isTransactionEmail(subject: string, body: string, from: string): boolean {
    const bodyText = body.toLowerCase();
    const subjectText = subject.toLowerCase();
    
    console.log('🏦 Axis Bank - Validating transaction email:', { 
      subject: subject.substring(0, 100),
      bodyPreview: bodyText.substring(0, 200),
      from 
    });

    // 1. Must be from Axis Bank
    if (!this.canParse(subject, body, from)) {
      console.log('❌ Not from Axis Bank');
      return false;
    }

    // 2. Must have clear debit/credit indicator
    const hasDebitCredit = /amount\s+debited|amount\s+credited|debited|credited|debit|credit|dr\b|cr\b|withdrawn|received|charged|refund/i.test(bodyText) ||
                          /amount\s+debited|amount\s+credited|debited|credited|debit|credit|dr\b|cr\b|withdrawn|received|charged|refund/i.test(subjectText);
    
    if (!hasDebitCredit) {
      console.log('❌ No clear debit/credit indicator');
      return false;
    }

    // 3. Must have amount with currency (INR format)
    const hasAmount = /(?:rs\.?\s*|₹\s*|inr\s+)\d+(?:,\d+)*(?:\.\d+)?|(?:\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|₹|inr)/i.test(bodyText) ||
                     /(?:rs\.?\s*|₹\s*|inr\s+)\d+(?:,\d+)*(?:\.\d+)?|(?:\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|₹|inr)/i.test(subjectText);
    
    if (!hasAmount) {
      console.log('❌ No amount with currency found');
      return false;
    }

    // 4. Must have account indicator (XX format for Axis)
    const hasAccount = /account\s+number:\s*[x]+\d+|card\s*[*x]+\d+|\*{4}\d{4}|xxxx\d{4}|xx\d{4}/i.test(bodyText) ||
                      /account\s+number:\s*[x]+\d+|card\s*[*x]+\d+|\*{4}\d{4}|xxxx\d{4}|xx\d{4}/i.test(subjectText);
    
    if (!hasAccount) {
      console.log('❌ No account/card number found');
      return false;
    }

    console.log('✅ Valid Axis Bank transaction email detected');
    return true;
  }

  isPromotionalEmail(subject: string, body: string, from: string): boolean {
    const bodyText = body.toLowerCase();
    const subjectText = subject.toLowerCase();
    
    const promotionalPatterns = [
      /special\s+offer/i,
      /limited\s+time\s+offer/i,
      /discount\s+offer/i,
      /cashback\s+offer/i,
      /bonus\s+points/i,
      /win\s+prizes?/i,
      /congratulations.*won/i,
      /exclusive\s+deal/i,
      /claim\s+your\s+reward/i
    ];
    
    const isPromotional = promotionalPatterns.some(pattern => 
      pattern.test(bodyText) || pattern.test(subjectText)
    );
    
    if (isPromotional) {
      const matchedPattern = promotionalPatterns.find(pattern => 
        pattern.test(bodyText) || pattern.test(subjectText)
      );
      console.log('❌ Axis Bank promotional email detected - Pattern:', matchedPattern?.source);
      return true;
    }

    return false;
  }

  parseEmail(emailId: string, subject: string, from: string, date: string, body: string): BankParserResult | null {
    console.log('🏦 Parsing Axis Bank email...');
    
    if (!this.isTransactionEmail(subject, body, from)) {
      return null;
    }

    if (this.isPromotionalEmail(subject, body, from)) {
      return null;
    }

    const transaction = this.parseTransaction(emailId, subject, from, date, body);
    const account = this.parseAccountInfo(emailId, subject, from, body);

    return {
      transaction: transaction || undefined,
      account: account || undefined
    };
  }

  private parseTransaction(emailId: string, subject: string, from: string, date: string, body: string): ParsedTransaction | null {
    const bodyText = body;
    
    // Determine transaction type
    let transactionType: 'credit' | 'debit' | 'unknown' = 'unknown';
    if (/amount\s+debited|debited/i.test(bodyText)) {
      transactionType = 'debit';
    } else if (/amount\s+credited|credited/i.test(bodyText)) {
      transactionType = 'credit';
    }
    
    if (transactionType === 'unknown') {
      console.log('❌ Axis Bank - Could not determine transaction type:', subject);
      return null;
    }

    // Extract amount
    const amountRegex = /(?:rs\.?\s*|₹\s*|inr\s+)(\d+(?:,\d+)*(?:\.\d+)?)|(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs\.?|₹|inr)/i;
    const amountMatch = bodyText.match(amountRegex);
    const amount = amountMatch ? parseFloat((amountMatch[1] || amountMatch[2]).replace(/,/g, '')) : 0;
    
    if (amount <= 0) {
      console.log('❌ Axis Bank - No valid amount found:', subject);
      return null;
    }

    // Extract account info (XX3622 format for Axis)
    const accountRegex = /account\s+number:\s*([x]+\d{4})|xx(\d{4})/i;
    const accountMatch = bodyText.match(accountRegex);
    const accountPartial = accountMatch ? (accountMatch[1] || accountMatch[2]).replace(/[x]/gi, '') : undefined;
    
    if (!accountPartial) {
      console.log('❌ Axis Bank - No account number found:', subject);
      return null;
    }

    // Extract UPI merchant info (Axis Bank specific patterns)
    let description = subject;
    let merchant = undefined;
    
    // Axis UPI pattern: UPI/P2M/123456/MERCHANT
    const upiPatterns = [
      /upi\/p2m\/\d+\/([^\/\s\n]+)/i,
      /upi\/p2a\/\d+\/([^\/\s\n]+)/i,
    ];
    
    for (const pattern of upiPatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        const fullUpiMatch = bodyText.match(new RegExp(`(upi\/[^\\s\\n]+\/[^\\s\\n\/]+\/${match[1]})`, 'i'));
        if (fullUpiMatch) {
          description = fullUpiMatch[1].trim();
          merchant = match[1].trim();
          console.log('🏪 Axis Bank UPI info extracted:', { description, merchant });
          break;
        }
      }
    }

    // Calculate confidence score
    let confidence = 0.1;
    if (amount > 0) confidence += 0.3;
    if (accountPartial && accountPartial.length === 4) confidence += 0.3;
    if (transactionType !== 'unknown') confidence += 0.3;
    
    console.log('📊 Axis Bank Extracted Data:', {
      transactionType,
      amount,
      accountPartial,
      description: description.length > 50 ? description.substring(0, 50) + '...' : description,
      merchant: merchant || 'None extracted',
      confidence
    });
    
    return {
      id: `axis_${emailId}_${Date.now()}`,
      raw_email_id: emailId,
      email_subject: subject,
      email_date: date,
      sender: from,
      transaction_type: transactionType,
      amount,
      currency: 'INR',
      transaction_date: this.extractTransactionDate(bodyText) || date,
      description,
      merchant: merchant,
      category: this.categorizeTransaction(description),
      account_info: {
        bank_name: 'AXIS',
        account_number_partial: accountPartial,
        account_type: 'savings', // Default for Axis
      },
      confidence_score: confidence,
      needs_review: confidence < 0.9,
      parsing_notes: `Parsed by Axis Bank parser from ${from}`
    };
  }

  private parseAccountInfo(emailId: string, subject: string, from: string, body: string): ParsedAccount | null {
    // Axis Bank account discovery logic
    const bodyText = body;
    
    // Look for balance information
    const balanceMatch = bodyText.match(/(?:balance|bal)[\s:]*(?:rs\.?\s*|₹\s*|inr\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i);
    const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : undefined;
    
    // Extract account details
    const accountMatch = bodyText.match(/account\s+number:\s*([x]+\d{4})|xx(\d{4})/i);
    const accountPartial = accountMatch ? (accountMatch[1] || accountMatch[2]).replace(/[x]/gi, '') : undefined;

    if (!balance && !accountPartial) {
      return null;
    }

    return {
      id: `axis_account_${emailId}_${Date.now()}`,
      discovered_from_email_id: emailId,
      bank_name: 'AXIS',
      account_number_partial: accountPartial,
      account_type: 'savings',
      current_balance: balance,
      confidence_score: (accountPartial ? 0.5 : 0) + (balance ? 0.5 : 0),
      needs_review: true,
      discovery_notes: `Discovered from Axis Bank email: ${subject}`
    };
  }

  private extractTransactionDate(text: string): string | null {
    const dateMatch = text.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
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

  private categorizeTransaction(description: string): string {
    const text = description.toLowerCase();
    
    // Axis Bank specific categorization
    if (/cred|credit card/i.test(text)) return 'Credit Card Payment';
    if (/upi.*lounge|restaurant|food/i.test(text)) return 'Food & Dining';
    if (/upi.*transfer|p2a/i.test(text)) return 'Transfer';
    if (/upi.*p2m/i.test(text)) return 'UPI Payment';
    
    return 'Other';
  }
}