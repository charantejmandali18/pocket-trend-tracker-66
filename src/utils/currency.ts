/**
 * Format amount in Indian currency format with lakhs and crores
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted currency string
 */
export const formatIndianCurrency = (amount: number, showDecimals: boolean = true): string => {
  if (amount === 0) return '₹0.00';
  
  const absAmount = Math.abs(amount);
  let formatted = '';
  
  if (absAmount >= 10000000) {
    // Crores (1 crore = 10,000,000)
    const crores = absAmount / 10000000;
    formatted = showDecimals ? 
      `${crores.toFixed(2)} Cr` : 
      `${Math.round(crores)} Cr`;
  } else if (absAmount >= 100000) {
    // Lakhs (1 lakh = 100,000)
    const lakhs = absAmount / 100000;
    formatted = showDecimals ? 
      `${lakhs.toFixed(2)} L` : 
      `${Math.round(lakhs)} L`;
  } else if (absAmount >= 1000) {
    // Thousands with Indian comma format
    const thousands = absAmount / 1000;
    formatted = showDecimals ? 
      `${thousands.toFixed(2)}K` : 
      `${Math.round(thousands)}K`;
  } else {
    // Regular format with Indian comma system
    formatted = formatWithIndianCommas(absAmount, showDecimals);
  }
  
  return `${amount < 0 ? '-' : ''}₹${formatted}`;
};

/**
 * Format number with Indian comma system (XX,XX,XXX)
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places
 * @returns Formatted number string
 */
export const formatWithIndianCommas = (amount: number, showDecimals: boolean = true): string => {
  const numStr = showDecimals ? amount.toFixed(2) : Math.round(amount).toString();
  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Indian number system: group digits as X,XX,XXX
  let formatted = '';
  const len = integerPart.length;
  
  for (let i = 0; i < len; i++) {
    if (i > 0) {
      const posFromRight = len - i;
      if (posFromRight === 3) {
        formatted += ',';
      } else if (posFromRight > 3 && (posFromRight - 3) % 2 === 0) {
        formatted += ',';
      }
    }
    formatted += integerPart[i];
  }
  
  if (showDecimals && decimalPart) {
    formatted += '.' + decimalPart;
  }
  
  return formatted;
};

/**
 * Format amount as full Indian currency with rupee symbol
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted currency string with ₹ symbol
 */
export const formatFullIndianCurrency = (amount: number, showDecimals: boolean = true): string => {
  const absAmount = Math.abs(amount);
  const formatted = formatWithIndianCommas(absAmount, showDecimals);
  
  return `${amount < 0 ? '-' : ''}₹${formatted}`;
};

/**
 * Format amount for compact display (e.g., in cards, summaries)
 * @param amount - The amount to format
 * @returns Compact formatted currency string
 */
export const formatCompactCurrency = (amount: number): string => {
  return formatIndianCurrency(amount, false);
};