import { BaseCreditBureauParser, CreditAccount, CreditBureauParseResult, CreditReportSummary } from './BaseCreditBureauParser';

export class CrifParser extends BaseCreditBureauParser {
  readonly bureauName = 'CRIF' as const;

  canParse(text: string): boolean {
    const crifIndicators = [
      /crif/i,
      /high\s+mark/i,
      /crif\s+high\s+mark/i,
      /crif.*credit.*report/i,
      /high\s+mark.*credit/i
    ];
    
    return crifIndicators.some(pattern => pattern.test(text));
  }

  parseReport(text: string): CreditBureauParseResult {
    const summary = this.extractSummary(text);
    const accounts = this.extractAccounts(text);
    
    return {
      bureau: 'CRIF',
      summary: {
        ...summary,
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter(acc => acc.accountStatus === 'active').length,
        closedAccounts: accounts.filter(acc => acc.accountStatus === 'closed').length,
        creditCards: accounts.filter(acc => acc.accountType === 'credit_card').length,
        loans: accounts.filter(acc => acc.accountType === 'loan').length,
      },
      accounts
    };
  }

  private extractSummary(text: string): CreditReportSummary {
    const errors: string[] = [];
    
    // Extract report date
    const reportDate = this.extractDate(text, [
      /report\s+date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /generated\s+on[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /report\s+as\s+on[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    ]);

    // Extract CRIF score
    const { score: creditScore, provider: scoreProvider } = this.extractCreditScore(text);

    // Extract recent inquiries
    const recentInquiries = this.extractNumericValue(text, [
      /(?:recent\s+)?inquir(?:y|ies)[:\s]+(\d+)/i,
      /(\d+)\s+inquir(?:y|ies)\s+in\s+last/i,
    ]);

    return {
      reportDate,
      creditScore,
      scoreProvider: scoreProvider || 'CRIF',
      recentInquiries,
      totalAccounts: 0,
      activeAccounts: 0,
      closedAccounts: 0,
      creditCards: 0,
      loans: 0,
      errors
    };
  }

  private extractAccounts(text: string): CreditAccount[] {
    const accounts: CreditAccount[] = [];
    
    // CRIF-specific section splitting
    const sections = this.splitIntoCrifSections(text);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const account = this.extractCrifAccount(section, i);
      
      if (account && this.isValidCrifAccount(account)) {
        accounts.push(account);
      }
    }
    
    return accounts;
  }

  private splitIntoCrifSections(text: string): string[] {
    // CRIF-specific patterns for splitting
    const sections = text.split(/(?:account\s+information|credit\s+facilities|loan\s+details)/i);
    
    // Filter meaningful sections
    return sections.filter(section => section.trim().length > 100);
  }

  private extractCrifAccount(section: string, index: number): CreditAccount | null {
    // This will be implemented when you provide CRIF report format
    // For now, return a placeholder structure
    
    const extractedFields: string[] = [];
    
    // Extract basic information
    const bankName = this.extractBankName(section);
    if (!bankName) return null;
    
    const accountNumber = this.extractAccountNumber(section);
    if (!accountNumber) return null;
    
    const { accountType, accountSubType } = this.determineAccountType(section);
    
    const account: CreditAccount = {
      accountId: `crif_${index}_${Date.now()}`,
      accountType,
      accountSubType,
      bankName: this.normalizeBankName(bankName),
      accountNumber,
      accountStatus: 'active', // Will be extracted properly when format is known
      
      rawData: section.substring(0, 500),
      extractedFields,
      confidenceScore: 0.5 // Placeholder
    };
    
    account.confidenceScore = this.calculateConfidenceScore(account);
    
    return account;
  }

  private isValidCrifAccount(account: CreditAccount): boolean {
    return account.bankName.length > 0 && 
           account.accountNumber.length >= 4 &&
           account.confidenceScore >= 0.3;
  }

  // Placeholder methods - will be implemented based on CRIF format
  private extractBankName(text: string): string | null {
    // To be implemented based on CRIF report structure
    return null;
  }

  private extractAccountNumber(text: string): string | null {
    // To be implemented based on CRIF report structure
    return null;
  }
}