import { BankParser, BankParserResult, ParsedTransaction, ParsedAccount } from './BankParserInterface';

export class HdfcBankParser implements BankParser {
  
  getBankName(): string {
    return 'HDFC';
  }

  getBankPatterns(): RegExp[] {
    return [/hdfc|hdfc\s*bank/i];
  }

  canParse(subject: string, body: string, from: string): boolean {
    return this.getBankPatterns().some(pattern => pattern.test(from));
  }

  isTransactionEmail(subject: string, body: string, from: string): boolean {
    const bodyText = body.toLowerCase();
    const subjectText = subject.toLowerCase();
    
    console.log('🏦 HDFC Bank - Validating transaction email:', { 
      subject: subject.substring(0, 100),
      bodyPreview: bodyText.substring(0, 200),
      from 
    });

    // 1. Must be from HDFC Bank
    if (!this.canParse(subject, body, from)) {
      console.log('❌ Not from HDFC Bank');
      return false;
    }

    // 2. Must have clear debit/credit indicator (HDFC format: "has been debited/credited")
    const hasDebitCredit = /has been debited|has been credited|debited from|credited to/i.test(bodyText) ||
                          /has been debited|has been credited|debited from|credited to/i.test(subjectText);
    
    if (!hasDebitCredit) {
      console.log('❌ No clear HDFC debit/credit indicator');
      return false;
    }

    // 3. Must have amount with Rs. format (HDFC format: "Rs.184.24")
    const hasAmount = /rs\.\d+(?:\.\d+)?/i.test(bodyText) || /rs\.\d+(?:\.\d+)?/i.test(subjectText);
    
    if (!hasAmount) {
      console.log('❌ No HDFC amount format found');
      return false;
    }

    // 4. Must have account number (HDFC format: "from account 7312" or "to account 7312")
    const hasAccount = /(?:from|to)\s+account\s+\d{4}/i.test(bodyText) || 
                      /(?:from|to)\s+account\s+\d{4}/i.test(subjectText);
    
    if (!hasAccount) {
      console.log('❌ No HDFC account number found');
      return false;
    }

    console.log('✅ Valid HDFC Bank transaction email detected');
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
      /claim\s+your\s+reward/i,
      /apply\s+now/i,
      /upgrade\s+your/i
    ];
    
    const isPromotional = promotionalPatterns.some(pattern => 
      pattern.test(bodyText) || pattern.test(subjectText)
    );
    
    if (isPromotional) {
      const matchedPattern = promotionalPatterns.find(pattern => 
        pattern.test(bodyText) || pattern.test(subjectText)
      );
      console.log('❌ HDFC Bank promotional email detected - Pattern:', matchedPattern?.source);
      return true;
    }

