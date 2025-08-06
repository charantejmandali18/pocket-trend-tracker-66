import { BaseCreditBureauParser, CreditAccount, CreditBureauParseResult, CreditReportSummary } from './BaseCreditBureauParser';

export class ExperianParser extends BaseCreditBureauParser {
  readonly bureauName = 'Experian' as const;

  canParse(text: string): boolean {
    const experianIndicators = [
      /experian/i,
      /experian\s+credit\s+report/i,
      /experian\s+information\s+solutions/i,
      /experian.*credit.*bureau/i
    ];
    
    const canParse = experianIndicators.some(pattern => pattern.test(text));
    console.log(`🔍 Experian canParse check: ${canParse}`);
    if (canParse) {
      console.log('✅ Detected as Experian report');
    }
    
    return canParse;
  }

  parseReport(text: string): CreditBureauParseResult {
    console.log('🚀 Starting Experian report parsing...');
    console.log(`📄 Text length: ${text.length} characters`);
    
    const summary = this.extractSummary(text);
    console.log('📊 Summary extracted:', summary);
    
    const accounts = this.extractAccounts(text);
    console.log(`💳 Total accounts found: ${accounts.length}`);
    
    const activeAccounts = accounts.filter(acc => acc.accountStatus === 'active');
    console.log(`✅ Active accounts: ${activeAccounts.length}`);
    
    accounts.forEach((acc, i) => {
      console.log(`Account ${i + 1}: ${acc.bankName} - ${acc.accountType} - ${acc.accountStatus} - Balance: ${acc.currentBalance}`);
    });
    
    return {
      bureau: 'Experian',
      summary: {
        ...summary,
        totalAccounts: accounts.length,
        activeAccounts: activeAccounts.length,
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
      /as\s+on[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    ]);

    // Extract report number
    const reportNumberMatch = text.match(/report\s+(?:number|id)[:\s]+([A-Z0-9\-]+)/i);
    const reportNumber = reportNumberMatch ? reportNumberMatch[1] : undefined;

    // Extract credit score
    const { score: creditScore, provider: scoreProvider } = this.extractCreditScore(text);

    // Extract recent inquiries
    const recentInquiries = this.extractNumericValue(text, [
      /(?:recent\s+)?inquir(?:y|ies)[:\s]+(\d+)/i,
      /(\d+)\s+inquir(?:y|ies)/i,
    ]);

    return {
      reportDate,
      reportNumber,
      creditScore,
      scoreProvider,
      recentInquiries,
      totalAccounts: 0, // Will be updated by caller
      activeAccounts: 0,
      closedAccounts: 0,
      creditCards: 0,
      loans: 0,
      errors
    };
  }

  private extractAccounts(text: string): CreditAccount[] {
    const accounts: CreditAccount[] = [];
    
    // First, try to parse from the summary table (most reliable)
    const summaryAccounts = this.parseAccountSummaryTable(text);
    if (summaryAccounts.length > 0) {
      accounts.push(...summaryAccounts);
    } else {
      // Fallback to section-based parsing
      const sections = this.splitIntoAccountSections(text);
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const account = this.extractAccountFromSection(section, i);
        
        if (account && this.isValidAccount(account)) {
          accounts.push(account);
        }
      }
    }
    
    return accounts;
  }

  private parseAccountSummaryTable(text: string): CreditAccount[] {
    const accounts: CreditAccount[] = [];
    
    try {
      // Look for the account summary table section
      const summarySection = this.extractSummarySection(text);
      if (!summarySection) {
        console.log('No summary section found in Experian report');
        return accounts;
      }

      // Parse each account entry in the table format
      const accountMatches = this.extractAccountEntries(summarySection);
      console.log(`Found ${accountMatches.length} account entries in summary`);
      
      for (const match of accountMatches) {
        const account = this.parseAccountEntry(match);
        if (account) {
          accounts.push(account);
          console.log(`Parsed account: ${account.bankName} - ${account.accountType} - ${account.accountStatus}`);
        }
      }
      
      console.log(`Extracted ${accounts.length} accounts from Experian summary table`);
      
    } catch (error) {
      console.error('Error parsing Experian account summary table:', error);
    }
    
    return accounts;
  }

