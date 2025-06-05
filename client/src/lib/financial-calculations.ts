import { DealInputs, DealResults, CashFlowRow, DealType } from '@/types/deal-types';

/**
 * Calculate monthly payment for amortizing loan
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
function calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
  if (annualRate === 0) return principal / (years * 12);
  
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

/**
 * Calculate Net Present Value
 */
function calculateNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((npv, cashFlow, year) => {
    return npv + cashFlow / Math.pow(1 + discountRate / 100, year + 1);
  }, 0);
}

/**
 * Calculate Internal Rate of Return using iterative approximation
 */
function calculateIRR(cashFlows: number[]): number {
  let rate = 0.1; // Start with 10%
  let tolerance = 0.0001;
  let maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      const factor = Math.pow(1 + rate, j + 1);
      npv += cashFlows[j] / factor;
      derivative -= (j + 1) * cashFlows[j] / (factor * (1 + rate));
    }
    
    if (Math.abs(npv) < tolerance) break;
    
    rate = rate - npv / derivative;
  }
  
  return rate * 100;
}

/**
 * All-Cash Offer: Immediate full payment with tax impact
 */
export function calculateAllCash(inputs: DealInputs): DealResults {
  const { purchasePrice, taxRate } = inputs;
  
  // For all-cash, seller receives full amount upfront but pays capital gains tax
  const taxImpact = purchasePrice * (taxRate / 100);
  const netProceeds = purchasePrice - taxImpact;
  
  const cashFlow: CashFlowRow[] = [{
    year: 1,
    principal: purchasePrice,
    interest: 0,
    equityReturns: 0,
    preTaxTotal: purchasePrice,
    taxImpact: -taxImpact,
    netCashFlow: netProceeds,
    cumulative: netProceeds
  }];
  
  // Add remaining years with zero cash flow
  for (let year = 2; year <= inputs.termLength; year++) {
    cashFlow.push({
      year,
      principal: 0,
      interest: 0,
      equityReturns: 0,
      preTaxTotal: 0,
      taxImpact: 0,
      netCashFlow: 0,
      cumulative: netProceeds
    });
  }
  
  const cashFlowValues = [purchasePrice, ...Array(inputs.termLength - 1).fill(0)];
  const npv = calculateNPV(cashFlowValues, 8); // 8% discount rate
  const roi = ((netProceeds - purchasePrice) / purchasePrice) * 100;
  
  return {
    totalInvestment: purchasePrice,
    netProceeds,
    roi,
    irr: 0, // No returns over time for all-cash
    cashFlow,
    npv
  };
}

/**
 * Earn-Out Structure: Performance-based payments over time
 */
export function calculateEarnOut(inputs: DealInputs): DealResults {
  const { purchasePrice, termLength, taxRate } = inputs;
  
  // Typical earn-out: 60% upfront, 40% over remaining years
  const upfrontPayment = purchasePrice * 0.6;
  const earnOutAmount = purchasePrice * 0.4;
  const annualEarnOut = earnOutAmount / (termLength - 1);
  
  const cashFlow: CashFlowRow[] = [];
  let cumulative = 0;
  
  // Year 1: Upfront payment
  const year1Tax = upfrontPayment * (taxRate / 100);
  const year1Net = upfrontPayment - year1Tax;
  cumulative += year1Net;
  
  cashFlow.push({
    year: 1,
    principal: upfrontPayment,
    interest: 0,
    equityReturns: 0,
    preTaxTotal: upfrontPayment,
    taxImpact: -year1Tax,
    netCashFlow: year1Net,
    cumulative
  });
  
  // Subsequent years: Earn-out payments
  for (let year = 2; year <= termLength; year++) {
    const earnOutTax = annualEarnOut * (taxRate / 100);
    const earnOutNet = annualEarnOut - earnOutTax;
    cumulative += earnOutNet;
    
    cashFlow.push({
      year,
      principal: annualEarnOut,
      interest: 0,
      equityReturns: 0,
      preTaxTotal: annualEarnOut,
      taxImpact: -earnOutTax,
      netCashFlow: earnOutNet,
      cumulative
    });
  }
  
  const cashFlowValues = cashFlow.map(row => row.netCashFlow);
  const npv = calculateNPV(cashFlowValues, 8);
  const irr = calculateIRR([-upfrontPayment, ...cashFlowValues.slice(1)]);
  
  return {
    totalInvestment: upfrontPayment,
    netProceeds: cumulative,
    roi: ((cumulative - upfrontPayment) / upfrontPayment) * 100,
    irr,
    cashFlow,
    npv
  };
}

