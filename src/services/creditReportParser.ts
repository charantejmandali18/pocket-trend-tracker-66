import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import type { UnprocessedAccount } from '@/services/gmailOAuth';

// Configure PDF.js worker - use local worker file
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.js';
}

export interface CreditReportAccount {
  accountType: 'credit_card' | 'loan' | 'savings' | 'current' | 'investment' | 'unknown';
  bankName: string;
  accountNumber: string;
  accountStatus: 'active' | 'closed' | 'dormant';
  balance?: number;
  creditLimit?: number;
  tenure?: string;
  openDate?: string;
  lastPaymentDate?: string;
  rawText: string;
  confidenceScore: number;
}

export interface CreditReportParseResult {
  reportDate?: string;
  reportType?: string;
  accounts: CreditReportAccount[];
  totalAccounts: number;
  activeAccounts: number;
  errors: string[];
}

class CreditReportParser {
  
  /**
   * Parse credit report PDF and extract active accounts
   */
  async parseCreditReport(
    file: File, 
    password?: string
  ): Promise<CreditReportParseResult> {
    try {
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      
      // Try to unlock PDF if password provided
      if (password) {
        await this.unlockPDF(arrayBuffer, password);
      }
      
      // Extract text from PDF
      const textContent = await this.extractTextFromPDF(arrayBuffer, password);
      
      // Parse the text content
      const parseResult = this.parseTextContent(textContent);
      
      console.log('Credit Report Parse Result:', parseResult);
      return parseResult;
      
    } catch (error) {
      console.error('Error parsing credit report:', error);
      throw new Error(`Failed to parse credit report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if PDF is password protected
   */
  async isPDFPasswordProtected(file: File): Promise<boolean> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Try to load the document with retries for worker issues
      let pdf;
      let retries = 3;
      
      while (retries > 0) {
        try {
          pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          break;
        } catch (workerError: any) {
          if (workerError.message?.includes('Setting up fake worker failed') || 
              workerError.message?.includes('Failed to fetch dynamically imported module')) {
            console.warn('PDF worker issue, retrying with different configuration...', retries);
            retries--;
            
            if (retries === 2) {
              // Try with jsdelivr CDN
              pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
            } else if (retries === 1) {
              // Try with unpkg CDN
              pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
            } else if (retries === 0) {
              // Last resort - disable worker (slower but functional)
              pdfjsLib.GlobalWorkerOptions.workerSrc = false;
            }
            
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          }
          throw workerError;
        }
      }
      
      if (!pdf) {
        throw new Error('Failed to load PDF after multiple attempts');
      }
      
      // If we can get the PDF without error, it's not password protected
      await pdf.getPage(1);
      return false;
    } catch (error: any) {
      // Check if the error is related to password protection
      if (error.message?.includes('password') || error.name === 'PasswordException') {
        return true;
      }
      console.error('Error checking PDF password protection:', error);
      throw new Error(`Failed to check PDF: ${error.message}`);
    }
  }

  /**
   * Unlock password-protected PDF
   */
  private async unlockPDF(arrayBuffer: ArrayBuffer, password: string): Promise<void> {
    try {
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        password: password
      }).promise;
      
      // Try to access first page to verify password
      await pdf.getPage(1);
    } catch (error) {
      throw new Error('Incorrect password or failed to unlock PDF');
    }
  }

  /**
   * Extract text content from PDF
   */
  private async extractTextFromPDF(arrayBuffer: ArrayBuffer, password?: string): Promise<string> {
    let pdf;
    let retries = 3;
    
    // Try to load the document with retries for worker issues
    while (retries > 0) {
      try {
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          password: password 
        });
        
        pdf = await loadingTask.promise;
        break;
      } catch (workerError: any) {
        if (workerError.message?.includes('Setting up fake worker failed') || 
            workerError.message?.includes('Failed to fetch dynamically imported module')) {
          console.warn('PDF worker issue during text extraction, retrying...', retries);
          retries--;
          
          if (retries === 2) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
          } else if (retries === 1) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
          } else if (retries === 0) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = false;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        throw workerError;
      }
    }
    
    if (!pdf) {
      throw new Error('Failed to load PDF for text extraction after multiple attempts');
    }
    
    const numPages = pdf.numPages;
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
        // Continue with other pages
      }
    }
    
    return fullText;
  }

  /**
   * Parse text content and extract account information
   */
  private parseTextContent(text: string): CreditReportParseResult {
    const accounts: CreditReportAccount[] = [];
    const errors: string[] = [];
    
    try {
      // Detect credit report type
      const reportType = this.detectReportType(text);
      const reportDate = this.extractReportDate(text);
      
      // Extract accounts based on report type
      if (reportType === 'CIBIL') {
        accounts.push(...this.parseCIBILReport(text));
      } else if (reportType === 'Experian') {
        accounts.push(...this.parseExperianReport(text));
      } else if (reportType === 'Equifax') {
        accounts.push(...this.parseEquifaxReport(text));
      } else if (reportType === 'CRIF') {
        accounts.push(...this.parseCRIFReport(text));
      } else {
        // Generic parsing for unknown formats
        accounts.push(...this.parseGenericReport(text));
      }
      
      // Filter for active accounts only
      const activeAccounts = accounts.filter(account => 
        account.accountStatus === 'active'
      );
      
      return {
        reportDate,
        reportType,
        accounts: activeAccounts,
        totalAccounts: accounts.length,
        activeAccounts: activeAccounts.length,
        errors
      };
      
    } catch (error) {
      errors.push(`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        accounts: [],
        totalAccounts: 0,
        activeAccounts: 0,
        errors
      };
    }
  }

