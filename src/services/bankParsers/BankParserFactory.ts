import { BankParser } from './BankParserInterface';
import { AxisBankParser } from './AxisBankParser';
import { HdfcBankParser } from './HdfcBankParser';

export class BankParserFactory {
  private static parsers: BankParser[] = [
    new AxisBankParser(),
    new HdfcBankParser(),
    // Add more bank parsers here:
    // new IciciBankParser(),
    // new SbiBankParser(),
  ];

  /**
   * Get the appropriate bank parser for an email
   */
  static getParserForEmail(subject: string, body: string, from: string): BankParser | null {
    console.log('🏭 Factory - Finding parser for email from:', from);
    
    for (const parser of this.parsers) {
      if (parser.canParse(subject, body, from)) {
        console.log(`✅ Found parser: ${parser.getBankName()}`);
        return parser;
      }
    }
    
    console.log('❌ No parser found for this email');
    return null;
  }

  /**
   * Get all available bank parsers
   */
  static getAllParsers(): BankParser[] {
    return [...this.parsers];
  }

  /**
   * Get parser by bank name
   */
  static getParserByBank(bankName: string): BankParser | null {
    return this.parsers.find(parser => 
      parser.getBankName().toLowerCase() === bankName.toLowerCase()
    ) || null;
  }

  /**
   * Register a new bank parser
   */
  static registerParser(parser: BankParser): void {
    this.parsers.push(parser);
    console.log(`📝 Registered new parser: ${parser.getBankName()}`);
  }

  /**
   * Get list of supported banks
   */
  static getSupportedBanks(): string[] {
    return this.parsers.map(parser => parser.getBankName());
  }
}