/**
 * Seller Financing: Owner-financed payments with interest
 */
export function calculateSellerFinancing(inputs: DealInputs): DealResults {
  const { purchasePrice, termLength, interestRate, taxRate } = inputs;
  
  // Typical seller financing: 20% down, 80% financed
  const downPayment = purchasePrice * 0.2;
  const financedAmount = purchasePrice - downPayment;
  
  const monthlyPayment = calculateMonthlyPayment(financedAmount, interestRate, termLength);
  const annualPayment = monthlyPayment * 12;
  
  const cashFlow: CashFlowRow[] = [];
  let remainingBalance = financedAmount;
  let cumulative = 0;
  
  // Down payment tax (immediate)
  const downTax = downPayment * (taxRate / 100);
  const downNet = downPayment - downTax;
  cumulative += downNet;
  
  for (let year = 1; year <= termLength; year++) {
    const interestPayment = remainingBalance * (interestRate / 100);
    const principalPayment = Math.min(annualPayment - interestPayment, remainingBalance);
    const totalPayment = principalPayment + interestPayment;
    
    // Tax on annual payments
    const paymentTax = totalPayment * (taxRate / 100);
    const netPayment = totalPayment - paymentTax;
    
    if (year === 1) {
      // Include down payment in first year
      const totalYear1 = downNet + netPayment;
      cumulative = totalYear1;
      
      cashFlow.push({
        year,
        principal: downPayment + principalPayment,
        interest: interestPayment,
        equityReturns: 0,
        preTaxTotal: downPayment + totalPayment,
        taxImpact: -(downTax + paymentTax),
        netCashFlow: totalYear1,
        cumulative
      });
    } else {
      cumulative += netPayment;
      
      cashFlow.push({
        year,
        principal: principalPayment,
        interest: interestPayment,
        equityReturns: 0,
        preTaxTotal: totalPayment,
        taxImpact: -paymentTax,
        netCashFlow: netPayment,
        cumulative
      });
    }
    
    remainingBalance -= principalPayment;
    if (remainingBalance <= 0) break;
  }
  
  const cashFlowValues = cashFlow.map(row => row.netCashFlow);
  const npv = calculateNPV(cashFlowValues, 8);
  const irr = calculateIRR([-downPayment, ...cashFlowValues.slice(0, -1), cashFlowValues[cashFlowValues.length - 1] - downPayment]);
  
  return {
    totalInvestment: downPayment,
    netProceeds: cumulative,
    roi: ((cumulative - downPayment) / downPayment) * 100,
    irr,
    cashFlow,
    npv
  };
}

/**
 * SBA 7(a) Loan: Enforced 10% down, 90% financed with buyer equity returns
 */
export function calculateSBALoan(inputs: DealInputs): DealResults {
  const { purchasePrice, termLength, interestRate, taxRate } = inputs;
  
  // SBA 7(a) requirements: 10% down payment, 90% financed
  const downPayment = purchasePrice * 0.1;
  const loanAmount = purchasePrice * 0.9;
  
  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, termLength);
  const annualPayment = monthlyPayment * 12;
  
  const cashFlow: CashFlowRow[] = [];
  let remainingBalance = loanAmount;
  let cumulative = 0;
  
  // Down payment tax
  const downTax = downPayment * (taxRate / 100);
  const downNet = downPayment - downTax;
  
  for (let year = 1; year <= termLength; year++) {
    const interestPayment = remainingBalance * (interestRate / 100);
    const principalPayment = Math.min(annualPayment - interestPayment, remainingBalance);
    
    // Business equity growth assumption (10% annual appreciation)
    const equityGrowth = purchasePrice * 0.1;
    const equityTax = equityGrowth * (taxRate / 100);
    const netEquityGrowth = equityGrowth - equityTax;
    
    // Net cash flow = equity growth - loan payments + tax benefits
    const loanPaymentAfterTax = (principalPayment + interestPayment) * (1 - taxRate / 100);
    let netYearlyReturn = netEquityGrowth - loanPaymentAfterTax;
    
    if (year === 1) {
      // Include down payment impact in first year
      netYearlyReturn -= downPayment;
      cumulative = netYearlyReturn;
      
      cashFlow.push({
        year,
        principal: downPayment,
        interest: interestPayment,
        equityReturns: netEquityGrowth,
        preTaxTotal: downPayment + equityGrowth,
        taxImpact: -(downTax + equityTax),
        netCashFlow: netYearlyReturn,
        cumulative
      });
    } else {
      cumulative += netYearlyReturn;
      
      cashFlow.push({
        year,
        principal: principalPayment,
        interest: interestPayment,
        equityReturns: netEquityGrowth,
        preTaxTotal: principalPayment + interestPayment + equityGrowth,
        taxImpact: -equityTax,
        netCashFlow: netYearlyReturn,
        cumulative
      });
    }
    
    remainingBalance -= principalPayment;
    if (remainingBalance <= 0) break;
  }
  
  const cashFlowValues = cashFlow.map(row => row.netCashFlow);
  const npv = calculateNPV(cashFlowValues, 8);
  const irr = calculateIRR(cashFlowValues);
  
  return {
    totalInvestment: downPayment,
    netProceeds: cumulative,
    roi: ((cumulative - downPayment) / downPayment) * 100,
    irr,
    cashFlow,
    npv
  };
}

