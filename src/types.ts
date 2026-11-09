export type WorkRegime =
  | 'CLT'
  | 'PJ_MEI'
  | 'PJ_SIMPLES'
  | 'AUTONOMO'
  | 'PUBLIC_SERVANT'
  | 'RETIRED';

export interface UserProfile {
  grossMonthlyIncome: number;
  regime: WorkRegime;
  isPCD: boolean;
  hasQualifyingConditionForIRExemption: boolean;
  age: number;
  dependentsCount: number;
  annualHealthExpenses?: number;
  annualEducationExpenses?: number;
  annualAlimonyExpenses?: number;
  mandatoryDiscountsMonthly?: number;
  includesThirteenthSalary?: boolean;
  stateUF?: string;
  ownsVehicleValue?: number;
}

export interface TaxParametersYear {
  year: number;
  minimumWage: number;
  inssCeiling: number;
  inssProgressive: boolean;
  inssBrackets: Array<{ limit: number; rate: number }>;
  irpfBrackets: Array<{ limit: number; rate: number; deduction: number }>;
  dependentDeductionMonthly: number;
  educationAnnualLimitPerPerson: number;
  simplifiedDiscountLimit: number;
  monthlySimplifiedDiscount: number;
  senior65ExtraExemptionMonthly: number;
  irpf2026MonthlyExemptionLimit?: number;
  ipcaAnnualRate: number;
  irpfTableLagFactor: number;
  estimatedConsumptionTaxRateByIncomeDecile: Record<number, number>;
}

export interface YearlyTaxResult {
  year: number;
  grossAnnualIncome: number;
  netAnnualIncome: number;
  totalDirectTaxes: number;
  totalEstimatedIndirectTaxes: number;
  totalTaxesPaid: number;
  effectiveTaxRate: number;
  daysWorkedForTaxes: number;
  pcdSavingsAmount: number;
  netDisposableAfterConsumptionTaxes: number;
  inssAnnual: number;
  irpfAnnual: number;
  pjOrAutonomousTaxesAnnual: number;
  ipvaEstimatedAnnual: number;
  classCouncilOrOtherDiscountsAnnual: number;
  deductionModelUsed: 'COMPLETA' | 'SIMPLIFICADA' | 'ISENTO_PCD' | 'NAO_APLICAVEL';
  irpfWithInflationCorrectedTable: number;
  irpfLagExtraCost: number;
  totalDeductionsSavings: number;
  taxFreedomDate: string;
  incomeDecile: number;
  consumptionTaxRateApplied: number;
}

export interface StateTaxInfo {
  uf: string;
  name: string;
  icmsModalRate: number;
  ipvaStandardRate: number;
  pcdIpvaExemptionCeiling: number;
}

export interface PCDExemptionRight {
  id: string;
  taxName: string;
  scope: string;
  legalBasis: string;
  ceilingDescription: string;
  estimatedAnnualOrPurchaseBenefit: number;
  isEligibleForUser: boolean;
  eligibilityNote: string;
}

export interface RegimeComparisonItem {
  regime: WorkRegime;
  label: string;
  grossAnnualIncome: number;
  directTaxesAnnual: number;
  indirectTaxesAnnual: number;
  netAnnualIncome: number;
  effectiveTaxRate: number;
  notes: string;
}

