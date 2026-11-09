import React, { useState } from 'react';
import type { RegimeComparisonItem, WorkRegime, YearlyTaxResult } from '../types.ts';
import { TAX_PARAMETERS_BY_YEAR } from '../data/taxParameters.ts';

const formatBRL = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });

const formatCompactBRL = (value: number): string => {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace('.', ',')} mil`;
  }
  return formatBRL(value);
};

interface SalaryXRayChartProps {
  result: YearlyTaxResult;
}

export const SalaryXRayChart: React.FC<SalaryXRayChartProps> = ({ result }) => {
  const [selectedSliceIndex, setSelectedSliceIndex] = useState<number>(0);

  const gross = Math.max(1, result.grossAnnualIncome);
  const directFederalAndState =
    result.irpfAnnual +
    result.pjOrAutonomousTaxesAnnual +
    result.ipvaEstimatedAnnual +
    result.classCouncilOrOtherDiscountsAnnual;

  const slices = [
    {
      label: 'Renda Disponível Real (após consumo)',
      amount: result.netDisposableAfterConsumptionTaxes,
      pct: (result.netDisposableAfterConsumptionTaxes / gross) * 100,
      colorVar: 'var(--color-emerald)',
      pattern: 'Solido',
      description:
        'Parcela da renda anual que efetivamente permanece disponível após descontos em folha e tributos embutidos no consumo.',
    },
    {
      label: 'Tributos Indiretos sobre Consumo (ICMS, PIS/COFINS, IPI, ISS)',
      amount: result.totalEstimatedIndirectTaxes,
      pct: (result.totalEstimatedIndirectTaxes / gross) * 100,
      colorVar: 'var(--color-terracotta)',
      pattern: 'Tracejado',
      description: `Estimativa para o ${result.incomeDecile}º decil de renda com alíquota efetiva de ${(result.consumptionTaxRateApplied * 100).toFixed(1)}% sobre o consumo líquido.`,
    },
    {
      label: 'Previdência Oficial (INSS / RPPS)',
      amount: result.inssAnnual,
      pct: (result.inssAnnual / gross) * 100,
      colorVar: 'var(--color-blue)',
      pattern: 'Pontilhado',
      description:
        'Contribuição previdenciária anual obrigatória descontada em folha ou guia DAS/GPS.',
    },
    {
      label: 'Imposto sobre Renda, PJ e Patrimônio (IRPF, Simples, IPVA)',
      amount: directFederalAndState,
      pct: (directFederalAndState / gross) * 100,
      colorVar: 'var(--color-ink)',
      pattern: 'Duplo',
      description: `Inclui IRPF (${formatBRL(result.irpfAnnual)}), tributos PJ/Autônomo (${formatBRL(result.pjOrAutonomousTaxesAnnual)}) e IPVA/Taxas (${formatBRL(result.ipvaEstimatedAnnual + result.classCouncilOrOtherDiscountsAnnual)}).`,
    },
  ];

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const activeSlice = slices[selectedSliceIndex] ?? slices[0];

  return (
    <div className="xray-grid">
      <div className="chart-panel" aria-label="Gráfico de rosca de decomposição da renda anual">
        <h3 className="chart-question-title">
          Para onde vai cada real da sua renda bruta anual em {result.year}?
        </h3>
        <div className="donut-layout">
          <svg
            viewBox="0 0 200 200"
            className="donut-svg"
            role="img"
            aria-label={`Decomposição da renda bruta de ${formatBRL(result.grossAnnualIncome)} no ano de ${result.year}`}
          >
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="var(--color-surface-muted)"
              strokeWidth="26"
            />
            {slices.map((slice, idx) => {
              const strokeDasharray = `${(slice.pct / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += slice.pct;
              const isSelected = idx === selectedSliceIndex;
              return (
                <circle
                  key={slice.label}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={slice.colorVar}
                  strokeWidth={isSelected ? '31' : '25'}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 100 100)"
                  className="donut-segment"
                />
              );
            })}
            <text x="100" y="92" textAnchor="middle" className="donut-center-label">
              Carga Total
            </text>
            <text x="100" y="115" textAnchor="middle" className="donut-center-value">
              {result.effectiveTaxRate.toFixed(1)}%
            </text>
          </svg>

          <div className="slice-selector-list" role="group" aria-label="Fatia do orçamento">
            {slices.map((slice, idx) => {
              const isSelected = idx === selectedSliceIndex;
              return (
                <button
                  key={slice.label}
                  type="button"
                  className={`slice-btn ${isSelected ? 'slice-btn-active' : ''}`}
                  onClick={() => setSelectedSliceIndex(idx)}
                  aria-pressed={isSelected}
                >
                  <span
                    className="slice-swatch"
                    style={{ backgroundColor: slice.colorVar }}
                    aria-hidden="true"
                  />
                  <span className="slice-btn-text">
                    <strong>{slice.label}</strong>
                    <span className="mono-num">
                      {formatBRL(slice.amount)} ({slice.pct.toFixed(1)}%)
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="chart-callout" role="status" aria-live="polite">
          <strong>Detalhe selecionado ({activeSlice.label}):</strong>{' '}
          <span className="mono-num">
            {formatBRL(activeSlice.amount)} ({activeSlice.pct.toFixed(2)}% da renda bruta).
          </span>{' '}
          {activeSlice.description}
        </div>
      </div>

      <div className="chart-panel" aria-label="Cascata do salário bruto ao líquido real">
        <h3 className="chart-question-title">
          Como a renda bruta diminui até o poder de compra real (Waterfall)?
        </h3>
        <div className="waterfall-list">
          {[
            {
              step: '1. Renda Bruta Anual',
              value: result.grossAnnualIncome,
              pct: 100,
              tone: 'neutral',
              sign: '',
            },
            {
              step: '2. Previdência (INSS / RPPS)',
              value: result.inssAnnual,
              pct: (result.inssAnnual / gross) * 100,
              tone: 'blue',
              sign: '-',
            },
            {
              step: '3. IRPF + Tributos PJ/IPVA/Taxas',
              value: directFederalAndState,
              pct: (directFederalAndState / gross) * 100,
              tone: 'terracotta',
              sign: '-',
            },
            {
              step: '4. Renda Líquida em Conta (após diretos)',
              value: result.netAnnualIncome,
              pct: (result.netAnnualIncome / gross) * 100,
              tone: 'emerald',
              sign: '=',
            },
            {
              step: '5. Tributos Indiretos no Consumo',
              value: result.totalEstimatedIndirectTaxes,
              pct: (result.totalEstimatedIndirectTaxes / gross) * 100,
              tone: 'terracotta',
              sign: '-',
            },
            {
              step: '6. Poder de Compra Real Livre de Tributos',
              value: result.netDisposableAfterConsumptionTaxes,
              pct: (result.netDisposableAfterConsumptionTaxes / gross) * 100,
              tone: 'emerald',
              sign: '=',
            },
          ].map((row) => (
            <div key={row.step} className="waterfall-row">
              <div className="waterfall-meta">
                <span className="waterfall-step">{row.step}</span>
                <span className="mono-num waterfall-amount">
                  {row.sign} {formatBRL(row.value)} ({row.pct.toFixed(1)}%)
                </span>
              </div>
              <div className="waterfall-track" aria-hidden="true">
                <div
                  className={`waterfall-bar waterfall-bar-${row.tone}`}
                  style={{ width: `${Math.max(2, Math.min(100, row.pct))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface HistoricalEvolutionChartProps {
  series: YearlyTaxResult[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
}

export const HistoricalEvolutionChart: React.FC<HistoricalEvolutionChartProps> = ({
  series,
  selectedYear,
  onSelectYear,
}) => {
  const [metricMode, setMetricMode] = useState<'RATE' | 'LAG'>('RATE');

  const width = 760;
  const height = 280;
  const padLeft = 56;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 42;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxRate = Math.max(
    45,
    ...series.map((s) => Math.ceil(s.effectiveTaxRate + 5))
  );
  const maxIrpfNominal = Math.max(
    1000,
    ...series.map((s) => Math.max(s.irpfAnnual, s.irpfWithInflationCorrectedTable) * 1.15)
  );

  const getX = (index: number): number =>
    padLeft + (index / Math.max(1, series.length - 1)) * innerW;

  const getYPrimary = (item: YearlyTaxResult): number => {
    const val = metricMode === 'RATE' ? item.effectiveTaxRate : item.irpfAnnual;
    const maxVal = metricMode === 'RATE' ? maxRate : maxIrpfNominal;
    return padTop + innerH - (val / maxVal) * innerH;
  };

  const getYSecondary = (item: YearlyTaxResult): number => {
    if (metricMode === 'RATE') {
      const directRate =
        item.grossAnnualIncome > 0
          ? (item.totalDirectTaxes / item.grossAnnualIncome) * 100
          : 0;
      return padTop + innerH - (directRate / maxRate) * innerH;
    }
    return padTop + innerH - (item.irpfWithInflationCorrectedTable / maxIrpfNominal) * innerH;
  };

  const primaryPoints = series
    .map((item, idx) => `${getX(idx).toFixed(1)},${getYPrimary(item).toFixed(1)}`)
    .join(' ');

  const secondaryPoints = series
    .map((item, idx) => `${getX(idx).toFixed(1)},${getYSecondary(item).toFixed(1)}`)
    .join(' ');

  const areaPoints = `${padLeft},${padTop + innerH} ${primaryPoints} ${getX(series.length - 1).toFixed(1)},${padTop + innerH}`;

  const activeItem = series.find((s) => s.year === selectedYear) ?? series[series.length - 1];
  const activeParams = TAX_PARAMETERS_BY_YEAR[activeItem.year];

  return (
    <div className="chart-panel">
      <div className="chart-header-row">
        <div>
          <h3 className="chart-question-title">
            {metricMode === 'RATE'
              ? 'Como a sua alíquota efetiva evoluiu entre 2015 e 2026?'
              : 'Quanto você pagou a mais de IRPF devido à defasagem inflacionária da tabela (2015-2026)?'}
          </h3>
          <p className="chart-subtitle">
            Clique ou navegue com Tab pelos pontos anuais para inspecionar os parâmetros fiscais da época.
          </p>
        </div>
        <div className="mode-toggle-group" role="group" aria-label="Modo de visualização histórica">
          <button
            type="button"
            className={`toggle-btn ${metricMode === 'RATE' ? 'toggle-btn-active' : ''}`}
            onClick={() => setMetricMode('RATE')}
            aria-pressed={metricMode === 'RATE'}
          >
            Alíquota Efetiva (%)
          </button>
          <button
            type="button"
            className={`toggle-btn ${metricMode === 'LAG' ? 'toggle-btn-active' : ''}`}
            onClick={() => setMetricMode('LAG')}
            aria-pressed={metricMode === 'LAG'}
          >
            Defasagem Tabela IRPF (R$)
          </button>
        </div>
      </div>

      <div className="svg-scroll-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="line-chart-svg"
          role="img"
          aria-label="Série histórica tributária de 2015 a 2026"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padTop + innerH * (1 - ratio);
            const labelValue =
              metricMode === 'RATE'
                ? `${Math.round(maxRate * ratio)}%`
                : formatCompactBRL(maxIrpfNominal * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="svg-axis-text"
                >
                  {labelValue}
                </text>
              </g>
            );
          })}

          <polygon points={areaPoints} fill="var(--color-area-fill)" />

          <polyline
            fill="none"
            stroke="var(--color-terracotta)"
            strokeWidth="3"
            points={primaryPoints}
          />

          <polyline
            fill="none"
            stroke="var(--color-emerald)"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            points={secondaryPoints}
          />

          {series.map((item, idx) => {
            const cx = getX(idx);
            const cy1 = getYPrimary(item);
            const cy2 = getYSecondary(item);
            const isSelected = item.year === selectedYear;

            return (
              <g key={item.year}>
                {isSelected && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + innerH}
                    stroke="var(--color-ink)"
                    strokeWidth="1.5"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy2}
                  r={isSelected ? 5 : 3.5}
                  fill="var(--color-emerald)"
                />
                <circle
                  cx={cx}
                  cy={cy1}
                  r={isSelected ? 7 : 4.5}
                  fill="var(--color-terracotta)"
                  stroke="var(--color-surface)"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={height - 12}
                  textAnchor="middle"
                  className={`svg-year-label ${isSelected ? 'svg-year-label-active' : ''}`}
                >
                  {item.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="chart-legend-row">
        <span className="legend-item">
          <span className="legend-swatch legend-solid-terracotta" aria-hidden="true" />
          {metricMode === 'RATE'
            ? 'Alíquota Efetiva Total (Diretos + Consumo)'
            : 'IRPF Pago com Tabela Oficial Congelada/Parcial'}
        </span>
        <span className="legend-item">
          <span className="legend-swatch legend-dashed-emerald" aria-hidden="true" />
          {metricMode === 'RATE'
            ? 'Apenas Tributos Diretos (IRPF + Previdência + PJ/IPVA)'
            : 'IRPF se a Tabela Fosse Corrigida Integralmente pelo IPCA'}
        </span>
      </div>

      <div className="year-pills-strip" role="group" aria-label="Selecionar ano da série histórica">
        {series.map((item) => {
          const isSelected = item.year === selectedYear;
          return (
            <button
              key={item.year}
              type="button"
              className={`year-pill ${isSelected ? 'year-pill-active' : ''}`}
              onClick={() => onSelectYear(item.year)}
              aria-pressed={isSelected}
            >
              <span>{item.year}</span>
              <small className="mono-num">
                {metricMode === 'RATE'
                  ? `${item.effectiveTaxRate.toFixed(1)}%`
                  : formatCompactBRL(item.irpfLagExtraCost)}
              </small>
            </button>
          );
        })}
      </div>

      <div className="historical-inspection-box" role="region" aria-label={`Resumo histórico de ${activeItem.year}`}>
        <div className="inspection-item">
          <span className="inspection-label">Ano Selecionado</span>
          <strong className="mono-num">{activeItem.year}</strong>
          <small>IPCA anual: {activeParams.ipcaAnnualRate.toFixed(2)}%</small>
        </div>
        <div className="inspection-item">
          <span className="inspection-label">Salário Mínimo e Teto INSS</span>
          <strong className="mono-num">
            {formatBRL(activeParams.minimumWage)} / {formatBRL(activeParams.inssCeiling)}
          </strong>
          <small>
            Regra INSS: {activeParams.inssProgressive ? 'Alíquotas progressivas (EC 103)' : 'Alíquota simples por faixa'}
          </small>
        </div>
        <div className="inspection-item">
          <span className="inspection-label">IRPF Oficial vs. Tabela Corrigida</span>
          <strong className="mono-num">
            {formatBRL(activeItem.irpfAnnual)} vs. {formatBRL(activeItem.irpfWithInflationCorrectedTable)}
          </strong>
          <small>
            Custo da defasagem em {activeItem.year}: {formatBRL(activeItem.irpfLagExtraCost)}
          </small>
        </div>
      </div>
    </div>
  );
};

interface DistributionAndRegimesProps {
  result: YearlyTaxResult;
  comparisons: RegimeComparisonItem[];
  currentRegime: WorkRegime;
  onSelectRegime: (regime: WorkRegime) => void;
}

export const DistributionAndRegimesChart: React.FC<DistributionAndRegimesProps> = ({
  result,
  comparisons,
  currentRegime,
  onSelectRegime,
}) => {
  const incomeAndPropertyTaxes =
    result.irpfAnnual +
    result.pjOrAutonomousTaxesAnnual +
    result.ipvaEstimatedAnnual +
    result.classCouncilOrOtherDiscountsAnnual;

  const maxCategory = Math.max(
    1,
    incomeAndPropertyTaxes,
    result.inssAnnual,
    result.totalEstimatedIndirectTaxes
  );

  const categories = [
    {
      name: 'Tributos sobre Renda, Faturamento e Patrimônio (IRPF, PJ, IPVA)',
      amount: incomeAndPropertyTaxes,
      shareOfTaxes:
        result.totalTaxesPaid > 0
          ? (incomeAndPropertyTaxes / result.totalTaxesPaid) * 100
          : 0,
      widthPct: (incomeAndPropertyTaxes / maxCategory) * 100,
      tone: 'terracotta',
    },
    {
      name: 'Previdência Social (INSS / RPPS)',
      amount: result.inssAnnual,
      shareOfTaxes:
        result.totalTaxesPaid > 0 ? (result.inssAnnual / result.totalTaxesPaid) * 100 : 0,
      widthPct: (result.inssAnnual / maxCategory) * 100,
      tone: 'blue',
    },
    {
      name: 'Tributos Indiretos sobre Consumo (ICMS, PIS, COFINS, IPI, ISS)',
      amount: result.totalEstimatedIndirectTaxes,
      shareOfTaxes:
        result.totalTaxesPaid > 0
          ? (result.totalEstimatedIndirectTaxes / result.totalTaxesPaid) * 100
          : 0,
      widthPct: (result.totalEstimatedIndirectTaxes / maxCategory) * 100,
      tone: 'emerald',
    },
  ];

  return (
    <div className="xray-grid">
      <div className="chart-panel">
        <h3 className="chart-question-title">
          Qual grupo de tributos mais pesa no seu bolso em {result.year}?
        </h3>
        <div className="bar-chart-stack">
          {categories.map((cat) => (
            <div key={cat.name} className="bar-group">
              <div className="waterfall-meta">
                <strong>{cat.name}</strong>
                <span className="mono-num">
                  {formatBRL(cat.amount)} ({cat.shareOfTaxes.toFixed(1)}% dos tributos)
                </span>
              </div>
              <div className="waterfall-track" aria-hidden="true">
                <div
                  className={`waterfall-bar waterfall-bar-${cat.tone}`}
                  style={{ width: `${Math.max(3, cat.widthPct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="chart-footnote">
          Modelo de IRPF mais econômico aplicado automaticamente em {result.year}:{' '}
          <strong>{result.deductionModelUsed}</strong>.
        </p>
      </div>

      <div className="chart-panel">
        <h3 className="chart-question-title">
          Como a mesma renda mensal seria tributada em outros regimes em {result.year}?
        </h3>
        <div className="table-scroll-container">
          <table className="fiscal-table">
            <thead>
              <tr>
                <th scope="col">Modalidade</th>
                <th scope="col" className="num-col">Tributos Diretos</th>
                <th scope="col" className="num-col">Renda Líquida</th>
                <th scope="col" className="num-col">Alíquota Total</th>
                <th scope="col">Ação</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((item) => {
                const isCurrent = item.regime === currentRegime;
                return (
                  <tr key={item.regime} className={isCurrent ? 'row-highlighted' : ''}>
                    <td>
                      <strong>{item.label}</strong>
                      <div className="table-row-note">{item.notes}</div>
                    </td>
                    <td className="num-col mono-num">{formatBRL(item.directTaxesAnnual)}</td>
                    <td className="num-col mono-num">{formatBRL(item.netAnnualIncome)}</td>
                    <td className="num-col mono-num">
                      <strong>{item.effectiveTaxRate.toFixed(1)}%</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`table-action-btn ${isCurrent ? 'table-action-btn-active' : ''}`}
                        onClick={() => onSelectRegime(item.regime)}
                        aria-pressed={isCurrent}
                      >
                        {isCurrent ? 'Selecionado' : 'Simular'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

