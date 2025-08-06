import { BaseCreditBureauParser, CreditAccount, CreditBureauParseResult, CreditReportSummary } from './BaseCreditBureauParser';

export class CibilParser extends BaseCreditBureauParser {
  readonly bureauName = 'CIBIL' as const;

  canParse(text: string): boolean {
    const cibilIndicators = [
      /cibil/i,
      /transunion\s+cibil/i,
      /cibil\s+credit\s+report/i,
      /cibil.*score/i,
      /credit\s+information\s+bureau.*india/i
    ];
    
    return cibilIndicators.some(pattern => pattern.test(text));
  }

  parseReport(text: string): CreditBureauParseResult {
    const summary = this.extractSummary(text);
    const accounts = this.extractAccounts(text);
    
    return {
      bureau: 'CIBIL',
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
      /date\s+of\s+request[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    ]);

    // Extract CIBIL score
    const { score: creditScore, provider: scoreProvider } = this.extractCreditScore(text);

    // Extract recent inquiries
    const recentInquiries = this.extractNumericValue(text, [
      /(?:recent\s+)?inquir(?:y|ies)[:\s]+(\d+)/i,
      /(\d+)\s+inquir(?:y|ies)\s+in\s+last/i,
    ]);

    return {
      reportDate,
      creditScore,
      scoreProvider: scoreProvider || 'CIBIL',
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
    
    // CIBIL-specific section splitting
    const sections = this.splitIntoCibilSections(text);
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const account = this.extractCibilAccount(section, i);
      
      if (account && this.isValidCibilAccount(account)) {
        accounts.push(account);
      }
    }
    
    return accounts;
  }

  private splitIntoCibilSections(text: string): string[] {
    // CIBIL-specific patterns for splitting
    const sections = text.split(/(?:account\s+summary|credit\s+facility|loan\s+account)/i);
    
    // Filter meaningful sections
    return sections.filter(section => section.trim().length > 100);
  }

  private extractCibilAccount(section: string, index: number): CreditAccount | null {
    // This will be implemented when you provide CIBIL report format
    // For now, return a placeholder structure
    
    const extractedFields: string[] = [];
    
    // Extract basic information
    const bankName = this.extractBankName(section);
    if (!bankName) return null;
    
    const accountNumber = this.extractAccountNumber(section);
    if (!accountNumber) return null;
    
    const { accountType, accountSubType } = this.determineAccountType(section);
    
    const account: CreditAccount = {
      accountId: `cibil_${index}_${Date.now()}`,
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

  private isValidCibilAccount(account: CreditAccount): boolean {
    return account.bankName.length > 0 && 
           account.accountNumber.length >= 4 &&
           account.confidenceScore >= 0.3;
  }

  // Placeholder methods - will be implemented based on CIBIL format
  private extractBankName(text: string): string | null {
    // To be implemented based on CIBIL report structure
    return null;
  }

  private extractAccountNumber(text: string): string | null {
    // To be implemented based on CIBIL report structure
    return null;
  }
}