    return false;
  }

  parseEmail(emailId: string, subject: string, from: string, date: string, body: string): BankParserResult | null {
    console.log('🏦 Parsing HDFC Bank email...');
    
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
    
    // Determine transaction type (HDFC format: "has been debited/credited")
    let transactionType: 'credit' | 'debit' | 'unknown' = 'unknown';
    if (/has been debited|debited from/i.test(bodyText)) {
      transactionType = 'debit';
    } else if (/has been credited|credited to/i.test(bodyText)) {
      transactionType = 'credit';
    }
    
    if (transactionType === 'unknown') {
      console.log('❌ HDFC Bank - Could not determine transaction type:', subject);
      return null;
    }

    // Extract amount (HDFC format: "Rs.184.24")
    const amountRegex = /rs\.(\d+(?:\.\d+)?)/i;
    const amountMatch = bodyText.match(amountRegex);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    if (amount <= 0) {
      console.log('❌ HDFC Bank - No valid amount found:', subject);
      return null;
    }

    // Extract account info (HDFC format: "from account 7312")
    const accountRegex = /(?:from|to)\s+account\s+(\d{4})/i;
    const accountMatch = bodyText.match(accountRegex);
    const accountPartial = accountMatch ? accountMatch[1] : undefined;
    
    if (!accountPartial) {
      console.log('❌ HDFC Bank - No account number found:', subject);
      return null;
    }

    // Extract merchant info (HDFC UPI format: "to VPA archminton117569.rzp@rxairtel ARCHMINTON")
    let description = subject;
    let merchant = undefined;
    
    // HDFC UPI VPA pattern
    const vpaPattern = /(?:to|from)\s+vpa\s+([^\s]+)\s+([A-Z\s]+)/i;
    const vpaMatch = bodyText.match(vpaPattern);
    
    if (vpaMatch) {
      const vpaId = vpaMatch[1]; // archminton117569.rzp@rxairtel
      const merchantName = vpaMatch[2].trim(); // ARCHMINTON
      description = `UPI to ${vpaId} (${merchantName})`;
      merchant = merchantName;
      console.log('🏪 HDFC Bank UPI VPA info extracted:', { description, merchant, vpaId });
    } else {
      // Try to extract reference number for description
      const refPattern = /upi transaction reference number is (\d+)/i;
      const refMatch = bodyText.match(refPattern);
      if (refMatch) {
        description = `UPI Transaction Ref: ${refMatch[1]}`;
      }
    }

    // Calculate confidence score
    let confidence = 0.1;
    if (amount > 0) confidence += 0.3;
    if (accountPartial && accountPartial.length === 4) confidence += 0.3;
    if (transactionType !== 'unknown') confidence += 0.3;
    
    console.log('📊 HDFC Bank Extracted Data:', {
      transactionType,
      amount,
      accountPartial,
      description: description.length > 50 ? description.substring(0, 50) + '...' : description,
      merchant: merchant || 'None extracted',
      confidence
    });
    
    return {
      id: `hdfc_${emailId}_${Date.now()}`,
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
      category: this.categorizeTransaction(description, merchant),
      account_info: {
        bank_name: 'HDFC',
        account_number_partial: accountPartial,
        account_type: 'savings', // Default for HDFC
      },
      confidence_score: confidence,
      needs_review: confidence < 0.9,
      parsing_notes: `Parsed by HDFC Bank parser from ${from}`
    };
  }

  private parseAccountInfo(emailId: string, subject: string, from: string, body: string): ParsedAccount | null {
    // HDFC Bank account discovery logic
    const bodyText = body;
    
    // Extract account details (HDFC format: "from account 7312")
    const accountMatch = bodyText.match(/(?:from|to)\s+account\s+(\d{4})/i);
    const accountPartial = accountMatch ? accountMatch[1] : undefined;

    if (!accountPartial) {
      return null;
    }

    return {
      id: `hdfc_account_${emailId}_${Date.now()}`,
      discovered_from_email_id: emailId,
      bank_name: 'HDFC',
      account_number_partial: accountPartial,
      account_type: 'savings',
      current_balance: undefined, // HDFC emails don't typically show balance
      confidence_score: 0.8, // High confidence for HDFC account format
      needs_review: true,
      discovery_notes: `Discovered from HDFC Bank email: ${subject}`
    };
  }

  private extractTransactionDate(text: string): string | null {
    // HDFC date format: "04-08-25"
    const dateMatch = text.match(/(\d{2}-\d{2}-\d{2})/);
    if (dateMatch) {
      try {
        const dateParts = dateMatch[1].split('-');
        const day = dateParts[0];
        const month = dateParts[1];
        const year = '20' + dateParts[2]; // Convert to full year
        const date = new Date(`${year}-${month}-${day}`);
        return date.toISOString();
      } catch {
        return null;
      }
    }
    return null;
  }

  private categorizeTransaction(description: string, merchant?: string): string {
    const text = `${description} ${merchant || ''}`.toLowerCase();
    
    // HDFC Bank specific categorization
    if (/archminton|sports|game/i.test(text)) return 'Entertainment';
    if (/upi.*vpa/i.test(text)) return 'UPI Transfer';
    if (/@.*paytm|@.*phonepe|@.*gpay/i.test(text)) return 'Digital Wallet';
    if (/ref:|reference/i.test(text)) return 'UPI Payment';
    
    return 'Other';
  }
}