import {
  AVAILABLE_YEARS,
  STATE_TAX_DATA,
  TAX_PARAMETERS_BY_YEAR,
  WORK_REGIME_LABELS,
} from '../data/taxParameters.ts';
import type {
  PCDExemptionRight,
  RegimeComparisonItem,
  TaxParametersYear,
  UserProfile,
  WorkRegime,
  YearlyTaxResult,
} from '../types.ts';

const MONTHS_IN_YEAR = 12;

export function calculateMonthlyINSS(
  grossMonthly: number,
  params: TaxParametersYear,
  regime: WorkRegime
): number {
  if (grossMonthly <= 0) return 0;

  if (regime === 'PJ_MEI') {
    return Number((params.minimumWage * 0.05).toFixed(2));
  }

  if (regime === 'PJ_SIMPLES') {
    const proLabore = Math.min(
      Math.max(grossMonthly * 0.28, params.minimumWage),
      params.inssCeiling
    );
    return Number((proLabore * 0.11).toFixed(2));
  }

  if (regime === 'AUTONOMO') {
    const base = Math.min(Math.max(grossMonthly, params.minimumWage), params.inssCeiling);
    return Number((base * 0.2).toFixed(2));
  }

  if (regime === 'RETIRED') {
    if (grossMonthly <= params.inssCeiling) return 0;
    const rate = params.inssProgressive ? 0.14 : 0.11;
    return Number(((grossMonthly - params.inssCeiling) * rate).toFixed(2));
  }

  const cappedSalary = Math.min(grossMonthly, params.inssCeiling);

  if (!params.inssProgressive) {
    const matchingBracket =
      params.inssBrackets.find((b) => cappedSalary <= b.limit) ??
      params.inssBrackets[params.inssBrackets.length - 1];
    const baseContribution = cappedSalary * matchingBracket.rate;
    if (regime === 'PUBLIC_SERVANT' && grossMonthly > params.inssCeiling) {
      return Number(
        (baseContribution + (grossMonthly - params.inssCeiling) * 0.11).toFixed(2)
      );
    }
    return Number(baseContribution.toFixed(2));
  }

  let total = 0;
  let previousLimit = 0;
  for (const bracket of params.inssBrackets) {
    if (cappedSalary > previousLimit) {
      const slice = Math.min(cappedSalary, bracket.limit) - previousLimit;
      total += slice * bracket.rate;
      previousLimit = bracket.limit;
    }
  }

  if (regime === 'PUBLIC_SERVANT' && grossMonthly > params.inssCeiling) {
    total += (grossMonthly - params.inssCeiling) * 0.14;
  }

  return Number(total.toFixed(2));
}

export function calculateMonthlyIRPFFromBase(
  taxableBase: number,
  brackets: TaxParametersYear['irpfBrackets'],
  params: TaxParametersYear,
  grossMonthlyReference: number
): number {
  if (taxableBase <= 0) return 0;

  const bracket =
    brackets.find((b) => taxableBase <= b.limit) ?? brackets[brackets.length - 1];
  const rawTax = Math.max(0, taxableBase * bracket.rate - bracket.deduction);

  if (params.irpf2026MonthlyExemptionLimit && rawTax > 0) {
    if (grossMonthlyReference <= params.irpf2026MonthlyExemptionLimit) {
      return 0;
    }
    if (grossMonthlyReference < 7350) {
      const reducer = Math.max(0, 1331.88 - 0.181208 * grossMonthlyReference);
      return Number(Math.max(0, rawTax - reducer).toFixed(2));
    }
  }

  return Number(rawTax.toFixed(2));
}

export function resolveIncomeDecile(grossMonthly: number, minimumWage: number): number {
  if (grossMonthly <= 0 || minimumWage <= 0) return 1;
  const multiples = grossMonthly / minimumWage;
  if (multiples <= 1.0) return 1;
  if (multiples <= 1.5) return 2;
  if (multiples <= 2.0) return 3;
  if (multiples <= 2.8) return 4;
  if (multiples <= 3.8) return 5;
  if (multiples <= 5.2) return 6;
  if (multiples <= 7.5) return 7;
  if (multiples <= 11.0) return 8;
  if (multiples <= 18.0) return 9;
  return 10;
}

