// Base interface for all bank-specific email parsers
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

export interface BankParserResult {
  transaction?: ParsedTransaction;
  account?: ParsedAccount;
}

export interface BankParser {
  // Bank identifier
  getBankName(): string;
  getBankPatterns(): RegExp[];
  
  // Check if this parser can handle the email
  canParse(subject: string, body: string, from: string): boolean;
  
  // Parse the email content
  parseEmail(emailId: string, subject: string, from: string, date: string, body: string): BankParserResult | null;
  
  // Validation methods
  isTransactionEmail(subject: string, body: string, from: string): boolean;
  isPromotionalEmail(subject: string, body: string, from: string): boolean;
}