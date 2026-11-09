import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHistoricalSeries,
  calculateMonthlyINSS,
  calculateYearlyTax,
  compareAllRegimesForYear,
  getPCDExemptionRights,
} from '../taxEngine.ts';
import {
  CONSUMPTION_PRODUCT_EXAMPLES,
  DETAILED_TAX_GUIDES,
  PRESET_PERSONAS,
  STATE_TAX_DATA,
  TAX_GLOSSARY,
  TAX_PARAMETERS_BY_YEAR,
} from '../../data/taxParameters.ts';
import type { UserProfile } from '../../types.ts';

test('calculateMonthlyINSS computes non-progressive INSS for 2018 and progressive INSS for 2024', () => {
  const inss2018 = calculateMonthlyINSS(3000, TAX_PARAMETERS_BY_YEAR[2018], 'CLT');
  assert.equal(inss2018, 330.0);

  const inss2024 = calculateMonthlyINSS(4000.03, TAX_PARAMETERS_BY_YEAR[2024], 'CLT');
  assert.equal(inss2024, 378.82);
});

test('calculateYearlyTax returns zeroed metrics when grossMonthlyIncome is 0', () => {
  const emptyProfile: UserProfile = {
    grossMonthlyIncome: 0,
    regime: 'CLT',
    isPCD: false,
    hasQualifyingConditionForIRExemption: false,
    age: 30,
    dependentsCount: 0,
  };
  const res = calculateYearlyTax(emptyProfile, 2025);
  assert.equal(res.grossAnnualIncome, 0);
  assert.equal(res.totalTaxesPaid, 0);
  assert.equal(res.effectiveTaxRate, 0);
  assert.equal(res.daysWorkedForTaxes, 0);
});

test('calculateYearlyTax applies 2026 IRPF exemption up to R$ 5.000/month and computes inflation lag', () => {
  const profile: UserProfile = {
    grossMonthlyIncome: 4800,
    regime: 'CLT',
    isPCD: false,
    hasQualifyingConditionForIRExemption: false,
    age: 35,
    dependentsCount: 0,
    includesThirteenthSalary: true,
    stateUF: 'SP',
  };

  const res2024 = calculateYearlyTax(profile, 2024);
  const res2026 = calculateYearlyTax(profile, 2026);

  assert.ok(res2024.irpfAnnual > 0, '2024 should have positive IRPF for R$ 4.800');
  assert.equal(res2026.irpfAnnual, 0, '2026 should exempt R$ 4.800 under the R$ 5.000 rule');
  assert.ok(res2024.irpfLagExtraCost > 0, '2024 should report positive inflation lag cost');
});

test('calculateYearlyTax applies PCD retirement IRPF exemption (Lei 7.713/88) and IPVA exemption', () => {
  const baseRetired: UserProfile = {
    grossMonthlyIncome: 8000,
    regime: 'RETIRED',
    isPCD: false,
    hasQualifyingConditionForIRExemption: false,
    age: 67,
    dependentsCount: 1,
    includesThirteenthSalary: true,
    stateUF: 'SP',
    ownsVehicleValue: 100000,
  };

  const pcdRetired: UserProfile = {
    ...baseRetired,
    isPCD: true,
    hasQualifyingConditionForIRExemption: true,
  };

  const normalRes = calculateYearlyTax(baseRetired, 2025);
  const pcdRes = calculateYearlyTax(pcdRetired, 2025);

  assert.ok(normalRes.irpfAnnual > 0);
  assert.equal(pcdRes.irpfAnnual, 0);
  assert.equal(pcdRes.ipvaEstimatedAnnual, 0);
  assert.ok(pcdRes.pcdSavingsAmount > normalRes.irpfAnnual);
});

test('calculateHistoricalSeries and compareAllRegimesForYear cover all years and regimes', () => {
  const profile: UserProfile = {
    grossMonthlyIncome: 7000,
    regime: 'CLT',
    isPCD: false,
    hasQualifyingConditionForIRExemption: false,
    age: 40,
    dependentsCount: 2,
    annualHealthExpenses: 5000,
    annualEducationExpenses: 4000,
    stateUF: 'RJ',
  };

  const history = calculateHistoricalSeries(profile);
  assert.equal(history.length, 12);
  assert.equal(history[0].year, 2015);
  assert.equal(history[history.length - 1].year, 2026);

  const regimes = compareAllRegimesForYear(profile, 2025);
  assert.equal(regimes.length, 6);
  const rights = getPCDExemptionRights({ ...profile, isPCD: true }, 2025);
  assert.equal(rights.length, 5);
});

test('All preset personas, 27 Brazilian UFs, and glossary items validate cleanly', () => {
  assert.equal(Object.keys(STATE_TAX_DATA).length, 27);
  assert.ok(TAX_GLOSSARY.length >= 6);
  for (const persona of PRESET_PERSONAS) {
    const result = calculateYearlyTax(persona.profile, 2026);
    assert.ok(result.grossAnnualIncome > 0);
    assert.ok(result.effectiveTaxRate >= 0 && result.effectiveTaxRate <= 100);
  }
});

test('Consumption product examples include refrigerante and sorvete with consistent tax breakdowns', () => {
  const ids = CONSUMPTION_PRODUCT_EXAMPLES.map((p) => p.id);
  assert.ok(ids.includes('refrigerante'));
  assert.ok(ids.includes('sorvete'));
  assert.ok(DETAILED_TAX_GUIDES.length >= 4);

  for (const product of CONSUMPTION_PRODUCT_EXAMPLES) {
    const sum =
      product.icmsPct +
      product.ipiPct +
      product.pisCofinsPct +
      product.issOrOtherPct;
    assert.ok(
      Math.abs(sum - product.totalTaxRatePct) < 0.05,
      `Component taxes for ${product.id} must match totalTaxRatePct`
    );
  }
});

