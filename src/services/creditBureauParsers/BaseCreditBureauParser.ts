export interface CreditAccount {
  accountId: string;
  accountType: 'credit_card' | 'loan' | 'savings' | 'current' | 'investment' | 'overdraft' | 'unknown';
  accountSubType?: 'personal_loan' | 'home_loan' | 'auto_loan' | 'business_loan' | 'education_loan' | 'gold_loan' | 'secured_card' | 'unsecured_card';
  bankName: string;
  accountNumber: string;
  accountStatus: 'active' | 'closed' | 'settled' | 'written_off' | 'dormant' | 'unknown';
  
  // Financial details
  creditLimit?: number;
  currentBalance?: number;
  outstandingAmount?: number;
  availableCredit?: number;
  minimumAmountDue?: number;
  
  // Interest and charges
  interestRate?: number;
  annualFee?: number;
  latePaymentCharges?: number;
  
  // Dates
  accountOpenDate?: string;
  lastPaymentDate?: string;
  nextDueDate?: string;
  lastReportedDate?: string;
  
  // Payment history
  paymentHistory?: {
    totalMonthsReported?: number;
    delayedPayments?: number;
    onTimePayments?: number;
    highestDelayDays?: number;
  };
  
  // Additional details
  tenure?: number; // in months
  emiAmount?: number;
  collateral?: string;
  guarantor?: string;
  
  // Metadata
  confidenceScore: number;
  rawData: string;
  extractedFields: string[];
}

export interface CreditReportSummary {
  reportDate?: string;
  reportNumber?: string;
  creditScore?: number;
  scoreProvider?: string;
  totalAccounts: number;
  activeAccounts: number;
  closedAccounts: number;
  
  // Summary by account type
  creditCards: number;
  loans: number;
  
  // Financial summary
  totalCreditLimit?: number;
  totalOutstanding?: number;
  totalAvailableCredit?: number;
  
  // Inquiry summary
  recentInquiries?: number;
  
  errors: string[];
}

export interface CreditBureauParseResult {
  bureau: 'CIBIL' | 'Experian' | 'Equifax' | 'CRIF';
  summary: CreditReportSummary;
  accounts: CreditAccount[];
}

export abstract class BaseCreditBureauParser {
  abstract readonly bureauName: 'CIBIL' | 'Experian' | 'Equifax' | 'CRIF';
  
  /**
   * Parse credit report text and extract accounts
   */
  abstract parseReport(text: string): CreditBureauParseResult;
  
  /**
   * Check if this parser can handle the given text
   */
  abstract canParse(text: string): boolean;
  
  /**
   * Extract credit score from report
   */
  protected extractCreditScore(text: string): { score?: number; provider?: string } {
    const scorePatterns = [
      /(?:credit\s+score|score)[:\s]+(\d{3})/i,
      /(?:cibil|experian|equifax|crif)\s+score[:\s]+(\d{3})/i,
      /score[:\s]*(\d{3})\s*(?:out of|\/)\s*(?:900|850|999)/i,
    ];
    
    for (const pattern of scorePatterns) {
      const match = text.match(pattern);
      if (match) {
        const score = parseInt(match[1]);
        if (score >= 300 && score <= 900) {
          return { 
            score, 
            provider: this.extractScoreProvider(text) 
          };
        }
      }
    }
    
    return {};
  }
  
  /**
   * Extract score provider from text
   */
  private extractScoreProvider(text: string): string {
    const providers = ['CIBIL', 'Experian', 'Equifax', 'CRIF'];
    for (const provider of providers) {
      if (new RegExp(provider, 'i').test(text)) {
        return provider;
      }
    }
    return this.bureauName;
  }
  
