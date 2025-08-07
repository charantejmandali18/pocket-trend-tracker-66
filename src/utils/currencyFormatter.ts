// Utility functions for Indian currency formatting

export const formatIndianCurrency = (amount: number, showSymbol = true): string => {
  const absAmount = Math.abs(amount);
  const symbol = showSymbol ? '₹' : '';
  
  if (absAmount < 1000) {
    // Up to thousands - show as normal number
    return `${symbol}${absAmount.toLocaleString('en-IN')}`;
  } else if (absAmount < 10000000) { // Less than 1 crore
    // Show in lakhs (L)
    const lakhs = absAmount / 100000;
    return `${symbol}${lakhs.toFixed(lakhs >= 10 ? 1 : 2)}L`;
  } else {
    // Show in crores (Cr)
    const crores = absAmount / 10000000;
    return `${symbol}${crores.toFixed(crores >= 10 ? 1 : 2)}Cr`;
  }
};

export const formatNetWorth = (amount: number): { 
  formatted: string; 
  className: string; 
  color: string;
} => {
  const formatted = formatIndianCurrency(amount, true);
  const isPositive = amount >= 0;
  
  return {
    formatted,
    className: isPositive ? 'text-green-600' : 'text-red-600',
    color: isPositive ? 'green' : 'red'
  };
};

export const formatAccountBalance = (amount: number, accountType?: string): string => {
  // For credit cards, show as outstanding amount
  if (accountType === 'credit_card') {
    return formatIndianCurrency(amount, true);
  }
  
  return formatIndianCurrency(amount, true);
};

// Examples of the formatting:
// 500 -> ₹500
// 1500 -> ₹1,500  
// 150000 -> ₹1.50L
// 2950000 -> ₹29.5L
// 30200000 -> ₹3.02Cr
// 150000000 -> ₹15.0Cr