  private splitIntoAccountSections(text: string): string[] {
    // Split by common Experian section delimiters
    const sectionDelimiters = [
      /(?:account\s+details|credit\s+facility|loan\s+account|card\s+account)/i,
      /(?:\n\s*\n|\r\n\s*\r\n)(?=.*(?:account|card|loan))/i,
      /(?:member\s+name|lender|bank)[:\s]+/i
    ];
    
    // Try different splitting strategies
    let sections: string[] = [];
    
    // Strategy 1: Split by major section headers
    sections = text.split(/(?:account\s+details|credit\s+account|loan\s+account)/i);
    
    if (sections.length < 3) {
      // Strategy 2: Split by bank/lender names
      sections = text.split(/(?:member\s+name|lender|bank)[:\s]+[A-Z\s&]+/i);
    }
    
    if (sections.length < 3) {
      // Strategy 3: Split by account number patterns
      sections = text.split(/(?:account\s+number|a\/c\s+no)[:\s]+[X\*\d]+/i);
    }
    
    // Filter out very short sections
    return sections.filter(section => section.trim().length > 50);
  }

  private extractAccountFromSection(section: string, index: number): CreditAccount | null {
    const extractedFields: string[] = [];
    
    // Extract bank name
    const bankName = this.extractBankName(section);
    if (bankName) extractedFields.push('bankName');
    
    // Extract account number
    const accountNumber = this.extractAccountNumber(section);
    if (accountNumber) extractedFields.push('accountNumber');
    
    // Determine account type
    const { accountType, accountSubType } = this.determineAccountType(section);
    if (accountType !== 'unknown') extractedFields.push('accountType');
    
    // Extract account status
    const accountStatus = this.extractAccountStatus(section);
    if (accountStatus) extractedFields.push('accountStatus');
    
    // Extract financial details
    const creditLimit = this.extractCreditLimit(section);
    if (creditLimit) extractedFields.push('creditLimit');
    
    const currentBalance = this.extractCurrentBalance(section);
    if (currentBalance) extractedFields.push('currentBalance');
    
    const outstandingAmount = this.extractOutstandingAmount(section);
    if (outstandingAmount) extractedFields.push('outstandingAmount');
    
    const minimumAmountDue = this.extractMinimumAmountDue(section);
    if (minimumAmountDue) extractedFields.push('minimumAmountDue');
    
    // Extract interest and charges
    const interestRate = this.extractInterestRate(section);
    if (interestRate) extractedFields.push('interestRate');
    
    const annualFee = this.extractAnnualFee(section);
    if (annualFee) extractedFields.push('annualFee');
    
    // Extract dates
    const accountOpenDate = this.extractAccountOpenDate(section);
    if (accountOpenDate) extractedFields.push('accountOpenDate');
    
    const lastPaymentDate = this.extractLastPaymentDate(section);
    if (lastPaymentDate) extractedFields.push('lastPaymentDate');
    
    const nextDueDate = this.extractNextDueDate(section);
    if (nextDueDate) extractedFields.push('nextDueDate');
    
    // Extract loan-specific details
    const tenure = this.extractTenure(section);
    if (tenure) extractedFields.push('tenure');
    
    const emiAmount = this.extractEMIAmount(section);
    if (emiAmount) extractedFields.push('emiAmount');
    
    // Extract payment history
    const paymentHistory = this.extractPaymentHistory(section);
    if (paymentHistory) extractedFields.push('paymentHistory');
    
    // Must have at least bank name and account number to be valid
    if (!bankName || !accountNumber) {
      return null;
    }
    
    // Calculate available credit
    const availableCredit = creditLimit && outstandingAmount 
      ? Math.max(0, creditLimit - outstandingAmount) 
      : undefined;
    
    const account: CreditAccount = {
      accountId: `experian_${index}_${Date.now()}`,
      accountType,
      accountSubType,
      bankName: this.normalizeBankName(bankName),
      accountNumber,
      accountStatus: accountStatus || 'active',
      
      // Financial details
      creditLimit,
      currentBalance,
      outstandingAmount,
      availableCredit,
      minimumAmountDue,
      
      // Interest and charges
      interestRate,
      annualFee,
      
      // Dates
      accountOpenDate,
      lastPaymentDate,
      nextDueDate,
      
      // Loan details
      tenure,
      emiAmount,
      
      // Payment history
      paymentHistory,
      
      // Metadata
      rawData: section.substring(0, 500), // First 500 chars for reference
      extractedFields,
      confidenceScore: 0 // Will be calculated
    };
    
    account.confidenceScore = this.calculateConfidenceScore(account);
    
    return account;
  }