export function formatTaxFreedomDate(daysWorkedForTaxes: number, year: number): string {
  const clampedDays = Math.max(0, Math.min(365, Math.round(daysWorkedForTaxes)));
  if (clampedDays === 0) return '1 de janeiro';
  const date = new Date(year, 0, clampedDays);
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

export function calculateYearlyTax(
  profile: UserProfile,
  year: number
): YearlyTaxResult {
  const params = TAX_PARAMETERS_BY_YEAR[year] ?? TAX_PARAMETERS_BY_YEAR[2026];
  const grossMonthly = Math.max(0, profile.grossMonthlyIncome || 0);
  const has13th =
    Boolean(profile.includesThirteenthSalary) &&
    (profile.regime === 'CLT' ||
      profile.regime === 'PUBLIC_SERVANT' ||
      profile.regime === 'RETIRED');
  const salaryMonths = has13th ? 13 : 12;
  const grossAnnualIncome = Number((grossMonthly * salaryMonths).toFixed(2));

  if (grossAnnualIncome === 0) {
    return {
      year,
      grossAnnualIncome: 0,
      netAnnualIncome: 0,
      totalDirectTaxes: 0,
      totalEstimatedIndirectTaxes: 0,
      totalTaxesPaid: 0,
      effectiveTaxRate: 0,
      daysWorkedForTaxes: 0,
      pcdSavingsAmount: 0,
      netDisposableAfterConsumptionTaxes: 0,
      inssAnnual: 0,
      irpfAnnual: 0,
      pjOrAutonomousTaxesAnnual: 0,
      ipvaEstimatedAnnual: 0,
      classCouncilOrOtherDiscountsAnnual: 0,
      deductionModelUsed: 'NAO_APLICAVEL',
      irpfWithInflationCorrectedTable: 0,
      irpfLagExtraCost: 0,
      totalDeductionsSavings: 0,
      taxFreedomDate: '1 de janeiro',
      incomeDecile: 1,
      consumptionTaxRateApplied: 0,
    };
  }

  const monthlyINSS = calculateMonthlyINSS(grossMonthly, params, profile.regime);
  const inssAnnual = Number((monthlyINSS * salaryMonths).toFixed(2));

  let pjOrAutonomousTaxesAnnual = 0;
  if (profile.regime === 'PJ_MEI') {
    // ISS fixo R$ 5,00 + ICMS R$ 1,00 mensais no DAS-MEI
    pjOrAutonomousTaxesAnnual = Number((6.0 * MONTHS_IN_YEAR).toFixed(2));
  } else if (profile.regime === 'PJ_SIMPLES') {
    const rbt12 = grossAnnualIncome;
    let effectiveSimplesRate = 0.06;
    if (rbt12 > 180000 && rbt12 <= 360000) {
      effectiveSimplesRate = (rbt12 * 0.112 - 9360) / rbt12;
    } else if (rbt12 > 360000 && rbt12 <= 720000) {
      effectiveSimplesRate = (rbt12 * 0.135 - 17640) / rbt12;
    } else if (rbt12 > 720000) {
      effectiveSimplesRate = (rbt12 * 0.16 - 35640) / rbt12;
    }
    pjOrAutonomousTaxesAnnual = Number((grossAnnualIncome * effectiveSimplesRate).toFixed(2));
  } else if (profile.regime === 'AUTONOMO') {
    // ISS médio estimado para autônomo (3% limitado a R$ 1.800/ano para ISS fixo profissional)
    pjOrAutonomousTaxesAnnual = Number(Math.min(grossAnnualIncome * 0.03, 1800).toFixed(2));
  }

  // Cálculo do IRPF (Completo vs. Simplificado)
  let taxableMonthlyGross = grossMonthly;
  if (profile.regime === 'PJ_MEI') {
    // Parcela isenta de 32% para serviços no MEI; restante tributável após despesas
    taxableMonthlyGross = Math.max(0, grossMonthly * 0.68 - monthlyINSS);
  } else if (profile.regime === 'PJ_SIMPLES') {
    // No Simples Nacional com contabilidade regular, o lucro distribuído é isento e o IRPF incide sobre o pró-labore (28%)
    taxableMonthlyGross = Math.max(grossMonthly * 0.28, params.minimumWage);
  }

  const seniorExemptionMonthly =
    profile.regime === 'RETIRED' && profile.age >= 65
      ? params.senior65ExtraExemptionMonthly
      : 0;

  const monthlyGrossAfterSenior = Math.max(0, taxableMonthlyGross - seniorExemptionMonthly);

  const dependentsDeductionMonthly =
    Math.max(0, profile.dependentsCount) * params.dependentDeductionMonthly;
  const healthMonthly = Math.max(0, profile.annualHealthExpenses ?? 0) / MONTHS_IN_YEAR;
  const maxEducationAnnual =
    params.educationAnnualLimitPerPerson * (1 + Math.max(0, profile.dependentsCount));
  const allowedEducationAnnual = Math.min(
    Math.max(0, profile.annualEducationExpenses ?? 0),
    maxEducationAnnual
  );
  const educationMonthly = allowedEducationAnnual / MONTHS_IN_YEAR;
  const alimonyMonthly = Math.max(0, profile.annualAlimonyExpenses ?? 0) / MONTHS_IN_YEAR;

  const completeDeductionsMonthly =
    monthlyINSS +
    dependentsDeductionMonthly +
    healthMonthly +
    educationMonthly +
    alimonyMonthly;

  const annualSimplifiedCapMonthly = params.simplifiedDiscountLimit / MONTHS_IN_YEAR;
  const simplifiedDiscountMonthly = Math.max(
    params.monthlySimplifiedDiscount,
    Math.min(monthlyGrossAfterSenior * 0.2, annualSimplifiedCapMonthly)
  );

  const baseCompleteMonthly = Math.max(0, monthlyGrossAfterSenior - completeDeductionsMonthly);
  const baseSimplifiedMonthly = Math.max(0, monthlyGrossAfterSenior - simplifiedDiscountMonthly);
  const baseNoDeductionsMonthly = Math.max(0, taxableMonthlyGross - monthlyINSS);

  const irpfCompleteMonthly = calculateMonthlyIRPFFromBase(
    baseCompleteMonthly,
    params.irpfBrackets,
    params,
    monthlyGrossAfterSenior
  );
  const irpfSimplifiedMonthly = calculateMonthlyIRPFFromBase(
    baseSimplifiedMonthly,
    params.irpfBrackets,
    params,
    monthlyGrossAfterSenior
  );
  const irpfWithoutLegalDeductionsMonthly = calculateMonthlyIRPFFromBase(
    baseNoDeductionsMonthly,
    params.irpfBrackets,
    params,
    taxableMonthlyGross
  );

  const isCompleteBetter = irpfCompleteMonthly <= irpfSimplifiedMonthly;
  const chosenMonthlyIRPF = isCompleteBetter ? irpfCompleteMonthly : irpfSimplifiedMonthly;

  let deductionModelUsed: YearlyTaxResult['deductionModelUsed'] =
    profile.regime === 'PJ_MEI' && chosenMonthlyIRPF === 0
      ? 'NAO_APLICAVEL'
      : isCompleteBetter
        ? 'COMPLETA'
        : 'SIMPLIFICADA';

  let irpfAnnual = Number((chosenMonthlyIRPF * salaryMonths).toFixed(2));
  let pcdSavingsAmount = 0;

  // Isenção legal de IRPF sobre aposentadoria/reforma/pensão para doença grave ou condição qualificada (Lei 7.713/88 art. 6º XIV)
  if (
    profile.regime === 'RETIRED' &&
    (profile.hasQualifyingConditionForIRExemption || profile.isPCD)
  ) {
    if (profile.hasQualifyingConditionForIRExemption) {
      pcdSavingsAmount += irpfAnnual;
      irpfAnnual = 0;
      deductionModelUsed = 'ISENTO_PCD';
    }
  }

  // Cálculo da defasagem da tabela do IRPF (tabela corrigida pelo fator IPCA acumulado)
  const correctedBrackets = params.irpfBrackets.map((b) => ({
    limit: b.limit === Infinity ? Infinity : b.limit * params.irpfTableLagFactor,
    rate: b.rate,
    deduction: b.deduction * params.irpfTableLagFactor,
  }));
  const correctedDependentDeduction =
    params.dependentDeductionMonthly * params.irpfTableLagFactor;
  const correctedEducationMonthly =
    Math.min(
      Math.max(0, profile.annualEducationExpenses ?? 0),
      maxEducationAnnual * params.irpfTableLagFactor
    ) / MONTHS_IN_YEAR;
  const correctedCompleteBase = Math.max(
    0,
    monthlyGrossAfterSenior -
      (monthlyINSS +
        Math.max(0, profile.dependentsCount) * correctedDependentDeduction +
        healthMonthly +
        correctedEducationMonthly +
        alimonyMonthly)
  );
  const correctedSimplifiedBase = Math.max(
    0,
    monthlyGrossAfterSenior -
      Math.min(
        monthlyGrossAfterSenior * 0.2,
        (params.simplifiedDiscountLimit * params.irpfTableLagFactor) / MONTHS_IN_YEAR
      )
  );
  const correctedBestBase = Math.min(correctedCompleteBase, correctedSimplifiedBase);
  const correctedMonthlyIRPF =
    deductionModelUsed === 'ISENTO_PCD'
      ? 0
      : calculateMonthlyIRPFFromBase(
          correctedBestBase,
          correctedBrackets,
          { ...params, irpf2026MonthlyExemptionLimit: undefined },
          monthlyGrossAfterSenior
        );

  const irpfWithInflationCorrectedTable = Number(
    (correctedMonthlyIRPF * salaryMonths).toFixed(2)
  );
  const irpfLagExtraCost = Number(
    Math.max(0, irpfAnnual - irpfWithInflationCorrectedTable).toFixed(2)
  );

  // Economia gerada por dependentes, saúde, educação, pensão e isenção 65+
  const baselineIRPFAnnual = Number(
    (irpfWithoutLegalDeductionsMonthly * salaryMonths).toFixed(2)
  );
  const totalDeductionsSavings = Number(
    Math.max(0, baselineIRPFAnnual - irpfAnnual).toFixed(2)
  );

  // IPVA e Isenção PCD sobre veículo
  const stateInfo = STATE_TAX_DATA[profile.stateUF || 'SP'] ?? STATE_TAX_DATA.SP;
  const vehicleValue = Math.max(0, profile.ownsVehicleValue ?? 0);
  const fullIpva = Number((vehicleValue * stateInfo.ipvaStandardRate).toFixed(2));
  let ipvaEstimatedAnnual = fullIpva;

  if (profile.isPCD && vehicleValue > 0) {
    if (vehicleValue <= stateInfo.pcdIpvaExemptionCeiling) {
      pcdSavingsAmount = Number((pcdSavingsAmount + fullIpva).toFixed(2));
      ipvaEstimatedAnnual = 0;
    } else {
      const exemptPortion = stateInfo.pcdIpvaExemptionCeiling * stateInfo.ipvaStandardRate;
      pcdSavingsAmount = Number((pcdSavingsAmount + exemptPortion).toFixed(2));
      ipvaEstimatedAnnual = Number(Math.max(0, fullIpva - exemptPortion).toFixed(2));
    }
  }

  // Se o usuário é PCD e deduziu despesas médicas na declaração completa, contabiliza a economia tributária de saúde
  if (profile.isPCD && (profile.annualHealthExpenses ?? 0) > 0 && isCompleteBetter && irpfAnnual > 0) {
    const baseWithoutHealth = Math.max(
      0,
      monthlyGrossAfterSenior - (completeDeductionsMonthly - healthMonthly)
    );
    const irpfWithoutHealth =
      calculateMonthlyIRPFFromBase(
        baseWithoutHealth,
        params.irpfBrackets,
        params,
        monthlyGrossAfterSenior
      ) * salaryMonths;
    const healthTaxSaving = Math.max(0, irpfWithoutHealth - irpfAnnual);
    pcdSavingsAmount = Number((pcdSavingsAmount + healthTaxSaving).toFixed(2));
  }

  const classCouncilOrOtherDiscountsAnnual = Number(
    (Math.max(0, profile.mandatoryDiscountsMonthly ?? 0) * MONTHS_IN_YEAR).toFixed(2)
  );

  const totalDirectTaxes = Number(
    (
      inssAnnual +
      irpfAnnual +
      pjOrAutonomousTaxesAnnual +
      ipvaEstimatedAnnual +
      classCouncilOrOtherDiscountsAnnual
    ).toFixed(2)
  );

  const netAnnualIncome = Number(
    Math.max(0, grossAnnualIncome - totalDirectTaxes).toFixed(2)
  );

  // Estimativa de tributos indiretos sobre o consumo (IBGE/POF + IPEA + ajuste de ICMS modal da UF)
  const incomeDecile = resolveIncomeDecile(grossMonthly, params.minimumWage);
  const baseDecileConsumptionRate =
    params.estimatedConsumptionTaxRateByIncomeDecile[incomeDecile] ?? 0.188;
  const icmsStateAdjustment = (stateInfo.icmsModalRate - 0.185) * 0.45;
  const consumptionTaxRateApplied = Number(
    Math.max(0.08, baseDecileConsumptionRate + icmsStateAdjustment).toFixed(4)
  );

  const totalEstimatedIndirectTaxes = Number(
    (netAnnualIncome * consumptionTaxRateApplied).toFixed(2)
  );

  const totalTaxesPaid = Number(
    (totalDirectTaxes + totalEstimatedIndirectTaxes).toFixed(2)
  );

  const effectiveTaxRate = Number(
    Math.min(100, (totalTaxesPaid / grossAnnualIncome) * 100).toFixed(2)
  );

  const daysWorkedForTaxes = Math.round((effectiveTaxRate / 100) * 365);
  const netDisposableAfterConsumptionTaxes = Number(
    Math.max(0, netAnnualIncome - totalEstimatedIndirectTaxes).toFixed(2)
  );

  return {
    year,
    grossAnnualIncome,
    netAnnualIncome,
    totalDirectTaxes,
    totalEstimatedIndirectTaxes,
    totalTaxesPaid,
    effectiveTaxRate,
    daysWorkedForTaxes,
    pcdSavingsAmount,
    netDisposableAfterConsumptionTaxes,
    inssAnnual,
    irpfAnnual,
    pjOrAutonomousTaxesAnnual,
    ipvaEstimatedAnnual,
    classCouncilOrOtherDiscountsAnnual,
    deductionModelUsed,
    irpfWithInflationCorrectedTable,
    irpfLagExtraCost,
    totalDeductionsSavings,
    taxFreedomDate: formatTaxFreedomDate(daysWorkedForTaxes, year),
    incomeDecile,
    consumptionTaxRateApplied,
  };
}

export function calculateHistoricalSeries(profile: UserProfile): YearlyTaxResult[] {
  return AVAILABLE_YEARS.map((year) => calculateYearlyTax(profile, year));
}

export function compareAllRegimesForYear(
  profile: UserProfile,
  year: number
): RegimeComparisonItem[] {
  const regimes: WorkRegime[] = [
    'CLT',
    'PJ_SIMPLES',
    'PJ_MEI',
    'AUTONOMO',
    'PUBLIC_SERVANT',
    'RETIRED',
  ];

  return regimes.map((regime) => {
    const result = calculateYearlyTax({ ...profile, regime }, year);
    const meta = WORK_REGIME_LABELS[regime];
    let notes = meta.subtitle;
    if (regime === 'PJ_MEI' && result.grossAnnualIncome > 81000) {
      notes = 'Atenção: renda anual supera o teto legal do MEI (R$ 81.000/ano), exigindo migração para Microempresa (Simples).';
    }
    return {
      regime,
      label: meta.title,
      grossAnnualIncome: result.grossAnnualIncome,
      directTaxesAnnual: result.totalDirectTaxes,
      indirectTaxesAnnual: result.totalEstimatedIndirectTaxes,
      netAnnualIncome: result.netAnnualIncome,
      effectiveTaxRate: result.effectiveTaxRate,
      notes,
    };
  });
}

export function getPCDExemptionRights(
  profile: UserProfile,
  year: number
): PCDExemptionRight[] {
  const currentResult = calculateYearlyTax(profile, year);
  const stateInfo = STATE_TAX_DATA[profile.stateUF || 'SP'] ?? STATE_TAX_DATA.SP;
  const vehicleValue = Math.max(0, profile.ownsVehicleValue ?? 95000);

  const baselineWithoutIRExemption = calculateYearlyTax(
    { ...profile, isPCD: false, hasQualifyingConditionForIRExemption: false },
    year
  );
  const irpfExemptionValue = Math.max(
    0,
    baselineWithoutIRExemption.irpfAnnual - currentResult.irpfAnnual
  );

  const ipvaAnnualBenefit =
    Math.min(vehicleValue, stateInfo.pcdIpvaExemptionCeiling) * stateInfo.ipvaStandardRate;

  const ipiPurchaseBenefit = Math.min(vehicleValue, 200000) * 0.08;
  const icmsPurchaseBenefit =
    vehicleValue <= 120000 ? Math.min(vehicleValue, 70000) * stateInfo.icmsModalRate : 0;

  return [
    {
      id: 'irpf-proventos',
      taxName: 'Isenção de IRPF sobre Aposentadoria, Pensão ou Reforma',
      scope: 'Federal (Receita Federal)',
      legalBasis: 'Lei nº 7.713/1988 (art. 6º, XIV) e Súmula 598 do STJ',
      ceilingDescription: 'Isenção integral sobre proventos previdenciários (não se aplica a salários da ativa).',
      estimatedAnnualOrPurchaseBenefit: Number(irpfExemptionValue.toFixed(2)),
      isEligibleForUser:
        profile.regime === 'RETIRED' && profile.hasQualifyingConditionForIRExemption,
      eligibilityNote:
        profile.regime === 'RETIRED' && profile.hasQualifyingConditionForIRExemption
          ? 'Ativo nesta simulação: isenção integral aplicada sobre os proventos.'
          : 'Requer regime Aposentado/Pensionista e laudo de condição prevista na Lei 7.713/88.',
    },
    {
      id: 'ipva-estadual',
      taxName: `Isenção de IPVA (${stateInfo.name} - ${stateInfo.uf})`,
      scope: `Estadual (SEFAZ-${stateInfo.uf})`,
      legalBasis: `Legislação Estadual de ${stateInfo.uf} para condutor ou não condutor PCD`,
      ceilingDescription: `Isenção até o teto venal de R$ ${stateInfo.pcdIpvaExemptionCeiling.toLocaleString('pt-BR')} (alíquota de ${(stateInfo.ipvaStandardRate * 100).toFixed(1)}%).`,
      estimatedAnnualOrPurchaseBenefit: Number(ipvaAnnualBenefit.toFixed(2)),
      isEligibleForUser: profile.isPCD && (profile.ownsVehicleValue ?? 0) > 0,
      eligibilityNote:
        profile.isPCD && (profile.ownsVehicleValue ?? 0) > 0
          ? 'Ativo nesta simulação: redução aplicada no cálculo anual de IPVA.'
          : 'Marque Enquadramento PCD e informe o valor do veículo para incluir no cálculo.',
    },
    {
      id: 'ipi-veiculo',
      taxName: 'Isenção de IPI na Compra de Veículo 0km ou Tecnologia Assistiva',
      scope: 'Federal (SISEN / Receita Federal)',
      legalBasis: 'Lei nº 8.989/1995 (prorrogada pela Lei nº 14.287/2021)',
      ceilingDescription: 'Teto de R$ 200.000,00 para veículos 0km (a cada 3 anos) e isenção em equipamentos de adaptação.',
      estimatedAnnualOrPurchaseBenefit: Number(ipiPurchaseBenefit.toFixed(2)),
      isEligibleForUser: profile.isPCD && vehicleValue <= 200000,
      eligibilityNote:
        'Benefício na compra de veículo novo (economia estimada de 7% a 11% sobre o valor de tabela).',
    },
    {
      id: 'icms-veiculo',
      taxName: 'Isenção Parcial de ICMS em Veículo 0km',
      scope: 'Estadual (CONFAZ / Convênio ICMS 38/2012)',
      legalBasis: 'Convênio ICMS nº 38/2012 e Convênio ICMS nº 204/2023',
      ceilingDescription: 'Veículos novos de até R$ 120.000,00 com isenção proporcional sobre os primeiros R$ 70.000,00.',
      estimatedAnnualOrPurchaseBenefit: Number(icmsPurchaseBenefit.toFixed(2)),
      isEligibleForUser: profile.isPCD && vehicleValue <= 120000,
      eligibilityNote:
        vehicleValue <= 120000
          ? 'Elegível na compra de veículo 0km dentro do teto de R$ 120 mil.'
          : 'Valor do veículo informado supera o teto de R$ 120.000,00 do Convênio ICMS.',
    },
    {
      id: 'deducao-saude-irpf',
      taxName: 'Dedução Integral de Terapias, Próteses e Tecnologias Assistivas no IRPF',
      scope: 'Federal (Declaração Anual Completa)',
      legalBasis: 'Instrução Normativa RFB nº 1.500/2014',
      ceilingDescription: 'Sem limite legal: despesas com fonoaudiologia, terapia ocupacional, psicologia, cadeiras de rodas e órteses.',
      estimatedAnnualOrPurchaseBenefit: Number(
        (Math.max(0, profile.annualHealthExpenses ?? 0) * 0.275).toFixed(2)
      ),
      isEligibleForUser: (profile.annualHealthExpenses ?? 0) > 0,
      eligibilityNote:
        'Abatimento integral na base de cálculo quando a Declaração Completa é mais vantajosa.',
    },
  ];
}
