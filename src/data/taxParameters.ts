import type { StateTaxInfo, TaxParametersYear, UserProfile, WorkRegime } from '../types.ts';

// Estimativa de carga tributária indireta sobre a renda total por decil (1 = menor renda, 10 = maior renda)
// Fontes de referência: Estudos IPEA (Siqueira, Nogueira, Souza) e POF/IBGE sobre regressividade do consumo.
const BASE_CONSUMPTION_TAX_BY_DECILE: Record<number, number> = {
  1: 0.285,
  2: 0.258,
  3: 0.236,
  4: 0.218,
  5: 0.202,
  6: 0.188,
  7: 0.174,
  8: 0.159,
  9: 0.142,
  10: 0.118,
};

const IRPF_BRACKETS_2015_2022 = [
  { limit: 1903.98, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 142.8 },
  { limit: 3751.05, rate: 0.15, deduction: 354.8 },
  { limit: 4664.68, rate: 0.225, deduction: 636.13 },
  { limit: Infinity, rate: 0.275, deduction: 869.36 },
];

const IRPF_BRACKETS_2023 = [
  { limit: 2112.0, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 158.4 },
  { limit: 3751.05, rate: 0.15, deduction: 370.4 },
  { limit: 4664.68, rate: 0.225, deduction: 651.73 },
  { limit: Infinity, rate: 0.275, deduction: 884.96 },
];

const IRPF_BRACKETS_2024 = [
  { limit: 2259.2, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 169.44 },
  { limit: 3751.05, rate: 0.15, deduction: 381.44 },
  { limit: 4664.68, rate: 0.225, deduction: 662.77 },
  { limit: Infinity, rate: 0.275, deduction: 896.0 },
];

const IRPF_BRACKETS_2025_2026 = [
  { limit: 2428.8, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 182.16 },
  { limit: 3751.05, rate: 0.15, deduction: 394.16 },
  { limit: 4664.68, rate: 0.225, deduction: 675.49 },
  { limit: Infinity, rate: 0.275, deduction: 908.73 },
];