  private extractBankName(text: string): string | null {
    const patterns = [
      /(?:member\s+name|lender|bank|institution)[:\s]+([A-Z\s&\.]+?)(?:\n|account|limit)/i,
      /\b(HDFC|ICICI|SBI|State Bank|Axis|Kotak|Yes Bank|IndusInd|PNB|Bank of Baroda|Canara Bank|Union Bank|IDBI|Central Bank|Indian Bank|Bank of India|Citibank|American Express|Standard Chartered|RBL|AU Small Finance|Federal Bank|South Indian Bank|Bajaj Finance|Tata Capital|Mahindra Finance)\b/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  private extractAccountNumber(text: string): string | null {
    const patterns = [
      /(?:account\s+number|a\/c\s+no)[:\s]+([X\*\d]+)/i,
      /(?:card\s+number)[:\s]+([X\*\d]+)/i,
      /\b([X\*]{8,}\d{4,})\b/,
      /\b([X\*]{4,}\d{4,})\b/,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  private extractAccountStatus(text: string): CreditAccount['accountStatus'] | null {
    const statusPatterns = [
      { pattern: /(?:status)[:\s]+(active|open|current)/i, status: 'active' as const },
      { pattern: /(?:status)[:\s]+(closed|close)/i, status: 'closed' as const },
      { pattern: /(?:status)[:\s]+(settled|settlement)/i, status: 'settled' as const },
      { pattern: /(?:status)[:\s]+(written\s+off|write\s+off)/i, status: 'written_off' as const },
      { pattern: /(?:status)[:\s]+(dormant|inactive)/i, status: 'dormant' as const },
      { pattern: /\b(active|open|current)\b/i, status: 'active' as const },
      { pattern: /\b(closed|close)\b/i, status: 'closed' as const },
    ];
    
    for (const { pattern, status } of statusPatterns) {
      if (pattern.test(text)) {
        return status;
      }
    }
    
    return null;
  }

  private extractCreditLimit(text: string): number | undefined {
    return this.extractNumericValue(text, [
      /(?:credit\s+limit|limit|sanction(?:ed)?\s+amount)[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(?:limit)[:\s]+(\d+(?:,\d+)*(?:\.\d+)?)/i,
    ]);
  }

  private extractCurrentBalance(text: string): number | undefined {
    return this.extractNumericValue(text, [
      /(?:current\s+balance|balance)[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(?:balance)[:\s]+(\d+(?:,\d+)*(?:\.\d+)?)/i,
    ]);
  }

  private extractOutstandingAmount(text: string): number | undefined {
    return this.extractNumericValue(text, [
      /(?:outstanding|amount\s+outstanding|current\s+outstanding)[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(?:outstanding)[:\s]+(\d+(?:,\d+)*(?:\.\d+)?)/i,
    ]);
  }

  private extractMinimumAmountDue(text: string): number | undefined {
    return this.extractNumericValue(text, [
      /(?:minimum\s+amount\s+due|min\s+due|minimum\s+due)[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(?:min\s+due)[:\s]+(\d+(?:,\d+)*(?:\.\d+)?)/i,
    ]);
  }

  private extractInterestRate(text: string): number | undefined {
    return this.extractNumericValue(text, [
      /(?:interest\s+rate|rate\s+of\s+interest)[:\s]+(\d+(?:\.\d+)?)\s*%/i,
      /(?:apr|annual\s+percentage\s+rate)[:\s]+(\d+(?:\.\d+)?)\s*%/i,
      /(\d+(?:\.\d+)?)\s*%.*interest/i,
    ]);
  }

  private extractAnnualFee(text: string): number | undefined {
    return this.extractNumericValue(text, [
      /(?:annual\s+fee|yearly\s+fee)[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(?:fee)[:\s]+(\d+(?:,\d+)*(?:\.\d+)?)/i,
    ]);
  }

  private extractAccountOpenDate(text: string): string | undefined {
    return this.extractDate(text, [
      /(?:account\s+opened|date\s+opened|open\s+date)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /(?:opened)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    ]);
  }

  private extractLastPaymentDate(text: string): string | undefined {
    return this.extractDate(text, [
      /(?:last\s+payment|payment\s+date)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /(?:last\s+paid)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    ]);
  }

  private extractNextDueDate(text: string): string | undefined {
    return this.extractDate(text, [
      /(?:next\s+due\s+date|due\s+date)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
      /(?:due\s+on)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
    ]);
  }

  private extractTenure(text: string): number | undefined {
    return this.extractNumericValue(text, [
      /(?:tenure|term|duration)[:\s]+(\d+)\s*(?:months?|yrs?|years?)/i,
      /(\d+)\s*(?:months?|yrs?|years?)\s+tenure/i,
    ]);
  }

  private extractEMIAmount(text: string): number | undefined {
    return this.extractNumericValue(text, [
      /(?:emi|monthly\s+payment|installment)[:\s]+(?:rs\.?\s*|₹\s*)?(\d+(?:,\d+)*(?:\.\d+)?)/i,
      /(?:monthly)[:\s]+(\d+(?:,\d+)*(?:\.\d+)?)/i,
    ]);
  }

  private extractPaymentHistory(text: string): CreditAccount['paymentHistory'] | undefined {
    const totalMonthsMatch = text.match(/(?:reported|months)[:\s]+(\d+)/i);
    const delayedPaymentsMatch = text.match(/(?:delayed|late)[:\s]+(\d+)/i);
    const onTimePaymentsMatch = text.match(/(?:on\s+time|timely)[:\s]+(\d+)/i);
    const highestDelayMatch = text.match(/(?:highest\s+delay|max\s+delay)[:\s]+(\d+)/i);

    if (totalMonthsMatch || delayedPaymentsMatch || onTimePaymentsMatch || highestDelayMatch) {
      return {
        totalMonthsReported: totalMonthsMatch ? parseInt(totalMonthsMatch[1]) : undefined,
        delayedPayments: delayedPaymentsMatch ? parseInt(delayedPaymentsMatch[1]) : undefined,
        onTimePayments: onTimePaymentsMatch ? parseInt(onTimePaymentsMatch[1]) : undefined,
        highestDelayDays: highestDelayMatch ? parseInt(highestDelayMatch[1]) : undefined,
      };
    }

    return undefined;
  }

  // New helper methods for parsing summary table

  private extractSummarySection(text: string): string | null {
    console.log('🔍 Looking for summary section...');
    
    // Look for the "SUMMARY: CREDIT ACCOUNT INFORMATION" section
    const summaryStart = text.indexOf('SUMMARY: CREDIT ACCOUNT INFORMATION');
    console.log(`Summary section start position: ${summaryStart}`);
    
    if (summaryStart === -1) {
      console.log('❌ Summary section not found - searching for alternative patterns...');
      
      // Try alternative patterns
      const alternatives = [
        'SUMMARY:',
        'CREDIT ACCOUNT INFORMATION',
        'ACCOUNT INFORMATION',
        'Lender'
      ];
      
      for (const alt of alternatives) {
        const altStart = text.indexOf(alt);
        console.log(`Alternative "${alt}" found at: ${altStart}`);
        if (altStart !== -1) {
          const context = text.substring(Math.max(0, altStart - 100), altStart + 500);
          console.log(`Context around "${alt}":`, context);
        }
      }
      
      return null;
    }
    
    // Find the end of the summary section (before detailed account information)
    const summaryEnd = text.indexOf('CREDIT ACCOUNT INFORMATION DETAILS', summaryStart);
    console.log(`Summary section end position: ${summaryEnd}`);
    
    const summarySection = summaryEnd === -1 
      ? text.substring(summaryStart)
      : text.substring(summaryStart, summaryEnd);
    
    console.log(`📋 Summary section length: ${summarySection.length} characters`);
    console.log('📋 First 500 chars of summary section:', summarySection.substring(0, 500));
    
    return summarySection;
  }

  private extractAccountEntries(summarySection: string): RegExpMatchArray[] {
    console.log('🔍 Extracting account entries from summary section...');
    
    // Pattern to match account entries in the table format
    // Looking for: Acct X + Lender + Account Type + Account No + Status + Dates + Amounts
    const accountPattern = /Acct\s+\d+\s+(.*?)(?=Acct\s+\d+|$)/gs;
    
    const matches: RegExpMatchArray[] = [];
    let match;
    
    console.log('🔍 Testing account pattern...');
    
    // Check if we can find any "Acct" entries
    const simpleAcctMatches = summarySection.match(/Acct\s+\d+/g);
    console.log(`Found ${simpleAcctMatches ? simpleAcctMatches.length : 0} "Acct X" patterns:`, simpleAcctMatches);
    
    // Reset regex lastIndex
    accountPattern.lastIndex = 0;
    
    while ((match = accountPattern.exec(summarySection)) !== null) {
      console.log(`📋 Found account entry ${matches.length + 1}:`);
      console.log('   Full match:', match[0].substring(0, 200));
      console.log('   Entry content:', match[1].substring(0, 200));
      matches.push(match);
    }
    
    console.log(`📊 Total account entries extracted: ${matches.length}`);
    
    return matches;
  }

  private parseAccountEntry(match: RegExpMatchArray): CreditAccount | null {
    try {
      const entryText = match[1].trim();
      console.log(`🔍 Parsing account entry...`);
      console.log(`Entry text: "${entryText}"`);
      
      // For Experian format, the data is space-separated in a single line
      // Format: Lender Account_Type Account_No Ownership Date_Reported Status Date_Opened Amount Balance Overdue
      const fields = entryText.split(/\s+/).filter(field => field.length > 0);
      console.log(`Fields found: ${fields.length}`);
      fields.forEach((field, i) => console.log(`  ${i}: "${field}"`));
      
      if (fields.length < 8) {
        console.log(`❌ Not enough fields (${fields.length} fields, need at least 8)`);
        return null; // Not enough data
      }

      // Parse the space-separated fields
      // Expected format: Lender1 [Lender2] [Lender3] AccountType1 [AccountType2] AccountNumber Ownership DateReported Status DateOpened Amount Balance Overdue
      
      let fieldIndex = 0;
      let lenderName = '';
      let accountType = '';
      let accountNumber = '';
      let status = '';
      let dateOpened = '';
      let sanctionAmount = '';
      let currentBalance = '';
      let overdueAmount = '';
      
      // Extract lender name (collect fields until we find an account type)
      while (fieldIndex < fields.length && !this.isAccountType(fields[fieldIndex])) {
        console.log(`    Field ${fieldIndex} ("${fields[fieldIndex]}") - not account type`);
        lenderName += (lenderName ? ' ' : '') + fields[fieldIndex];
        fieldIndex++;
      }
      console.log(`    Found account type at index ${fieldIndex}: "${fields[fieldIndex]}"`);
      console.log(`    Final lender name: "${lenderName}"`);
      
      if (fieldIndex >= fields.length) {
        console.log(`❌ No account type found in fields`);
        return null;
      }
      
      // Extract account type (may be 1-2 fields)
      if (fieldIndex < fields.length && this.isAccountType(fields[fieldIndex])) {
        accountType = fields[fieldIndex];
        fieldIndex++;
        
        // Check if next field extends the account type (e.g., "CREDIT" + "CARDS")
        if (fieldIndex < fields.length && this.isAccountTypeExtension(fields[fieldIndex])) {
          accountType += ' ' + fields[fieldIndex];
          fieldIndex++;
        }
        
        // Special handling for multi-word types like "TWO WHEELER LOAN"
        if (fieldIndex < fields.length && fields[fieldIndex] === 'WHEELER') {
          accountType += ' ' + fields[fieldIndex];
          fieldIndex++;
        }
        if (fieldIndex < fields.length && fields[fieldIndex] === 'LOAN') {
          accountType += ' ' + fields[fieldIndex];
          fieldIndex++;
        }
      }
      
      // Extract account number (next field)
      if (fieldIndex < fields.length) {
        accountNumber = fields[fieldIndex];
        fieldIndex++;
      }
      
      // Skip ownership (Individual)
      if (fieldIndex < fields.length && fields[fieldIndex] === 'Individual') {
        fieldIndex++;
      }
      
      // Skip date reported (format: DD-MM-YYYY)
      if (fieldIndex < fields.length && /^\d{2}-\d{2}-\d{4}$/.test(fields[fieldIndex])) {
        fieldIndex++;
      }
      
      // Extract status
      if (fieldIndex < fields.length && this.isStatus(fields[fieldIndex])) {
        status = fields[fieldIndex];
        fieldIndex++;
      }
      
      // Extract date opened (8 digits)
      if (fieldIndex < fields.length && this.isDateOpened(fields[fieldIndex])) {
        dateOpened = fields[fieldIndex];
        fieldIndex++;
      }
      
      // Extract amounts (remaining fields should be numeric)
      const remainingFields = fields.slice(fieldIndex);
      const amounts = remainingFields.filter(field => this.isAmount(field));
      
      if (amounts.length >= 1) {
        sanctionAmount = amounts[0];
      }
      if (amounts.length >= 2) {
        currentBalance = amounts[1];
      }
      if (amounts.length >= 3) {
        overdueAmount = amounts[2];
      }
      
      console.log(`🔍 Extracted data:`);
      console.log(`  Lender: "${lenderName}"`);
      console.log(`  Account Type: "${accountType}"`);
      console.log(`  Account Number: "${accountNumber}"`);
      console.log(`  Status: "${status}"`);
      console.log(`  Date Opened: "${dateOpened}"`);
      console.log(`  Amounts: [${amounts.join(', ')}]`);
      
      // Only return if we have the essential information and it's active
      if (!lenderName || !accountType || !status) {
        console.log(`❌ Missing essential data`);
        return null;
      }
      
      if (status.toUpperCase() !== 'ACTIVE') {
        console.log(`❌ Account not active (status: ${status})`);
        return null;
      }
      
      return {
        accountId: `experian-${accountNumber || Math.random()}`,
        accountType: this.mapAccountType(accountType),
        accountSubType: this.mapAccountSubType(accountType),
        bankName: this.normalizeBankName(lenderName),
        accountNumber: accountNumber || 'N/A',
        accountStatus: this.mapAccountStatus(status),
        creditLimit: this.parseAmount(sanctionAmount),
        currentBalance: this.parseAmount(currentBalance),
        outstandingAmount: this.parseAmount(currentBalance),
        overdueAmount: this.parseAmount(overdueAmount),
        accountOpenDate: this.parseDate(dateOpened),
        rawData: entryText,
        confidenceScore: this.calculateConfidence(lenderName, accountType, status, currentBalance)
      };
      
    } catch (error) {
      console.error('Error parsing account entry:', error);
      return null;
    }
  }

  private isAccountType(field: string): boolean {
    // Check if this field represents an account type (first word of account type)
    const accountTypeStarters = /^(CREDIT|PERSONAL|HOME|CONSUMER|TWO|AUTO|BUSINESS|EDUCATION|GOLD|OVERDRAFT|SAVINGS|CURRENT)$/i;
    return accountTypeStarters.test(field.trim());
  }

  private isAccountTypeExtension(field: string): boolean {
    const extensions = /^(LOAN|CARDS|ACCOUNT|WHEELER)$/i;
    return extensions.test(field.trim());
  }

  private isAccountNumber(line: string): boolean {
    // Check if line looks like an account number (alphanumeric, may have spaces)
    return /^[A-Z0-9\s\-]{8,25}$/i.test(line.trim());
  }

  private isStatus(field: string): boolean {
    const statuses = /^(ACTIVE|CLOSED|SETTLED|WRITTEN OFF|DORMANT)$/i;
    return statuses.test(field.trim());
  }

  private isDateOpened(field: string): boolean {
    // 8 digit date format like 20220505
    return /^\d{8}$/.test(field.trim());
  }

  private isAmount(field: string): boolean {
    // Check if field is a number (with Indian comma format) or dash
    const cleaned = field.trim();
    return /^(\d+(?:,\d+)*|-|0)$/.test(cleaned);
  }

  private mapAccountType(accountType: string): CreditAccount['accountType'] {
    const type = accountType.toLowerCase();
    if (type.includes('credit card') || type.includes('credit cards')) return 'credit_card';
    if (type.includes('loan')) return 'loan';
    if (type.includes('overdraft')) return 'overdraft';
    if (type.includes('savings')) return 'savings';
    if (type.includes('current')) return 'current';
    return 'unknown';
  }

  private mapAccountSubType(accountType: string): CreditAccount['accountSubType'] | undefined {
    const type = accountType.toLowerCase();
    if (type.includes('personal loan')) return 'personal_loan';
    if (type.includes('home loan')) return 'home_loan';
    if (type.includes('auto loan') || type.includes('two wheeler')) return 'auto_loan';
    if (type.includes('business loan')) return 'business_loan';
    if (type.includes('education loan')) return 'education_loan';
    if (type.includes('gold loan')) return 'gold_loan';
    if (type.includes('consumer loan')) return 'personal_loan';
    return undefined;
  }

  private mapAccountStatus(status: string): CreditAccount['accountStatus'] {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active') return 'active';
    if (statusLower === 'closed') return 'closed';
    if (statusLower === 'settled') return 'settled';
    if (statusLower === 'written off') return 'written_off';
    if (statusLower === 'dormant') return 'dormant';
    return 'unknown' as any; // This will need to be added to the base type
  }

  private parseAmount(amountStr: string): number | undefined {
    if (!amountStr || amountStr.trim() === '-' || amountStr.trim() === '0') {
      return undefined;
    }
    
    const cleaned = amountStr.replace(/,/g, '');
    const parsed = parseInt(cleaned);
    return isNaN(parsed) ? undefined : parsed;
  }

  private parseDate(dateStr: string): string | undefined {
    if (!dateStr || dateStr.length !== 8) {
      return undefined;
    }
    
    // Convert YYYYMMDD to YYYY-MM-DD
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    
    return `${year}-${month}-${day}`;
  }

  private calculateConfidence(lenderName: string, accountType: string, status: string, balance: string): number {
    let confidence = 0.1; // Base confidence
    
    if (lenderName && lenderName.length > 3) confidence += 0.3;
    if (accountType && this.isAccountType(accountType)) confidence += 0.3;
    if (status && this.isStatus(status)) confidence += 0.2;
    if (balance && this.isAmount(balance) && balance !== '-') confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  private isValidAccount(account: CreditAccount): boolean {
    // Must have essential information
    if (!account.bankName || !account.accountNumber) {
      return false;
    }
    
    // Account number should be reasonable length
    if (account.accountNumber.length < 4) {
      return false;
    }
    
    // Should have at least some financial information
    const hasFinancialInfo = account.creditLimit || 
                            account.currentBalance || 
                            account.outstandingAmount ||
                            account.emiAmount;
    
    if (!hasFinancialInfo) {
      return false;
    }
    
    // Confidence score should be reasonable
    if (account.confidenceScore < 0.3) {
      return false;
    }
    
    return true;
  }
}