/**
 * Custom Structure: Fully editable by user
 */
export function calculateCustom(inputs: DealInputs): DealResults {
  const { purchasePrice, termLength, interestRate, taxRate, downPayment = 0, balloonPayment = 0 } = inputs;
  
  const initialPayment = downPayment || purchasePrice * 0.25; // Default 25% if not specified
  const financedAmount = purchasePrice - initialPayment;
  const balloonAmount = balloonPayment || 0;
  const regularFinancedAmount = financedAmount - balloonAmount;
  
  let monthlyPayment = 0;
  if (regularFinancedAmount > 0) {
    monthlyPayment = calculateMonthlyPayment(regularFinancedAmount, interestRate, termLength);
  }
  const annualPayment = monthlyPayment * 12;
  
  const cashFlow: CashFlowRow[] = [];
  let remainingBalance = regularFinancedAmount;
  let cumulative = 0;
  
  // Initial payment tax
  const initialTax = initialPayment * (taxRate / 100);
  const initialNet = initialPayment - initialTax;
  cumulative += initialNet;
  
  for (let year = 1; year <= termLength; year++) {
    const interestPayment = remainingBalance * (interestRate / 100);
    const principalPayment = Math.min(annualPayment - interestPayment, remainingBalance);
    let totalPayment = principalPayment + interestPayment;
    
    // Add balloon payment in final year
    if (year === termLength && balloonAmount > 0) {
      totalPayment += balloonAmount;
    }
    
    const paymentTax = totalPayment * (taxRate / 100);
    const netPayment = totalPayment - paymentTax;
    
    if (year === 1) {
      const totalYear1 = initialNet + netPayment;
      cumulative = totalYear1;
      
      cashFlow.push({
        year,
        principal: initialPayment + principalPayment + (year === termLength ? balloonAmount : 0),
        interest: interestPayment,
        equityReturns: 0,
        preTaxTotal: initialPayment + totalPayment,
        taxImpact: -(initialTax + paymentTax),
        netCashFlow: totalYear1,
        cumulative
      });
    } else {
      cumulative += netPayment;
      
      cashFlow.push({
        year,
        principal: principalPayment + (year === termLength ? balloonAmount : 0),
        interest: interestPayment,
        equityReturns: 0,
        preTaxTotal: totalPayment,
        taxImpact: -paymentTax,
        netCashFlow: netPayment,
        cumulative
      });
    }
    
    remainingBalance -= principalPayment;
    if (remainingBalance <= 0) break;
  }
  
  const cashFlowValues = cashFlow.map(row => row.netCashFlow);
  const npv = calculateNPV(cashFlowValues, 8);
  const irr = calculateIRR([-initialPayment, ...cashFlowValues.slice(1)]);
  
  return {
    totalInvestment: initialPayment,
    netProceeds: cumulative,
    roi: ((cumulative - initialPayment) / initialPayment) * 100,
    irr,
    cashFlow,
    npv
  };
}

/**
 * Main calculation function that routes to appropriate calculator
 */
export function calculateDealStructure(dealType: DealType, inputs: DealInputs): DealResults {
  switch (dealType) {
    case 'all-cash':
      return calculateAllCash(inputs);
    case 'earn-out':
      return calculateEarnOut(inputs);
    case 'seller-financing':
      return calculateSellerFinancing(inputs);
    case 'sba-loan':
      return calculateSBALoan(inputs);
    case 'custom':
      return calculateCustom(inputs);
    default:
      return calculateAllCash(inputs);
  }
}
