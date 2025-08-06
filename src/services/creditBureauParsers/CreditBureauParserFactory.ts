import { BaseCreditBureauParser, CreditBureauParseResult } from './BaseCreditBureauParser';
import { ExperianParser } from './ExperianParser';
import { CibilParser } from './CibilParser';
import { CrifParser } from './CrifParser';

export class CreditBureauParserFactory {
  private static parsers: BaseCreditBureauParser[] = [
    new ExperianParser(),
    new CibilParser(),
    new CrifParser(),
  ];

  /**
   * Automatically detect and parse credit report based on content
   */
  static parseReport(text: string): CreditBureauParseResult | null {
    console.log('🏭 CreditBureauParserFactory.parseReport called');
    console.log(`📄 Text preview (first 200 chars): "${text.substring(0, 200)}"`);
    console.log(`📊 Available parsers: ${this.parsers.map(p => p.bureauName).join(', ')}`);
    
    // Try each parser to see which one can handle this report
    for (const parser of this.parsers) {
      console.log(`🔍 Testing ${parser.bureauName} parser...`);
      if (parser.canParse(text)) {
        console.log(`✅ Using ${parser.bureauName} parser for credit report`);
        try {
          return parser.parseReport(text);
        } catch (error) {
          console.error(`Error parsing with ${parser.bureauName} parser:`, error);
          continue;
        }
      } else {
        console.log(`❌ ${parser.bureauName} parser cannot handle this report`);
      }
    }
    
    console.warn('❌ No suitable parser found for credit report');
    return null;
  }

  /**
   * Get a specific parser by bureau name
   */
  static getParser(bureauName: 'CIBIL' | 'Experian' | 'Equifax' | 'CRIF'): BaseCreditBureauParser | null {
    return this.parsers.find(parser => parser.bureauName === bureauName) || null;
  }

  /**
   * Get all available parsers
   */
  static getAllParsers(): BaseCreditBureauParser[] {
    return [...this.parsers];
  }

  /**
   * Register a new parser
   */
  static registerParser(parser: BaseCreditBureauParser): void {
    this.parsers.push(parser);
  }

  /**
   * Test which bureau the report belongs to
   */
  static detectBureau(text: string): string | null {
    for (const parser of this.parsers) {
      if (parser.canParse(text)) {
        return parser.bureauName;
      }
    }
    return null;
  }
}