  /**
   * Detect credit report type from text content
   */
  private detectReportType(text: string): string {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('cibil') || textLower.includes('transunion cibil')) {
      return 'CIBIL';
    } else if (textLower.includes('experian')) {
      return 'Experian';
    } else if (textLower.includes('equifax')) {
      return 'Equifax';
    } else if (textLower.includes('crif') || textLower.includes('high mark')) {
      return 'CRIF';
    }
    
    return 'Unknown';
  }

  /**
   * Extract report date from text
   */
  private extractReportDate(text: string): string | undefined {
    // Look for various date patterns
    const datePatterns = [
      /report\s+date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /generated\s+on[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /as\s+on[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return undefined;
  }

  /**
   * Parse CIBIL credit report format
   */
  private parseCIBILReport(text: string): CreditReportAccount[] {
    const accounts: CreditReportAccount[] = [];
    
    // CIBIL specific patterns
    const accountSections = text.split(/account\s+details|credit\s+facility/i);
    
    for (const section of accountSections) {
      const account = this.extractAccountFromSection(section, 'CIBIL');
      if (account) {
        accounts.push(account);
      }
    }
    
    return accounts;
  }

  /**
   * Parse Experian credit report format
   */
  private parseExperianReport(text: string): CreditReportAccount[] {
    const accounts: CreditReportAccount[] = [];
    
    // Experian specific patterns
    const accountSections = text.split(/account\s+information|credit\s+accounts/i);
    
    for (const section of accountSections) {
      const account = this.extractAccountFromSection(section, 'Experian');
      if (account) {
        accounts.push(account);
      }
    }
    
    return accounts;
  }

  /**
   * Parse Equifax credit report format
   */
  private parseEquifaxReport(text: string): CreditReportAccount[] {
    const accounts: CreditReportAccount[] = [];
    
    // Equifax specific patterns
    const accountSections = text.split(/account\s+details|credit\s+information/i);
    
    for (const section of accountSections) {
      const account = this.extractAccountFromSection(section, 'Equifax');
      if (account) {
        accounts.push(account);
      }
    }
    
    return accounts;
  }

  /**
   * Parse CRIF credit report format
   */
  private parseCRIFReport(text: string): CreditReportAccount[] {
    const accounts: CreditReportAccount[] = [];
    
    // CRIF specific patterns
    const accountSections = text.split(/account\s+summary|credit\s+facilities/i);
    
    for (const section of accountSections) {
      const account = this.extractAccountFromSection(section, 'CRIF');
      if (account) {
        accounts.push(account);
      }
    }
    
    return accounts;
  }

  /**
   * Generic parser for unknown report formats
   */
  private parseGenericReport(text: string): CreditReportAccount[] {
    const accounts: CreditReportAccount[] = [];
    
    // Look for common account indicators
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for bank names and account patterns
      if (this.containsBankName(line) || this.containsAccountNumber(line)) {
        const contextLines = lines.slice(Math.max(0, i - 2), i + 5).join(' ');
        const account = this.extractAccountFromSection(contextLines, 'Generic');
        
        if (account && !accounts.find(a => a.accountNumber === account.accountNumber)) {
          accounts.push(account);
        }
      }
    }
    
    return accounts;
  }

  /**
   * Extract account information from a text section
   */
  private extractAccountFromSection(section: string, reportType: string): CreditReportAccount | null {
    try {
      const bankName = this.extractBankName(section);
      const accountNumber = this.extractAccountNumber(section);
      const accountType = this.extractAccountType(section);
      const accountStatus = this.extractAccountStatus(section);
      
      // Must have bank name and account number to be valid
      if (!bankName || !accountNumber) {
        return null;
      }
      
      // Only include active accounts
      if (accountStatus !== 'active') {
        return null;
      }
      
      const balance = this.extractBalance(section);
      const creditLimit = this.extractCreditLimit(section);
      const openDate = this.extractOpenDate(section);
      const lastPaymentDate = this.extractLastPaymentDate(section);
      
      // Calculate confidence score based on extracted data
      let confidenceScore = 0.3; // Base score
      if (bankName) confidenceScore += 0.3;
      if (accountNumber) confidenceScore += 0.2;
      if (balance || creditLimit) confidenceScore += 0.1;
      if (openDate) confidenceScore += 0.1;
      
      return {
        accountType,
        bankName,
        accountNumber,
        accountStatus,
        balance,
        creditLimit,
        openDate,
        lastPaymentDate,
        rawText: section.substring(0, 200), // First 200 chars for reference
        confidenceScore: Math.min(confidenceScore, 1.0)
      };
      
    } catch (error) {
      console.error('Error extracting account from section:', error);
      return null;
    }
  }

  /**
   * Extract bank name from text section
   */
  private extractBankName(text: string): string | null {
    const bankPatterns = [
      // Major Indian banks
      /\b(HDFC|ICICI|SBI|State Bank|Axis|Kotak|Yes Bank|IndusInd|PNB|Bank of Baroda|Canara Bank|Union Bank|IDBI|Central Bank|Indian Bank|Bank of India)\b/gi,
      // Credit card companies
      /\b(American Express|Amex|Citibank|Standard Chartered|RBL|AU Small Finance|Federal Bank|South Indian Bank)\b/gi,
      // NBFC patterns
      /\b(Bajaj Finance|Tata Capital|Mahindra Finance|L&T Finance|Fullerton India|Capital First)\b/gi
    ];
    
    for (const pattern of bankPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
    
    return null;
  }

  /**
   * Extract account number from text section
   */
  private extractAccountNumber(text: string): string | null {
    const accountPatterns = [
      /account\s*number[:\s]+([X\*\d]{4,})/i,
      /a\/c\s*no[:\s\.]+([X\*\d]{4,})/i,
      /card\s*number[:\s]+([X\*\d]{4,})/i,
      /\b([X\*]{8,}\d{4})\b/g,
      /\b([X\*]{4}\d{4,})\b/g,
    ];
    
    for (const pattern of accountPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  /**
   * Extract account type from text section
   */
  private extractAccountType(text: string): CreditReportAccount['accountType'] {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('credit card') || textLower.includes('cc')) {
      return 'credit_card';
    } else if (textLower.includes('home loan') || textLower.includes('housing loan') || 
               textLower.includes('personal loan') || textLower.includes('loan')) {
      return 'loan';
    } else if (textLower.includes('savings') || textLower.includes('sb')) {
      return 'savings';
    } else if (textLower.includes('current') || textLower.includes('ca')) {
      return 'current';
    } else if (textLower.includes('fixed deposit') || textLower.includes('fd') || 
               textLower.includes('mutual fund') || textLower.includes('investment')) {
      return 'investment';
    }
    
    return 'unknown';
  }

  /**
   * Extract account status from text section
   */
  private extractAccountStatus(text: string): CreditReportAccount['accountStatus'] {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('active') || textLower.includes('current') || textLower.includes('open')) {
      return 'active';
    } else if (textLower.includes('closed') || textLower.includes('settled')) {
      return 'closed';
    } else if (textLower.includes('dormant') || textLower.includes('inactive')) {
      return 'dormant';
    }
    
    // Default to active if status is unclear but account seems valid
    return 'active';
  }

  /**
   * Extract balance from text section
   */
  private extractBalance(text: string): number | undefined {
    const balancePatterns = [
      /balance[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /outstanding[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /current\s+balance[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
    ];
    
    for (const pattern of balancePatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    
    return undefined;
  }

  /**
   * Extract credit limit from text section
   */
  private extractCreditLimit(text: string): number | undefined {
    const limitPatterns = [
      /credit\s+limit[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /limit[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /sanctioned\s+amount[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
    ];
    
    for (const pattern of limitPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    
    return undefined;
  }

  /**
   * Extract account opening date
   */
  private extractOpenDate(text: string): string | undefined {
    const datePatterns = [
      /opened?\s+on[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /date\s+opened[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /account\s+opened[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return undefined;
  }

  /**
   * Extract last payment date
   */
  private extractLastPaymentDate(text: string): string | undefined {
    const datePatterns = [
      /last\s+payment[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /payment\s+date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return undefined;
  }

  /**
   * Check if text contains a bank name
   */
  private containsBankName(text: string): boolean {
    return /\b(HDFC|ICICI|SBI|Axis|Kotak|Yes Bank|IndusInd|PNB|Canara|Union Bank|IDBI|Citibank|American Express|Bajaj Finance)\b/i.test(text);
  }

  /**
   * Check if text contains an account number pattern
   */
  private containsAccountNumber(text: string): boolean {
    return /\b([X\*]{4,}\d{4,}|account\s*number|\d{4,}[X\*]{4,})\b/i.test(text);
  }

  /**
   * Convert credit report accounts to unprocessed accounts format
   */
  convertToUnprocessedAccounts(
    userId: string, 
    accounts: CreditReportAccount[]
  ): Omit<UnprocessedAccount, 'id' | 'created_at'>[] {
    return accounts.map(account => ({
      user_id: userId,
      source_email_integration_id: 'credit_report_upload', // Special identifier for credit reports
      discovered_account_name: `${account.bankName} - ${account.accountType}`,
      bank_name: account.bankName,
      account_type: account.accountType,
      balance: account.balance,
      account_number_partial: account.accountNumber.slice(-4),
      confidence_score: account.confidenceScore,
      needs_review: account.confidenceScore < 0.8, // High confidence accounts don't need review
      status: 'pending' as const,
      discovery_date: new Date().toISOString(),
    }));
  }
}

export const creditReportParser = new CreditReportParser();