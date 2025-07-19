// Test home loan calculation with real user data
// User's actual loan: Sanctioned ₹24,00,000, Disbursed ₹26,90,108, Rate 7.55%
// EMI varies: Feb ₹5,681, Mar ₹17,687, Apr ₹19,606, May ₹18,979, Jun ₹19,608, Jul ₹18,979

const calculateHomeLoanTest = () => {
  // User's real data
  const sanctionedAmount = 24000000; // ₹2.4 crores
  const disbursedAmount = 2690108;   // ₹26.9 lakhs
  const interestRate = 7.55;         // 7.55% annual
  const moratoriumPeriodMonths = 24; // 2 years
  const tenureMonths = 240;          // 20 years total
  
  const monthlyInterestRate = interestRate / (12 * 100);
  console.log('Monthly Interest Rate:', monthlyInterestRate);
  
  // Current calculation
  const currentMoratoriumEmi = disbursedAmount * monthlyInterestRate;
  console.log('Current Disbursed Amount:', disbursedAmount.toLocaleString());
  console.log('Current Moratorium EMI (calculated):', Math.ceil(currentMoratoriumEmi).toLocaleString());
  
  // User's actual EMI history
  const actualEmiHistory = [5681, 17687, 19606, 18979, 19608, 18979];
  console.log('\nUser\'s Actual EMI History:');
  actualEmiHistory.forEach((emi, index) => {
    console.log(`Month ${index + 1}: ₹${emi.toLocaleString()}`);
  });
  
  // Calculate what disbursed amounts would produce these EMIs
  console.log('\nReverse calculation - Disbursed amounts for actual EMIs:');
  actualEmiHistory.forEach((emi, index) => {
    const impliedDisbursedAmount = emi / monthlyInterestRate;
    console.log(`Month ${index + 1}: EMI ₹${emi.toLocaleString()} → Disbursed ₹${Math.round(impliedDisbursedAmount).toLocaleString()}`);
  });
  
  console.log('\nConclusion: EMI varies because disbursements happen progressively during construction.');
  console.log('We need to track construction stages and their disbursement history to get accurate EMI calculations.');
};

calculateHomeLoanTest();