  /**
   * Extract dates in various formats
   */
  protected extractDate(text: string, patterns: RegExp[]): string | undefined {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          // Try to parse and normalize the date
          const date = new Date(match[1]);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (error) {
          // If parsing fails, return the original match
          return match[1];
        }
      }
    }
    return undefined;
  }
  
  /**
   * Extract numeric values (amounts, percentages)
   */
  protected extractNumericValue(text: string, patterns: RegExp[]): number | undefined {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value)) {
          return value;
        }
      }
    }
    return undefined;
  }
  
  /**
   * Clean and normalize bank names
   */
  protected normalizeBankName(bankName: string): string {
    const bankMappings: { [key: string]: string } = {
      'HDFC': 'HDFC Bank',
      'ICICI': 'ICICI Bank',
      'SBI': 'State Bank of India',
      'AXIS': 'Axis Bank',
      'KOTAK': 'Kotak Mahindra Bank',
      'YES': 'Yes Bank',
      'INDUSIND': 'IndusInd Bank',
      'PNB': 'Punjab National Bank',
      'BOB': 'Bank of Baroda',
      'CANARA': 'Canara Bank',
      'UNION': 'Union Bank of India',
      'IDBI': 'IDBI Bank',
      'CENTRAL': 'Central Bank of India',
      'INDIAN': 'Indian Bank',
      'BOI': 'Bank of India',
      'CITI': 'Citibank',
      'AMEX': 'American Express',
      'SC': 'Standard Chartered',
      'RBL': 'RBL Bank',
      'AU': 'AU Small Finance Bank',
      'FEDERAL': 'Federal Bank',
      'SOUTH INDIAN': 'South Indian Bank',
      'BAJAJ': 'Bajaj Finance',
      'TATA': 'Tata Capital',
      'MAHINDRA': 'Mahindra Finance',
      'L&T': 'L&T Finance',
      'FULLERTON': 'Fullerton India'
    };
    
    const upperName = bankName.toUpperCase();
    for (const [key, value] of Object.entries(bankMappings)) {
      if (upperName.includes(key)) {
        return value;
      }
    }
    
    return bankName;
  }
  
  /**
   * Determine account type from text description
   */
  protected determineAccountType(text: string): { 
    accountType: CreditAccount['accountType']; 
    accountSubType?: CreditAccount['accountSubType'] 
  } {
    const textLower = text.toLowerCase();
    
    // Credit Cards
    if (textLower.includes('credit card') || textLower.includes('cc')) {
      if (textLower.includes('secured')) {
        return { accountType: 'credit_card', accountSubType: 'secured_card' };
      }
      return { accountType: 'credit_card', accountSubType: 'unsecured_card' };
    }
    
    // Loans
    if (textLower.includes('loan') || textLower.includes('emi')) {
      if (textLower.includes('home') || textLower.includes('housing') || textLower.includes('mortgage')) {
        return { accountType: 'loan', accountSubType: 'home_loan' };
      } else if (textLower.includes('personal')) {
        return { accountType: 'loan', accountSubType: 'personal_loan' };
      } else if (textLower.includes('auto') || textLower.includes('car') || textLower.includes('vehicle')) {
        return { accountType: 'loan', accountSubType: 'auto_loan' };
      } else if (textLower.includes('business') || textLower.includes('commercial')) {
        return { accountType: 'loan', accountSubType: 'business_loan' };
      } else if (textLower.includes('education') || textLower.includes('study')) {
        return { accountType: 'loan', accountSubType: 'education_loan' };
      } else if (textLower.includes('gold')) {
        return { accountType: 'loan', accountSubType: 'gold_loan' };
      }
      return { accountType: 'loan', accountSubType: 'personal_loan' };
    }
    
    // Bank accounts
    if (textLower.includes('savings') || textLower.includes('sb')) {
      return { accountType: 'savings' };
    }
    if (textLower.includes('current') || textLower.includes('ca')) {
      return { accountType: 'current' };
    }
    if (textLower.includes('overdraft') || textLower.includes('od')) {
      return { accountType: 'overdraft' };
    }
    
    // Investments
    if (textLower.includes('fixed deposit') || textLower.includes('fd') || 
        textLower.includes('mutual fund') || textLower.includes('investment')) {
      return { accountType: 'investment' };
    }
    
    return { accountType: 'unknown' };
  }
  
  /**
   * Calculate confidence score based on extracted data
   */
  protected calculateConfidenceScore(account: Partial<CreditAccount>): number {
    let score = 0.1; // Base score
    
    if (account.bankName) score += 0.2;
    if (account.accountNumber) score += 0.2;
    if (account.accountType && account.accountType !== 'unknown') score += 0.15;
    if (account.accountStatus) score += 0.1;
    if (account.creditLimit || account.currentBalance || account.outstandingAmount) score += 0.15;
    if (account.accountOpenDate) score += 0.1;
    if (account.extractedFields && account.extractedFields.length >= 5) score += 0.1;
    
    return Math.min(score, 1.0);
  }
}