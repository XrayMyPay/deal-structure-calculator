export type DealType = 'all-cash' | 'earn-out' | 'seller-financing' | 'sba-loan' | 'custom';

export interface DealInputs {
  purchasePrice: number;
  termLength: number;
  interestRate: number;
  taxRate: number;
  equityRetained: number;
  // Custom structure specific fields
  downPayment?: number;
  balloonPayment?: number;
}

export interface CashFlowRow {
  year: number;
  principal: number;
  interest: number;
  equityReturns: number;
  preTaxTotal: number;
  taxImpact: number;
  netCashFlow: number;
  cumulative: number;
}

export interface DealResults {
  totalInvestment: number;
  netProceeds: number;
  roi: number;
  irr: number;
  cashFlow: CashFlowRow[];
  npv: number;
}

export interface ComparisonData {
  dealType: DealType;
  label: string;
  results: DealResults;
  color: string;
}