export const TAX_PARAMETERS_BY_YEAR: Record<number, TaxParametersYear> = {
  2015: {
    year: 2015,
    minimumWage: 788.0,
    inssCeiling: 4663.75,
    inssProgressive: false,
    inssBrackets: [
      { limit: 1399.12, rate: 0.08 },
      { limit: 2331.88, rate: 0.09 },
      { limit: 4663.75, rate: 0.11 },
    ],
    irpfBrackets: IRPF_BRACKETS_2015_2022,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 0,
    senior65ExtraExemptionMonthly: 1903.98,
    ipcaAnnualRate: 10.67,
    irpfTableLagFactor: 1.72,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
  2016: {
    year: 2016,
    minimumWage: 880.0,
    inssCeiling: 5189.82,
    inssProgressive: false,
    inssBrackets: [
      { limit: 1556.94, rate: 0.08 },
      { limit: 2594.92, rate: 0.09 },
      { limit: 5189.82, rate: 0.11 },
    ],
    irpfBrackets: IRPF_BRACKETS_2015_2022,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 0,
    senior65ExtraExemptionMonthly: 1903.98,
    ipcaAnnualRate: 6.29,
    irpfTableLagFactor: 1.83,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
  2017: {
    year: 2017,
    minimumWage: 937.0,
    inssCeiling: 5531.31,
    inssProgressive: false,
    inssBrackets: [
      { limit: 1659.38, rate: 0.08 },
      { limit: 2765.66, rate: 0.09 },
      { limit: 5531.31, rate: 0.11 },
    ],
    irpfBrackets: IRPF_BRACKETS_2015_2022,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 0,
    senior65ExtraExemptionMonthly: 1903.98,
    ipcaAnnualRate: 2.95,
    irpfTableLagFactor: 1.88,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
  2018: {
    year: 2018,
    minimumWage: 954.0,
    inssCeiling: 5645.8,
    inssProgressive: false,
    inssBrackets: [
      { limit: 1693.72, rate: 0.08 },
      { limit: 2822.9, rate: 0.09 },
      { limit: 5645.8, rate: 0.11 },
    ],
    irpfBrackets: IRPF_BRACKETS_2015_2022,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 0,
    senior65ExtraExemptionMonthly: 1903.98,
    ipcaAnnualRate: 3.75,
    irpfTableLagFactor: 1.95,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
  2019: {
    year: 2019,
    minimumWage: 998.0,
    inssCeiling: 5839.45,
    inssProgressive: false,
    inssBrackets: [
      { limit: 1751.81, rate: 0.08 },
      { limit: 2919.72, rate: 0.09 },
      { limit: 5839.45, rate: 0.11 },
    ],
    irpfBrackets: IRPF_BRACKETS_2015_2022,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 0,
    senior65ExtraExemptionMonthly: 1903.98,
    ipcaAnnualRate: 4.31,
    irpfTableLagFactor: 2.04,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
  2020: {
    year: 2020,
    minimumWage: 1045.0,
    inssCeiling: 6101.06,
    inssProgressive: true,
    inssBrackets: [
      { limit: 1045.0, rate: 0.075 },
      { limit: 2089.6, rate: 0.09 },
      { limit: 3134.4, rate: 0.12 },
      { limit: 6101.06, rate: 0.14 },
    ],
    irpfBrackets: IRPF_BRACKETS_2015_2022,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 0,
    senior65ExtraExemptionMonthly: 1903.98,
    ipcaAnnualRate: 4.52,
    irpfTableLagFactor: 2.13,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
  2021: {
    year: 2021,
    minimumWage: 1100.0,
    inssCeiling: 6433.57,
    inssProgressive: true,
    inssBrackets: [
      { limit: 1100.0, rate: 0.075 },
      { limit: 2203.48, rate: 0.09 },
      { limit: 3305.22, rate: 0.12 },
      { limit: 6433.57, rate: 0.14 },
    ],
    irpfBrackets: IRPF_BRACKETS_2015_2022,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 0,
    senior65ExtraExemptionMonthly: 1903.98,
    ipcaAnnualRate: 10.06,
    irpfTableLagFactor: 2.34,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
  2022: {
    year: 2022,
    minimumWage: 1212.0,
    inssCeiling: 7087.22,
    inssProgressive: true,
    inssBrackets: [
      { limit: 1212.0, rate: 0.075 },
      { limit: 2427.35, rate: 0.09 },
      { limit: 3641.03, rate: 0.12 },
      { limit: 7087.22, rate: 0.14 },
    ],
    irpfBrackets: IRPF_BRACKETS_2015_2022,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 0,
    senior65ExtraExemptionMonthly: 1903.98,
    ipcaAnnualRate: 5.79,
    irpfTableLagFactor: 2.48,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
  2023: {
    year: 2023,
    minimumWage: 1320.0,
    inssCeiling: 7507.49,
    inssProgressive: true,
    inssBrackets: [
      { limit: 1320.0, rate: 0.075 },
      { limit: 2571.29, rate: 0.09 },
      { limit: 3856.94, rate: 0.12 },
      { limit: 7507.49, rate: 0.14 },
    ],
    irpfBrackets: IRPF_BRACKETS_2023,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 528.0,
    senior65ExtraExemptionMonthly: 1903.98,
    ipcaAnnualRate: 4.62,
    irpfTableLagFactor: 2.36,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
  2024: {
    year: 2024,
    minimumWage: 1412.0,
    inssCeiling: 7786.02,
    inssProgressive: true,
    inssBrackets: [
      { limit: 1412.0, rate: 0.075 },
      { limit: 2666.68, rate: 0.09 },
      { limit: 4000.03, rate: 0.12 },
      { limit: 7786.02, rate: 0.14 },
    ],
    irpfBrackets: IRPF_BRACKETS_2024,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 564.8,
    senior65ExtraExemptionMonthly: 1903.98,
    ipcaAnnualRate: 4.83,
    irpfTableLagFactor: 2.42,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
  2025: {
    year: 2025,
    minimumWage: 1518.0,
    inssCeiling: 8157.41,
    inssProgressive: true,
    inssBrackets: [
      { limit: 1518.0, rate: 0.075 },
      { limit: 2793.88, rate: 0.09 },
      { limit: 4190.83, rate: 0.12 },
      { limit: 8157.41, rate: 0.14 },
    ],
    irpfBrackets: IRPF_BRACKETS_2025_2026,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 607.2,
    senior65ExtraExemptionMonthly: 1903.98,
    ipcaAnnualRate: 4.4,
    irpfTableLagFactor: 2.49,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
  2026: {
    year: 2026,
    minimumWage: 1621.0,
    inssCeiling: 8475.55,
    inssProgressive: true,
    inssBrackets: [
      { limit: 1621.0, rate: 0.075 },
      { limit: 2983.86, rate: 0.09 },
      { limit: 4475.81, rate: 0.12 },
      { limit: 8475.55, rate: 0.14 },
    ],
    irpfBrackets: IRPF_BRACKETS_2025_2026,
    dependentDeductionMonthly: 189.59,
    educationAnnualLimitPerPerson: 3561.5,
    simplifiedDiscountLimit: 16754.34,
    monthlySimplifiedDiscount: 607.2,
    senior65ExtraExemptionMonthly: 1903.98,
    irpf2026MonthlyExemptionLimit: 5000.0,
    ipcaAnnualRate: 4.1,
    irpfTableLagFactor: 2.54,
    estimatedConsumptionTaxRateByIncomeDecile: BASE_CONSUMPTION_TAX_BY_DECILE,
  },
};

export const AVAILABLE_YEARS = Object.keys(TAX_PARAMETERS_BY_YEAR)
  .map(Number)
  .sort((a, b) => a - b);

export const STATE_TAX_DATA: Record<string, StateTaxInfo> = {
  AC: { uf: 'AC', name: 'Acre', icmsModalRate: 0.19, ipvaStandardRate: 0.02, pcdIpvaExemptionCeiling: 120000 },
  AL: { uf: 'AL', name: 'Alagoas', icmsModalRate: 0.19, ipvaStandardRate: 0.03, pcdIpvaExemptionCeiling: 120000 },
  AP: { uf: 'AP', name: 'Amapá', icmsModalRate: 0.18, ipvaStandardRate: 0.03, pcdIpvaExemptionCeiling: 120000 },
  AM: { uf: 'AM', name: 'Amazonas', icmsModalRate: 0.20, ipvaStandardRate: 0.03, pcdIpvaExemptionCeiling: 120000 },
  BA: { uf: 'BA', name: 'Bahia', icmsModalRate: 0.205, ipvaStandardRate: 0.025, pcdIpvaExemptionCeiling: 120000 },
  CE: { uf: 'CE', name: 'Ceará', icmsModalRate: 0.20, ipvaStandardRate: 0.03, pcdIpvaExemptionCeiling: 120000 },
  DF: { uf: 'DF', name: 'Distrito Federal', icmsModalRate: 0.20, ipvaStandardRate: 0.03, pcdIpvaExemptionCeiling: 120000 },
  ES: { uf: 'ES', name: 'Espírito Santo', icmsModalRate: 0.17, ipvaStandardRate: 0.02, pcdIpvaExemptionCeiling: 120000 },
  GO: { uf: 'GO', name: 'Goiás', icmsModalRate: 0.19, ipvaStandardRate: 0.0375, pcdIpvaExemptionCeiling: 120000 },
  MA: { uf: 'MA', name: 'Maranhão', icmsModalRate: 0.22, ipvaStandardRate: 0.025, pcdIpvaExemptionCeiling: 120000 },
  MT: { uf: 'MT', name: 'Mato Grosso', icmsModalRate: 0.17, ipvaStandardRate: 0.03, pcdIpvaExemptionCeiling: 120000 },
  MS: { uf: 'MS', name: 'Mato Grosso do Sul', icmsModalRate: 0.17, ipvaStandardRate: 0.03, pcdIpvaExemptionCeiling: 120000 },
  MG: { uf: 'MG', name: 'Minas Gerais', icmsModalRate: 0.18, ipvaStandardRate: 0.04, pcdIpvaExemptionCeiling: 120000 },
  PA: { uf: 'PA', name: 'Pará', icmsModalRate: 0.19, ipvaStandardRate: 0.025, pcdIpvaExemptionCeiling: 120000 },
  PB: { uf: 'PB', name: 'Paraíba', icmsModalRate: 0.20, ipvaStandardRate: 0.025, pcdIpvaExemptionCeiling: 120000 },
  PR: { uf: 'PR', name: 'Paraná', icmsModalRate: 0.195, ipvaStandardRate: 0.035, pcdIpvaExemptionCeiling: 120000 },
  PE: { uf: 'PE', name: 'Pernambuco', icmsModalRate: 0.205, ipvaStandardRate: 0.024, pcdIpvaExemptionCeiling: 120000 },
  PI: { uf: 'PI', name: 'Piauí', icmsModalRate: 0.21, ipvaStandardRate: 0.025, pcdIpvaExemptionCeiling: 120000 },
  RJ: { uf: 'RJ', name: 'Rio de Janeiro', icmsModalRate: 0.22, ipvaStandardRate: 0.04, pcdIpvaExemptionCeiling: 120000 },
  RN: { uf: 'RN', name: 'Rio Grande do Norte', icmsModalRate: 0.18, ipvaStandardRate: 0.03, pcdIpvaExemptionCeiling: 120000 },
  RS: { uf: 'RS', name: 'Rio Grande do Sul', icmsModalRate: 0.17, ipvaStandardRate: 0.03, pcdIpvaExemptionCeiling: 120000 },
  RO: { uf: 'RO', name: 'Rondônia', icmsModalRate: 0.195, ipvaStandardRate: 0.03, pcdIpvaExemptionCeiling: 120000 },
  RR: { uf: 'RR', name: 'Roraima', icmsModalRate: 0.20, ipvaStandardRate: 0.03, pcdIpvaExemptionCeiling: 120000 },
  SC: { uf: 'SC', name: 'Santa Catarina', icmsModalRate: 0.17, ipvaStandardRate: 0.02, pcdIpvaExemptionCeiling: 120000 },
  SP: { uf: 'SP', name: 'São Paulo', icmsModalRate: 0.18, ipvaStandardRate: 0.04, pcdIpvaExemptionCeiling: 120000 },
  SE: { uf: 'SE', name: 'Sergipe', icmsModalRate: 0.19, ipvaStandardRate: 0.025, pcdIpvaExemptionCeiling: 120000 },
  TO: { uf: 'TO', name: 'Tocantins', icmsModalRate: 0.20, ipvaStandardRate: 0.02, pcdIpvaExemptionCeiling: 120000 },
};

export const WORK_REGIME_LABELS: Record<WorkRegime, { title: string; subtitle: string }> = {
  CLT: {
    title: 'CLT (Carteira Assinada)',
    subtitle: 'INSS em folha, IRPF progressivo e 13º salário.',
  },
  PUBLIC_SERVANT: {
    title: 'Servidor Público (RPPS/RGPS)',
    subtitle: 'Contribuição previdenciária própria e IRPF na fonte.',
  },
  PJ_SIMPLES: {
    title: 'Pessoa Jurídica (Simples Nacional)',
    subtitle: 'DAS sobre faturamento (Anexo III) + pró-labore com INSS.',
  },
  PJ_MEI: {
    title: 'Microempreendedor Individual (MEI)',
    subtitle: 'DAS fixo mensal (5% do salário mínimo + ISS/ICMS). Teto de R$ 81 mil/ano.',
  },
  AUTONOMO: {
    title: 'Autônomo / Profissional Liberal',
    subtitle: 'INSS Contribuinte Individual, ISS municipal e IRPF Carnê-Leão.',
  },
  RETIRED: {
    title: 'Aposentado / Pensionista',
    subtitle: 'Proventos previdenciários, isenção extra 65+ anos e regra legal de moléstia grave/PCD.',
  },
};

export interface PresetPersona {
  id: string;
  name: string;
  description: string;
  profile: UserProfile;
}

export const PRESET_PERSONAS: PresetPersona[] = [
  {
    id: 'clt-pleno',
    name: 'Trabalhador CLT',
    description: 'Analista com carteira assinada, R$ 6.800/mês, 1 dependente em SP.',
    profile: {
      grossMonthlyIncome: 6800,
      regime: 'CLT',
      isPCD: false,
      hasQualifyingConditionForIRExemption: false,
      age: 34,
      dependentsCount: 1,
      annualHealthExpenses: 4200,
      annualEducationExpenses: 3600,
      annualAlimonyExpenses: 0,
      mandatoryDiscountsMonthly: 0,
      includesThirteenthSalary: true,
      stateUF: 'SP',
      ownsVehicleValue: 65000,
    },
  },
  {
    id: 'pcd-aposentado',
    name: 'Aposentado PCD / Moléstia Grave',
    description: 'Aposentado enquadrado na Lei 7.713/88 (art. 6º, XIV), R$ 7.500/mês e veículo elegível.',
    profile: {
      grossMonthlyIncome: 7500,
      regime: 'RETIRED',
      isPCD: true,
      hasQualifyingConditionForIRExemption: true,
      age: 67,
      dependentsCount: 1,
      annualHealthExpenses: 8400,
      annualEducationExpenses: 0,
      annualAlimonyExpenses: 0,
      mandatoryDiscountsMonthly: 0,
      includesThirteenthSalary: true,
      stateUF: 'SP',
      ownsVehicleValue: 105000,
    },
  },
  {
    id: 'pj-simples',
    name: 'Profissional PJ (Simples Nacional)',
    description: 'Prestador de serviços no Anexo III com faturamento de R$ 12.000/mês e Fator R.',
    profile: {
      grossMonthlyIncome: 12000,
      regime: 'PJ_SIMPLES',
      isPCD: false,
      hasQualifyingConditionForIRExemption: false,
      age: 31,
      dependentsCount: 0,
      annualHealthExpenses: 3200,
      annualEducationExpenses: 2400,
      annualAlimonyExpenses: 0,
      mandatoryDiscountsMonthly: 120,
      includesThirteenthSalary: false,
      stateUF: 'PR',
      ownsVehicleValue: 80000,
    },
  },
  {
    id: 'cidadao-mei',
    name: 'Microempreendedor (MEI)',
    description: 'Prestador de serviços MEI com faturamento mensal de R$ 4.500/mês.',
    profile: {
      grossMonthlyIncome: 4500,
      regime: 'PJ_MEI',
      isPCD: false,
      hasQualifyingConditionForIRExemption: false,
      age: 29,
      dependentsCount: 2,
      annualHealthExpenses: 1200,
      annualEducationExpenses: 1800,
      annualAlimonyExpenses: 0,
      mandatoryDiscountsMonthly: 0,
      includesThirteenthSalary: false,
      stateUF: 'MG',
      ownsVehicleValue: 45000,
    },
  },
];

export interface GlossaryItem {
  term: string;
  category: 'Direto' | 'Previdência' | 'Consumo' | 'Isenção & Conceito';
  summary: string;
  legalOrTechnicalBasis: string;
}

export const TAX_GLOSSARY: GlossaryItem[] = [
  {
    term: 'IRPF (Imposto de Renda Pessoa Física)',
    category: 'Direto',
    summary:
      'Tributo federal progressivo incidente sobre a renda tributável após deduções legais (INSS, dependentes, saúde, educação e pensão) ou desconto simplificado.',
    legalOrTechnicalBasis: 'Lei nº 7.713/1988, Lei nº 9.250/1995 e Lei nº 15.270/2025.',
  },
  {
    term: 'INSS / Contribuição Previdenciária',
    category: 'Previdência',
    summary:
      'Contribuição obrigatória para financiamento da seguridade social. Desde março de 2020 (EC 103/2019), o cálculo passou a ser progressivo por faixas até o teto previdenciário.',
    legalOrTechnicalBasis: 'Emenda Constitucional nº 103/2019 e Lei nº 8.212/1991.',
  },
  {
    term: 'Defasagem da Tabela do IRPF',
    category: 'Isenção & Conceito',
    summary:
      'Diferença entre a correção acumulada da inflação (IPCA) e os reajustes parciais aplicados às faixas do Imposto de Renda desde 1996. Quando a tabela não acompanha a inflação, reajustes salariais apenas de reposição aumentam o imposto pago.',
    legalOrTechnicalBasis: 'Série histórica IPCA/IBGE e estudos técnicos Sindifisco Nacional / DIEESE.',
  },
  {
    term: 'Tributos Indiretos sobre Consumo (ICMS, PIS, COFINS, IPI, ISS)',
    category: 'Consumo',
    summary:
      'Tributos embutidos no preço de alimentos, energia, combustíveis, vestuário e serviços. Como o consumo representa parcela maior da renda nas faixas salariais mais baixas, a tributação indireta tem efeito regressivo.',
    legalOrTechnicalBasis: 'Pesquisa de Orçamentos Familiares (POF/IBGE), IPEA e EC nº 132/2023 (CBS e IBS).',
  },
  {
    term: 'Isenção de IRPF para PCD / Moléstia Grave',
    category: 'Isenção & Conceito',
    summary:
      'Aposentados, pensionistas e reformados diagnosticados com condições ou doenças graves previstas em lei têm direito à isenção de IRPF sobre os rendimentos previdenciários, mesmo que a condição tenha sido adquirida após a aposentadoria.',
    legalOrTechnicalBasis: 'Lei nº 7.713/1988, art. 6º, inciso XIV, e Súmula 598 do STJ.',
  },
  {
    term: 'Dia da Liberdade de Impostos',
    category: 'Isenção & Conceito',
    summary:
      'Indicador educativo que converte a alíquota efetiva total (tributos diretos + indiretos sobre a renda bruta anual) na fração equivalente dos 365 dias do ano calendário.',
    legalOrTechnicalBasis: 'Cálculo proporcional: round((Total de Tributos / Renda Bruta Anual) * 365).',
  },
  {
    term: 'Simples Nacional e DAS-MEI',
    category: 'Direto',
    summary:
      'Regimes tributários simplificados para micro e pequenas empresas (LC 123/2006). No MEI, o pagamento é fixo em percentual do salário mínimo; no Simples Nacional (Anexo III), a alíquota inicia em 6% sobre o faturamento bruto somada ao INSS sobre pró-labore.',
    legalOrTechnicalBasis: 'Lei Complementar nº 123/2006 e Lei Complementar nº 155/2016.',
  },
];

export interface ConsumptionProductExample {
  id: string;
  name: string;
  referencePrice: number;
  totalTaxRatePct: number;
  icmsPct: number;
  ipiPct: number;
  pisCofinsPct: number;
  issOrOtherPct: number;
  howItApplies: string;
  reformNote: string;
}

export const CONSUMPTION_PRODUCT_EXAMPLES: ConsumptionProductExample[] = [
  {
    id: 'refrigerante',
    name: 'Refrigerante (Garrafa 2L)',
    referencePrice: 10.0,
    totalTaxRatePct: 45.2,
    icmsPct: 20.0,
    ipiPct: 6.5,
    pisCofinsPct: 11.7,
    issOrOtherPct: 7.0,
    howItApplies:
      'No refrigerante, o imposto é cobrado de forma concentrada na indústria (regime monofásico de PIS/COFINS e Substituição Tributária de ICMS-ST), além de IPI federal e encargos da cadeia. Em uma garrafa de R$ 10,00, cerca de R$ 4,52 são tributos embutidos no preço de prateleira.',
    reformNote:
      'Com a Reforma Tributária (EC 132/2023 e LC 214/2025), bebidas açucaradas passam a sofrer incidência do Imposto Seletivo (IS) federal além da alíquota padrão de CBS e IBS.',
  },
  {
    id: 'sorvete',
    name: 'Sorvete de Massa (Pote 1,5L)',
    referencePrice: 25.0,
    totalTaxRatePct: 39.4,
    icmsPct: 19.5,
    ipiPct: 5.0,
    pisCofinsPct: 9.25,
    issOrOtherPct: 5.65,
    howItApplies:
      'No sorvete, a classificação fiscal na tabela de industrializados (TIPI) historicamente o trata como item não essencial, aplicando ICMS cheio (frequentemente com substituição tributária estadual), IPI de 5% e PIS/COFINS de 9,25%. Em um pote de R$ 25,00, aproximadamente R$ 9,85 vão para impostos.',
    reformNote:
      'Diferente do pão francês ou leite fluido (que têm redução ou alíquota zero na cesta básica), sorvetes permanecem na alíquota cheia de CBS/IBS.',
  },
  {
    id: 'cesta-basica',
    name: 'Arroz e Feijão (Pacote 5kg + 1kg)',
    referencePrice: 35.0,
    totalTaxRatePct: 9.5,
    icmsPct: 7.0,
    ipiPct: 0.0,
    pisCofinsPct: 0.0,
    issOrOtherPct: 2.5,
    howItApplies:
      'No arroz e feijão, há alíquota zero de PIS/COFINS federal (Lei 10.925/2004) e IPI zero (NT), restando ICMS reduzido na maioria das UFs (cerca de 7%) e tributos indiretos acumulados no frete e embalagem.',
    reformNote:
      'Na Cesta Básica Nacional de Alimentos (EC 132/2023), arroz e feijão têm alíquota reduzida a zero tanto para CBS (federal) quanto para IBS (estadual/municipal).',
  },
  {
    id: 'gasolina',
    name: 'Gasolina Comum (Abastecimento 40L)',
    referencePrice: 240.0,
    totalTaxRatePct: 36.8,
    icmsPct: 22.8,
    ipiPct: 0.0,
    pisCofinsPct: 11.5,
    issOrOtherPct: 2.5,
    howItApplies:
      'Na gasolina, o ICMS é cobrado no regime monofásico com valor fixo por litro definido pelo CONFAZ em todo o país, somado a PIS/COFINS e CIDE-Combustíveis federais sobre a refinaria.',
    reformNote:
      'Combustíveis têm regime monofásico específico no IBS/CBS, com cobrança única na refinaria ou importação.',
  },
  {
    id: 'energia-eletrica',
    name: 'Conta de Energia Elétrica Residencial',
    referencePrice: 220.0,
    totalTaxRatePct: 29.5,
    icmsPct: 18.0,
    pisCofinsPct: 5.5,
    ipiPct: 0.0,
    issOrOtherPct: 6.0,
    howItApplies:
      'Na conta de luz, o ICMS estadual incide "por dentro" (integrando a própria base de cálculo), somado ao PIS/COFINS variável mês a mês e à CIP/COSIP (contribuição municipal de iluminação pública).',
    reformNote:
      'Após a LC 194/2022 e decisões do STF (Tema 745), a energia elétrica passou a ser tratada como bem essencial, vedando alíquotas de ICMS superiores à alíquota modal do estado.',
  },
  {
    id: 'automovel',
    name: 'Automóvel de Passeio 0km (1.0 Flex)',
    referencePrice: 85000.0,
    totalTaxRatePct: 38.6,
    icmsPct: 14.5,
    ipiPct: 7.0,
    pisCofinsPct: 11.6,
    issOrOtherPct: 5.5,
    howItApplies:
      'Na compra de um carro novo, incidem IPI federal (variável conforme cilindrada, combustível e eficiência energética no programa Mover), ICMS estadual, PIS/COFINS monofásico e encargos sobre autopeças. Pessoas com Deficiência (PCD) têm direito a isenção de IPI (até R$ 200 mil) e ICMS parcial (até R$ 120 mil).',
    reformNote:
      'Além do tributo na compra, o proprietário passa a pagar anualmente o IPVA estadual (2% a 4% do valor venal).',
  },
  {
    id: 'servicos',
    name: 'Serviços (Mensalidade Escolar, Academia ou Streaming)',
    referencePrice: 300.0,
    totalTaxRatePct: 15.8,
    icmsPct: 0.0,
    ipiPct: 0.0,
    pisCofinsPct: 3.65,
    issOrOtherPct: 12.15,
    howItApplies:
      'Nos serviços urbanos, não incide ICMS nem IPI; o tributo principal é o ISS municipal (de 2% a 5% sobre o preço do serviço), acompanhado de PIS/COFINS e tributos sobre a folha e lucro da prestadora repassados ao preço.',
    reformNote:
      'Serviços de educação e saúde contam com redução de 60% na alíquota padrão de CBS e IBS na Reforma Tributária.',
  },
];

export interface DetailedTaxExplanation {
  id: string;
  title: string;
  sphere: 'Federal' | 'Estadual' | 'Municipal' | 'Misto (União, Estados e Municípios)';
  categoryLabel: string;
  whatItIs: string;
  howItAppliesStepByStep: string[];
  practicalExamples: Array<{ context: string; explanation: string }>;
}

export const DETAILED_TAX_GUIDES: DetailedTaxExplanation[] = [
  {
    id: 'guia-consumo',
    title: '1. Impostos sobre o Consumo (ICMS, IPI, PIS/COFINS, ISS e novos CBS/IBS)',
    sphere: 'Misto (União, Estados e Municípios)',
    categoryLabel: 'Indiretos (Embutidos no Preço)',
    whatItIs:
      'É o conjunto de tributos aplicado sobre mercadorias, alimentos, energia, combustíveis e serviços. É chamado de "imposto indireto" porque quem recolhe a guia ao governo é a empresa (supermercado, fábrica, prestador), mas quem paga financeiramente é o consumidor final no preço do produto.',
    howItAppliesStepByStep: [
      'Cálculo "por dentro": no Brasil, tributos como o ICMS integram a sua própria base de cálculo, fazendo a alíquota efetiva real ser maior que a alíquota nominal.',
      'Diferenciação por essencialidade: produtos da cesta básica (arroz, feijão) têm desoneração; produtos industrializados ou supérfluos (refrigerante, sorvete, cosméticos, eletrônicos) acumulam ICMS, IPI e PIS/COFINS.',
      'Efeito regressivo na renda: como todos pagam o mesmo imposto embutido no quilo do alimento ou no litro de combustível, quem ganha 1 salário mínimo compromete fatia muito maior da renda com tributos de consumo do que quem ganha 20 salários mínimos.',
    ],
    practicalExamples: [
      {
        context: 'No refrigerante',
        explanation:
          'Acumula ICMS com Substituição Tributária (cobrado antecipadamente na fábrica), IPI de bebida açucarada e PIS/COFINS monofásico, somando cerca de 45% do preço pago no caixa.',
      },
      {
        context: 'No sorvete',
        explanation:
          'Por ser tratado na legislação do IPI e do ICMS como item de confeitaria/industrializado não básico, carrega cerca de 39% de carga tributária total entre fábrica e varejo.',
      },
      {
        context: 'No arroz e feijão',
        explanation:
          'Conta com alíquota zero de PIS/COFINS e IPI zero, restando apenas ICMS reduzido estadual e impostos indiretos sobre o diesel do transporte (~9,5% do preço).',
      },
    ],
  },
  {
    id: 'guia-irpf',
    title: '2. Imposto sobre a Renda (IRPF e IRRF na Fonte)',
    sphere: 'Federal',
    categoryLabel: 'Direto e Progressivo',
    whatItIs:
      'É o imposto federal que incide diretamente sobre os rendimentos do trabalho (salário CLT, pró-labore, trabalho autônomo), aposentadorias e outros proventos que superem o limite de isenção vigente.',
    howItAppliesStepByStep: [
      'Apuração da Base de Cálculo: do salário bruto desconta-se primeiro o INSS e R$ 189,59 por dependente (ou aplica-se o desconto simplificado mensal caso seja maior).',
      'Progressividade por faixas: você nunca paga 27,5% sobre todo o salário. A primeira faixa é sempre isenta (0%), a segunda paga 7,5%, a terceira 15%, a quarta 22,5% e apenas o que excede o topo paga 27,5%.',
      'Declaração de Ajuste Anual: uma vez por ano, a Receita Federal compara os descontos mensais com suas despesas médicas (sem limite legal) e de educação (limitadas a R$ 3.561,50/pessoa), escolhendo entre o modelo Completo ou Simplificado (20% limitado a R$ 16.754,34).',
    ],
    practicalExamples: [
      {
        context: 'No contracheque CLT ou Servidor',
        explanation:
          'É retido diretamente na fonte (IRRF) todo mês pelo empregador antes de o salário cair na conta bancária.',
      },
      {
        context: 'Na aposentadoria de PCD / Moléstia Grave',
        explanation:
          'Pela Lei nº 7.713/1988 (art. 6º, XIV), proventos de aposentadoria, pensão ou reforma de pessoas com doenças graves ou condições previstas em lei têm isenção de 100% de IRPF.',
      },
    ],
  },
  {
    id: 'guia-inss',
    title: '3. Contribuição Previdenciária (INSS / RPPS)',
    sphere: 'Federal',
    categoryLabel: 'Seguridade Social',
    whatItIs:
      'É a contribuição vinculada que financia a aposentadoria, o auxílio-doença, a licença-maternidade e a pensão por morte. Desde a Reforma da Previdência (EC 103/2019), passou a ser calculada de forma progressiva por faixas (7,5%, 9%, 12% e 14%).',
    howItAppliesStepByStep: [
      'Trabalhador CLT: paga entre 7,5% e 14% de forma progressiva sobre cada fatia salarial, travado no Teto do INSS (R$ 8.475,55 em 2026). Acima do teto, o desconto de INSS na CLT não sobe mais.',
      'Servidor Público (RPPS): contribui de forma progressiva e, na maioria dos regimes próprios, continua pagando 14% mesmo sobre a parcela que ultrapassa o teto do INSS.',
      'MEI e PJ Simples: no MEI a contribuição é de apenas 5% sobre o salário mínimo vigente; no Simples Nacional incide 11% sobre o valor retirado como pró-labore.',
    ],
    practicalExamples: [
      {
        context: 'Em um salário CLT de R$ 4.000,00',
        explanation:
          'A primeira fatia (até 1 salário mínimo) paga 7,5%, a segunda fatia paga 9% e a terceira fatia paga 12%, gerando uma alíquota efetiva real de cerca de 9,4%, e não 12% cheios.',
      },
    ],
  },
  {
    id: 'guia-patrimonio-pj',
    title: '4. Impostos sobre Patrimônio e Atividade PJ (IPVA, Simples Nacional e MEI)',
    sphere: 'Misto (União, Estados e Municípios)',
    categoryLabel: 'Patrimônio e Faturamento',
    whatItIs:
      'Reúne os tributos anuais sobre a propriedade de veículos (IPVA estadual) e os regimes unificados de tributação sobre o faturamento de quem trabalha como Pessoa Jurídica (MEI ou Simples Nacional).',
    howItAppliesStepByStep: [
      'IPVA Estadual: calculado multiplicando o valor venal do veículo (Tabela FIPE) pela alíquota do estado (de 2% em estados como SC/ES/AC até 4% em SP/RJ/MG). Pessoas com Deficiência (PCD) possuem isenção total ou parcial até o teto estadual.',
      'DAS-MEI: guia mensal única com valor fixo (5% do salário mínimo de INSS + R$ 5,00 de ISS para serviços ou R$ 1,00 de ICMS para comércio), respeitado o teto de R$ 81.000/ano.',
      'Simples Nacional (Anexo III / Fator R): unifica IRPJ, CSLL, PIS, COFINS, CPP e ISS em uma única guia (DAS) que inicia em 6% sobre a nota fiscal emitida.',
    ],
    practicalExamples: [
      {
        context: 'No carro de passeio de R$ 65.000 em SP vs. SC',
        explanation:
          'Em São Paulo (alíquota de 4%), o IPVA anual é de R$ 2.600,00; em Santa Catarina (alíquota de 2%), o mesmo veículo paga R$ 1.300,00 por ano.',
      },
      {
        context: 'Na nota fiscal de serviço PJ Simples de R$ 10.000',
        explanation:
          'Na 1ª faixa do Anexo III (faturamento até R$ 180 mil/ano), a guia DAS desconta 6% (R$ 600,00), somada ao INSS e IRPF sobre o pró-labore do sócio.',
      },
    ],
  },
];

