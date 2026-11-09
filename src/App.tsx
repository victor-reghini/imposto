import React, { useEffect, useMemo, useState } from 'react';
import {
  AVAILABLE_YEARS,
  CONSUMPTION_PRODUCT_EXAMPLES,
  DETAILED_TAX_GUIDES,
  PRESET_PERSONAS,
  STATE_TAX_DATA,
  TAX_GLOSSARY,
  TAX_PARAMETERS_BY_YEAR,
  WORK_REGIME_LABELS,
} from './data/taxParameters.ts';
import {
  calculateHistoricalSeries,
  calculateYearlyTax,
  compareAllRegimesForYear,
  getPCDExemptionRights,
} from './engine/taxEngine.ts';
import {
  DistributionAndRegimesChart,
  HistoricalEvolutionChart,
  SalaryXRayChart,
} from './components/TaxCharts.tsx';
import type { UserProfile, WorkRegime } from './types.ts';

const STORAGE_KEY = 'imposto_fiscal_profile_v1';
const THEME_KEY = 'imposto_fiscal_theme_v1';

const DEFAULT_PROFILE: UserProfile = PRESET_PERSONAS[0].profile;

const formatBRL = (value: number): string =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });

export type ActiveTab = 'PAINEL' | 'GUIA_IMPOSTOS';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('PAINEL');
  const [persistLocally, setPersistLocally] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [isLoadingSimulation, setIsLoadingSimulation] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [glossaryFilter, setGlossaryFilter] = useState<string>('TODOS');
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    CONSUMPTION_PRODUCT_EXAMPLES[0].id
  );
  const [customProductPrice, setCustomProductPrice] = useState<number>(
    CONSUMPTION_PRODUCT_EXAMPLES[0].referencePrice
  );

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserProfile>;
        if (typeof parsed.grossMonthlyIncome === 'number' && parsed.regime) {
          return { ...DEFAULT_PROFILE, ...parsed };
        }
      }
    } catch {
      // Ignora falha de leitura local e usa perfil inicial
    }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Sem permissão de armazenamento
    }
  }, [theme]);

  useEffect(() => {
    if (!persistLocally) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Sem permissão de armazenamento
    }
  }, [profile, persistLocally]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (mobileNavOpen) setMobileNavOpen(false);
        if (activeGlossaryTerm) setActiveGlossaryTerm(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen, activeGlossaryTerm]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (Number.isNaN(profile.grossMonthlyIncome) || profile.grossMonthlyIncome < 0) {
      errors.push('A renda bruta mensal não pode ser negativa.');
    }
    if (profile.grossMonthlyIncome > 5000000) {
      errors.push('A renda mensal informada excede o limite de simulação (R$ 5.000.000/mês).');
    }
    if (Number.isNaN(profile.age) || profile.age < 14 || profile.age > 120) {
      errors.push('A idade deve estar entre 14 e 120 anos para aplicação correta das regras fiscais.');
    }
    if (
      Number.isNaN(profile.dependentsCount) ||
      profile.dependentsCount < 0 ||
      profile.dependentsCount > 25
    ) {
      errors.push('O número de dependentes deve estar entre 0 e 25.');
    }
    if (
      (profile.annualHealthExpenses ?? 0) < 0 ||
      (profile.annualEducationExpenses ?? 0) < 0 ||
      (profile.annualAlimonyExpenses ?? 0) < 0 ||
      (profile.mandatoryDiscountsMonthly ?? 0) < 0 ||
      (profile.ownsVehicleValue ?? 0) < 0
    ) {
      errors.push('Despesas dedutíveis, descontos e valor de veículo não podem ser negativos.');
    }
    return errors;
  }, [profile]);

  const currentResult = useMemo(
    () => calculateYearlyTax(profile, selectedYear),
    [profile, selectedYear]
  );

  const historicalSeries = useMemo(
    () => calculateHistoricalSeries(profile),
    [profile]
  );

  const regimeComparisons = useMemo(
    () => compareAllRegimesForYear(profile, selectedYear),
    [profile, selectedYear]
  );

  const pcdRights = useMemo(
    () => getPCDExemptionRights(profile, selectedYear),
    [profile, selectedYear]
  );

  const yearParams = TAX_PARAMETERS_BY_YEAR[selectedYear] ?? TAX_PARAMETERS_BY_YEAR[2026];

  const selectedProduct = useMemo(
    () =>
      CONSUMPTION_PRODUCT_EXAMPLES.find((p) => p.id === selectedProductId) ??
      CONSUMPTION_PRODUCT_EXAMPLES[0],
    [selectedProductId]
  );

  const handleApplyPersona = (nextProfile: UserProfile, personaName: string) => {
    setIsLoadingSimulation(true);
    setProfile(nextProfile);
    setStatusMessage(`Perfil aplicado: ${personaName}. Cálculos atualizados para ${selectedYear}.`);
    window.setTimeout(() => {
      setIsLoadingSimulation(false);
    }, 120);
  };

  const handleClearLocalData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignora erro de storage
    }
    setPersistLocally(false);
    setStatusMessage('Dados locais removidos do navegador. Modo efêmero ativado.');
  };

  const handleExportCSV = () => {
    const header = [
      'Ano',
      'Renda_Bruta_Anual',
      'INSS_Anual',
      'IRPF_Anual',
      'Tributos_PJ_Autonomo',
      'IPVA_Estimado',
      'Tributos_Diretos_Totais',
      'Tributos_Indiretos_Consumo',
      'Total_Impostos_Pagos',
      'Renda_Liquida_Disponivel',
      'Aliquota_Efetiva_Pct',
      'Dias_Trabalhados_Impostos',
      'Economia_PCD',
      'Custo_Defasagem_IRPF',
    ].join(',');

    const rows = historicalSeries.map((r) =>
      [
        r.year,
        r.grossAnnualIncome.toFixed(2),
        r.inssAnnual.toFixed(2),
        r.irpfAnnual.toFixed(2),
        r.pjOrAutonomousTaxesAnnual.toFixed(2),
        r.ipvaEstimatedAnnual.toFixed(2),
        r.totalDirectTaxes.toFixed(2),
        r.totalEstimatedIndirectTaxes.toFixed(2),
        r.totalTaxesPaid.toFixed(2),
        r.netDisposableAfterConsumptionTaxes.toFixed(2),
        r.effectiveTaxRate.toFixed(2),
        r.daysWorkedForTaxes,
        r.pcdSavingsAmount.toFixed(2),
        r.irpfLagExtraCost.toFixed(2),
      ].join(',')
    );

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-fiscal-imposto-2015-2026.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Série histórica 2015-2026 exportada em CSV.');
  };

  const handleNavigateSection = (tab: ActiveTab, sectionId: string) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
    window.setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 30);
  };

  const filteredGlossary = useMemo(() => {
    if (glossaryFilter === 'TODOS') return TAX_GLOSSARY;
    return TAX_GLOSSARY.filter((item) => item.category === glossaryFilter);
  }, [glossaryFilter]);

  const safeProductPrice = Math.max(0, customProductPrice || 0);
  const productTotalTaxAmount = (safeProductPrice * selectedProduct.totalTaxRatePct) / 100;
  const productNetValue = Math.max(0, safeProductPrice - productTotalTaxAmount);

  return (
    <div className="app-shell">
      <a href="#conteudo-principal" className="skip-link">
        Pular para o conteúdo principal
      </a>

      <header className="site-header">
        <div className="header-inner">
          <div className="brand-block">
            <span className="brand-kicker">CADERNO DE TRANSPARÊNCIA FISCAL</span>
            <h1 className="brand-title">Imposto</h1>
            <p className="brand-subtitle">
              Cálculo aberto de tributos diretos, consumo, isenções PCD e série histórica (2015 a 2026).
            </p>
          </div>

          <div className="header-controls">
            <div className="year-select-box">
              <label htmlFor="header-year-select" className="control-label">
                Ano-Calendário
              </label>
              <select
                id="header-year-select"
                className="select-input mono-num"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {AVAILABLE_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr} (SM R$ {TAX_PARAMETERS_BY_YEAR[yr].minimumWage.toLocaleString('pt-BR')})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
            >
              Tema: {theme === 'light' ? 'Papel Claro' : 'Grafite Escuro'}
            </button>

            <button
              type="button"
              className="secondary-btn mobile-menu-toggle"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-expanded={mobileNavOpen}
              aria-controls="site-nav"
            >
              {mobileNavOpen ? 'Fechar Menu' : 'Menu de Seções'}
            </button>
          </div>
        </div>

        <nav
          id="site-nav"
          className={`site-nav ${mobileNavOpen ? 'site-nav-open' : ''}`}
          aria-label="Seções do caderno fiscal"
        >
          <a
            href="#identificacao"
            onClick={(e) => {
              e.preventDefault();
              handleNavigateSection(activeTab, 'identificacao');
            }}
          >
            01. Identificação (Topo)
          </a>
          <a
            href="#raio-x"
            onClick={(e) => {
              e.preventDefault();
              handleNavigateSection('PAINEL', 'raio-x');
            }}
          >
            02. Raio-X Salarial
          </a>
          <a
            href="#evolucao"
            onClick={(e) => {
              e.preventDefault();
              handleNavigateSection('PAINEL', 'evolucao');
            }}
          >
            03. Evolução 2015-2026
          </a>
          <a
            href="#comparador-regimes"
            onClick={(e) => {
              e.preventDefault();
              handleNavigateSection('PAINEL', 'comparador-regimes');
            }}
          >
            04. CLT vs. PJ
          </a>
          <a
            href="#direitos-pcd"
            onClick={(e) => {
              e.preventDefault();
              handleNavigateSection('PAINEL', 'direitos-pcd');
            }}
          >
            05. Direitos PCD
          </a>
          <a
            href="#guia-impostos"
            onClick={(e) => {
              e.preventDefault();
              handleNavigateSection('GUIA_IMPOSTOS', 'guia-impostos');
            }}
          >
            06. Como Cada Imposto se Aplica
          </a>
        </nav>
      </header>

      <main id="conteudo-principal" className="main-container">
        {/* MÓDULO 01: IDENTIFICAÇÃO HORIZONTAL NO TOPO COM PERFIS DE REFERÊNCIA INTEGRADOS */}
        <section
          id="identificacao"
          className="ledger-section top-identification-module"
          aria-labelledby="heading-identificacao"
        >
          <div className="top-module-header">
            <div className="section-rubric section-rubric-Flush">
              <span className="rubric-code">01 / IDENTIFICAÇÃO SOCIOECONÔMICA</span>
              <h2 id="heading-identificacao">
                Perfil do Contribuinte, Deduções e Atalhos de Referência
              </h2>
            </div>

            <div className="privacy-controls">
              <button
                type="button"
                className="text-action-btn"
                onClick={() => {
                  const next = !persistLocally;
                  setPersistLocally(next);
                  setStatusMessage(
                    next
                      ? 'Persistência local (localStorage) ativada neste navegador.'
                      : 'Modo anônimo efêmero ativado.'
                  );
                }}
                aria-pressed={persistLocally}
              >
                Privacidade: {persistLocally ? 'Salvo no navegador (Local)' : 'Sessão Efêmera'}
              </button>
              <button
                type="button"
                className="text-action-btn"
                onClick={handleClearLocalData}
              >
                Apagar dados salvos
              </button>
            </div>
          </div>

          <div className="integrated-personas-block" aria-label="Atalhos de perfis de referência">
            <div className="personas-inline-label">
              <strong>Atalhos de Perfis de Referência:</strong>
              <span>Selecione um exemplo pronto para preencher os campos ou edite livremente abaixo:</span>
            </div>
            <div className="personas-grid">
              {PRESET_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  type="button"
                  className="persona-card-btn"
                  onClick={() => handleApplyPersona(persona.profile, persona.name)}
                >
                  <strong>{persona.name}</strong>
                  <span>{persona.description}</span>
                </button>
              ))}
              <button
                type="button"
                className="persona-card-btn persona-card-empty"
                onClick={() =>
                  handleApplyPersona(
                    { ...profile, grossMonthlyIncome: 0 },
                    'Renda Zerada (Estado Vazio)'
                  )
                }
              >
                <strong>Zerar Simulação</strong>
                <span>Limpar renda mensal para testar o estado inicial sem dados.</span>
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="status-toast" role="status" aria-live="polite">
              <span>{statusMessage}</span>
              <button
                type="button"
                className="toast-close-btn"
                onClick={() => setStatusMessage('')}
                aria-label="Fechar aviso"
              >
                Fechar
              </button>
            </div>
          )}

          <form
            className="tax-form-horizontal"
            onSubmit={(e) => {
              e.preventDefault();
              setStatusMessage(`Simulação recalculada para o ano-calendário ${selectedYear}.`);
            }}
            noValidate
          >
            <div className="horizontal-fieldsets-grid">
              <fieldset className="form-group">
                <legend>1. Renda e Regime de Trabalho</legend>

                <div className="horizontal-fields-row">
                  <label htmlFor="input-gross-income" className="field-label">
                    Salário Bruto Mensal / Faturamento (R$)
                    <input
                      id="input-gross-income"
                      type="number"
                      min="0"
                      max="5000000"
                      step="100"
                      className="text-input mono-num"
                      value={profile.grossMonthlyIncome}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          grossMonthlyIncome: e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                    />
                  </label>

                  <label htmlFor="select-regime" className="field-label">
                    Regime de Trabalho / Ocupação
                    <select
                      id="select-regime"
                      className="select-input"
                      value={profile.regime}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          regime: e.target.value as WorkRegime,
                        })
                      }
                    >
                      {(Object.keys(WORK_REGIME_LABELS) as WorkRegime[]).map((key) => (
                        <option key={key} value={key}>
                          {WORK_REGIME_LABELS[key].title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="horizontal-fields-row">
                  <label htmlFor="input-mandatory-discounts" className="field-label">
                    Conselho de Classe / Outros Descontos Mensais (R$)
                    <input
                      id="input-mandatory-discounts"
                      type="number"
                      min="0"
                      step="10"
                      className="text-input mono-num"
                      value={profile.mandatoryDiscountsMonthly ?? 0}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          mandatoryDiscountsMonthly: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </label>

                  <label className="checkbox-label" htmlFor="check-13th">
                    <input
                      id="check-13th"
                      type="checkbox"
                      checked={Boolean(profile.includesThirteenthSalary)}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          includesThirteenthSalary: e.target.checked,
                        })
                      }
                    />
                    <span>Inclui 13º salário (CLT, Servidor e Aposentado)</span>
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <legend>2. Condições Especiais, UF e Veículo</legend>

                <div className="horizontal-fields-row">
                  <label htmlFor="input-age" className="field-label">
                    Idade (anos)
                    <input
                      id="input-age"
                      type="number"
                      min="14"
                      max="120"
                      className="text-input mono-num"
                      value={profile.age}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          age: Number(e.target.value),
                        })
                      }
                    />
                  </label>

                  <label htmlFor="select-uf" className="field-label">
                    Estado (UF)
                    <select
                      id="select-uf"
                      className="select-input"
                      value={profile.stateUF || 'SP'}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          stateUF: e.target.value,
                        })
                      }
                    >
                      {Object.values(STATE_TAX_DATA).map((st) => (
                        <option key={st.uf} value={st.uf}>
                          {st.uf} - {st.name} (ICMS {(st.icmsModalRate * 100).toFixed(1)}%)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label htmlFor="input-vehicle" className="field-label">
                    Valor de Veículo p/ IPVA (R$)
                    <input
                      id="input-vehicle"
                      type="number"
                      min="0"
                      step="5000"
                      className="text-input mono-num"
                      value={profile.ownsVehicleValue ?? 0}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          ownsVehicleValue: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </label>
                </div>

                <div className="horizontal-checks-row">
                  <label className="checkbox-label" htmlFor="check-pcd">
                    <input
                      id="check-pcd"
                      type="checkbox"
                      checked={profile.isPCD}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          isPCD: e.target.checked,
                        })
                      }
                    />
                    <span>Enquadramento PCD (física, visual, auditiva, intelectual/autismo)</span>
                  </label>

                  <label className="checkbox-label" htmlFor="check-ir-exemption">
                    <input
                      id="check-ir-exemption"
                      type="checkbox"
                      checked={profile.hasQualifyingConditionForIRExemption}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          hasQualifyingConditionForIRExemption: e.target.checked,
                        })
                      }
                    />
                    <span>Moléstia grave / isenção IRPF na aposentadoria (Lei 7.713/88)</span>
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-group">
                <legend>3. Dependentes e Deduções Anuais (IRPF)</legend>

                <div className="horizontal-fields-row">
                  <label htmlFor="input-dependents" className="field-label">
                    Dependentes Legais
                    <input
                      id="input-dependents"
                      type="number"
                      min="0"
                      max="25"
                      className="text-input mono-num"
                      value={profile.dependentsCount}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          dependentsCount: Number(e.target.value),
                        })
                      }
                    />
                  </label>

                  <label htmlFor="input-health" className="field-label">
                    Saúde e Terapias (R$/ano)
                    <input
                      id="input-health"
                      type="number"
                      min="0"
                      step="200"
                      className="text-input mono-num"
                      value={profile.annualHealthExpenses ?? 0}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          annualHealthExpenses: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </label>
                </div>

                <div className="horizontal-fields-row">
                  <label htmlFor="input-education" className="field-label">
                    Educação Formal (R$/ano)
                    <input
                      id="input-education"
                      type="number"
                      min="0"
                      step="200"
                      className="text-input mono-num"
                      value={profile.annualEducationExpenses ?? 0}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          annualEducationExpenses: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </label>

                  <label htmlFor="input-alimony" className="field-label">
                    Pensão Judicial (R$/ano)
                    <input
                      id="input-alimony"
                      type="number"
                      min="0"
                      step="200"
                      className="text-input mono-num"
                      value={profile.annualAlimonyExpenses ?? 0}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          annualAlimonyExpenses: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </label>
                </div>
              </fieldset>
            </div>

            <div className="horizontal-form-footer">
              <div className="form-summary-note">
                <span>
                  Regime ativo: <strong>{WORK_REGIME_LABELS[profile.regime].title}</strong> | Dedução por dependente em {selectedYear}:{' '}
                  <strong className="mono-num">{formatBRL(yearParams.dependentDeductionMonthly)}/mês</strong> | Teto educação:{' '}
                  <strong className="mono-num">{formatBRL(yearParams.educationAnnualLimitPerPerson)}/pessoa</strong>.
                </span>
              </div>
              <div className="horizontal-form-buttons">
                <button type="submit" className="primary-btn">
                  Atualizar Demonstrativo {selectedYear}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleExportCSV}
                >
                  Exportar Série CSV (2015-2026)
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* BARRA DE ABAS PRINCIPAIS */}
        <div
          className="main-tabs-bar"
          role="tablist"
          aria-label="Alternar entre Painel de Simulação e Guia Explicativo de Impostos"
        >
          <button
            id="tab-btn-painel"
            type="button"
            role="tab"
            aria-selected={activeTab === 'PAINEL'}
            aria-controls="tabpanel-painel"
            className={`main-tab-btn ${activeTab === 'PAINEL' ? 'main-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('PAINEL')}
          >
            <span className="tab-step">ABA 01</span>
            <strong>Painel Fiscal, Gráficos e Evolução (2015-2026)</strong>
          </button>

          <button
            id="tab-btn-guia"
            type="button"
            role="tab"
            aria-selected={activeTab === 'GUIA_IMPOSTOS'}
            aria-controls="tabpanel-guia"
            className={`main-tab-btn ${activeTab === 'GUIA_IMPOSTOS' ? 'main-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('GUIA_IMPOSTOS')}
          >
            <span className="tab-step">ABA 02</span>
            <strong>Entenda Cada Imposto e Como Ele se Aplica (Exemplos no Dia a Dia)</strong>
          </button>
        </div>

        {/* CONTEÚDO DA ABA 01: PAINEL ANALÍTICO */}
        {activeTab === 'PAINEL' && (
          <div
            id="tabpanel-painel"
            role="tabpanel"
            aria-labelledby="tab-btn-painel"
            className="analytical-column"
          >
            {validationErrors.length > 0 ? (
              <section
                className="state-banner state-error"
                role="alert"
                aria-labelledby="error-state-heading"
              >
                <h2 id="error-state-heading">Dados fora dos limites fiscais válidos</h2>
                <p>
                  Corrija os campos abaixo para que o motor tributário possa calcular o IRPF, o INSS e a série histórica com precisão:
                </p>
                <ul>
                  {validationErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => handleApplyPersona(DEFAULT_PROFILE, 'Trabalhador CLT Padrão')}
                >
                  Restaurar valores válidos
                </button>
              </section>
            ) : isLoadingSimulation ? (
              <section
                className="state-banner state-loading"
                role="status"
                aria-live="polite"
              >
                <h2>Processando parâmetros fiscais...</h2>
                <p>
                  Calculando tabelas progressivas de IRPF, faixas de INSS e estimativa de consumo de 2015 a 2026.
                </p>
              </section>
            ) : currentResult.grossAnnualIncome === 0 ? (
              <section
                className="state-banner state-empty"
                aria-labelledby="empty-state-heading"
              >
                <h2 id="empty-state-heading">Nenhuma renda mensal informada</h2>
                <p>
                  Informe um salário bruto mensal ou faturamento no módulo de identificação acima para gerar o Raio-X dos tributos diretos, a estimativa de impostos sobre o consumo e a evolução de 2015 a 2026.
                </p>
                <div className="empty-state-actions">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() =>
                      handleApplyPersona(PRESET_PERSONAS[0].profile, PRESET_PERSONAS[0].name)
                    }
                  >
                    Simular Trabalhador CLT (R$ 6.800/mês)
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() =>
                      handleApplyPersona(PRESET_PERSONAS[1].profile, PRESET_PERSONAS[1].name)
                    }
                  >
                    Simular Aposentado PCD (R$ 7.500/mês)
                  </button>
                </div>
              </section>
            ) : (
              <>
                <section className="kpi-strip" aria-label="Indicadores fiscais principais">
                  <article className="kpi-card kpi-card-primary">
                    <span className="kpi-label">Alíquota Efetiva Total ({selectedYear})</span>
                    <strong className="kpi-value mono-num">
                      {currentResult.effectiveTaxRate.toFixed(2)}%
                    </strong>
                    <p className="kpi-detail">
                      Total de <span className="mono-num">{formatBRL(currentResult.totalTaxesPaid)}</span> em tributos sobre a renda bruta anual de{' '}
                      <span className="mono-num">{formatBRL(currentResult.grossAnnualIncome)}</span>.
                    </p>
                  </article>

                  <article className="kpi-card">
                    <span className="kpi-label">Dias Trabalhados para Pagamento de Tributos</span>
                    <strong className="kpi-value mono-num">
                      {currentResult.daysWorkedForTaxes} dias
                    </strong>
                    <p className="kpi-detail">
                      Dia da Liberdade de Impostos em {selectedYear}:{' '}
                      <strong>{currentResult.taxFreedomDate}</strong>.
                    </p>
                  </article>

                  <article className="kpi-card">
                    <span className="kpi-label">Economia por Isenções PCD e Deduções</span>
                    <strong className="kpi-value kpi-emerald mono-num">
                      {formatBRL(currentResult.pcdSavingsAmount + currentResult.totalDeductionsSavings)}
                    </strong>
                    <p className="kpi-detail">
                      Isenções PCD: <span className="mono-num">{formatBRL(currentResult.pcdSavingsAmount)}</span> | Deduções IRPF:{' '}
                      <span className="mono-num">{formatBRL(currentResult.totalDeductionsSavings)}</span>.
                    </p>
                  </article>

                  <article className="kpi-card">
                    <span className="kpi-label">Custo Anual da Defasagem da Tabela IRPF</span>
                    <strong className="kpi-value kpi-terracotta mono-num">
                      {formatBRL(currentResult.irpfLagExtraCost)}
                    </strong>
                    <p className="kpi-detail">
                      Com correção integral pelo IPCA, seu IRPF anual cairia de{' '}
                      <span className="mono-num">{formatBRL(currentResult.irpfAnnual)}</span> para{' '}
                      <span className="mono-num">{formatBRL(currentResult.irpfWithInflationCorrectedTable)}</span>.
                    </p>
                  </article>
                </section>

                <section
                  id="raio-x"
                  className="ledger-section"
                  aria-labelledby="heading-raiox"
                >
                  <div className="section-rubric">
                    <span className="rubric-code">02 / RAIO-X ANUAL ({selectedYear})</span>
                    <h2 id="heading-raiox">Decomposição da Renda Bruta ao Poder de Compra Real</h2>
                  </div>
                  <SalaryXRayChart result={currentResult} />
                </section>

                <section
                  id="evolucao"
                  className="ledger-section"
                  aria-labelledby="heading-evolucao"
                >
                  <div className="section-rubric">
                    <span className="rubric-code">03 / SÉRIE HISTÓRICA 2015-2026</span>
                    <h2 id="heading-evolucao">
                      Evolução da Carga Tributária e Impacto da Defasagem Inflacionária
                    </h2>
                  </div>
                  <HistoricalEvolutionChart
                    series={historicalSeries}
                    selectedYear={selectedYear}
                    onSelectYear={(yr) => setSelectedYear(yr)}
                  />
                </section>

                <section
                  id="comparador-regimes"
                  className="ledger-section"
                  aria-labelledby="heading-comparador"
                >
                  <div className="section-rubric">
                    <span className="rubric-code">04 / DISTRIBUIÇÃO E REGIMES</span>
                    <h2 id="heading-comparador">
                      Peso de Renda vs. Consumo vs. Previdência e Comparador de Modalidades
                    </h2>
                  </div>
                  <DistributionAndRegimesChart
                    result={currentResult}
                    comparisons={regimeComparisons}
                    currentRegime={profile.regime}
                    onSelectRegime={(regime) => {
                      setProfile({ ...profile, regime });
                      setStatusMessage(
                        `Regime alterado para ${WORK_REGIME_LABELS[regime].title}.`
                      );
                    }}
                  />
                </section>

                <section
                  id="direitos-pcd"
                  className="ledger-section"
                  aria-labelledby="heading-pcd"
                >
                  <div className="section-rubric">
                    <span className="rubric-code">05 / ENQUADRAMENTO PCD E MOLÉSTIAS GRAVES</span>
                    <h2 id="heading-pcd">
                      Mapa de Isenções Legais (IRPF, IPVA, IPI, ICMS e Saúde)
                    </h2>
                  </div>

                  <div className="pcd-rights-grid">
                    {pcdRights.map((right) => (
                      <article
                        key={right.id}
                        className={`pcd-card ${right.isEligibleForUser ? 'pcd-card-eligible' : ''}`}
                      >
                        <div className="pcd-card-header">
                          <span className="pcd-scope-tag">{right.scope}</span>
                          <span className="pcd-status-tag">
                            {right.isEligibleForUser ? 'Aplicável ao perfil atual' : 'Condicional / Informativo'}
                          </span>
                        </div>
                        <h3>{right.taxName}</h3>
                        <p className="pcd-legal">{right.legalBasis}</p>
                        <p>{right.ceilingDescription}</p>
                        <div className="pcd-benefit-row">
                          <span>Impacto financeiro estimado:</span>
                          <strong className="mono-num">
                            {formatBRL(right.estimatedAnnualOrPurchaseBenefit)}
                          </strong>
                        </div>
                        <p className="pcd-note">{right.eligibilityNote}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA 02: GUIA PRÁTICO DE CADA IMPOSTO E EXEMPLOS REAIS */}
        {activeTab === 'GUIA_IMPOSTOS' && (
          <div
            id="tabpanel-guia"
            role="tabpanel"
            aria-labelledby="tab-btn-guia"
            className="analytical-column"
          >
            <section
              id="guia-impostos"
              className="ledger-section"
              aria-labelledby="heading-consumo-exemplos"
            >
              <div className="section-rubric">
                <span className="rubric-code">06.A / IMPOSTO SOBRE CONSUMO NA PRÁTICA</span>
                <h2 id="heading-consumo-exemplos">
                  O que é o Imposto sobre Consumo e como ele se aplica em cada produto (Refrigerante, Sorvete, Cesta Básica e mais)
                </h2>
              </div>

              <div className="consumption-intro-box">
                <p>
                  <strong>Imposto sobre consumo:</strong> é o conjunto de tributos aplicado sobre bens, mercadorias e serviços em todas as etapas de produção e comercialização (<strong>ICMS</strong> estadual, <strong>IPI</strong> federal sobre industrializados, <strong>PIS/COFINS</strong> federais e <strong>ISS</strong> municipal, em transição gradual para o <strong>IBS</strong>, a <strong>CBS</strong> e o <strong>Imposto Seletivo</strong>). Ao contrário do Imposto de Renda, que aparece destacado no holerite, o imposto sobre consumo fica embutido dentro do preço de prateleira.
                </p>
              </div>

              <div className="xray-grid">
                <div className="chart-panel">
                  <h3 className="chart-question-title">
                    Simulador de Cupom Fiscal: Quanto de imposto há dentro do preço de cada item?
                  </h3>
                  <p className="chart-subtitle">
                    Selecione um item do dia a dia (ex.: refrigerante, sorvete, arroz e feijão, gasolina) e ajuste o valor pago para ver a decomposição tributária:
                  </p>

                  <div className="product-selector-pills" role="group" aria-label="Escolher produto para decomposição de impostos">
                    {CONSUMPTION_PRODUCT_EXAMPLES.map((prod) => {
                      const isSelected = prod.id === selectedProduct.id;
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          className={`toggle-btn ${isSelected ? 'toggle-btn-active' : ''}`}
                          onClick={() => {
                            setSelectedProductId(prod.id);
                            setCustomProductPrice(prod.referencePrice);
                          }}
                          aria-pressed={isSelected}
                        >
                          {prod.name} ({prod.totalTaxRatePct.toFixed(1)}%)
                        </button>
                      );
                    })}
                  </div>

                  <div className="receipt-simulator-controls">
                    <label htmlFor="input-product-price" className="field-label">
                      Valor Pago pelo Consumidor no Caixa (R$)
                      <input
                        id="input-product-price"
                        type="number"
                        min="0"
                        step="1"
                        className="text-input mono-num"
                        value={customProductPrice}
                        onChange={(e) =>
                          setCustomProductPrice(
                            e.target.value === '' ? 0 : Math.max(0, Number(e.target.value))
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="waterfall-list">
                    <div className="waterfall-row">
                      <div className="waterfall-meta">
                        <span className="waterfall-step">Valor Real do Produto/Serviço (sem tributos)</span>
                        <span className="mono-num">
                          {formatBRL(productNetValue)} ({(100 - selectedProduct.totalTaxRatePct).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="waterfall-track" aria-hidden="true">
                        <div
                          className="waterfall-bar waterfall-bar-emerald"
                          style={{ width: `${Math.max(2, 100 - selectedProduct.totalTaxRatePct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="waterfall-row">
                      <div className="waterfall-meta">
                        <span className="waterfall-step">ICMS Estadual (Circulação de Mercadorias)</span>
                        <span className="mono-num">
                          {formatBRL((safeProductPrice * selectedProduct.icmsPct) / 100)} ({selectedProduct.icmsPct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="waterfall-track" aria-hidden="true">
                        <div
                          className="waterfall-bar waterfall-bar-terracotta"
                          style={{ width: `${Math.max(2, selectedProduct.icmsPct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="waterfall-row">
                      <div className="waterfall-meta">
                        <span className="waterfall-step">IPI Federal (Produto Industrializado)</span>
                        <span className="mono-num">
                          {formatBRL((safeProductPrice * selectedProduct.ipiPct) / 100)} ({selectedProduct.ipiPct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="waterfall-track" aria-hidden="true">
                        <div
                          className="waterfall-bar waterfall-bar-blue"
                          style={{ width: `${Math.max(selectedProduct.ipiPct > 0 ? 2 : 0, selectedProduct.ipiPct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="waterfall-row">
                      <div className="waterfall-meta">
                        <span className="waterfall-step">PIS / COFINS Federal (Seguridade Social)</span>
                        <span className="mono-num">
                          {formatBRL((safeProductPrice * selectedProduct.pisCofinsPct) / 100)} ({selectedProduct.pisCofinsPct.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="waterfall-track" aria-hidden="true">
                        <div
                          className="waterfall-bar waterfall-bar-neutral"
                          style={{ width: `${Math.max(selectedProduct.pisCofinsPct > 0 ? 2 : 0, selectedProduct.pisCofinsPct)}%` }}
                        />
                      </div>
                    </div>

                    <div className="waterfall-row">
                      <div className="waterfall-meta">
                        <span className="waterfall-step">ISS Municipal e Encargos da Cadeia</span>
                        <span className="mono-num">
                          {formatBRL((safeProductPrice * selectedProduct.issOrOtherPct) / 100)} ({selectedProduct.issOrOtherPct.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="waterfall-track" aria-hidden="true">
                        <div
                          className="waterfall-bar waterfall-bar-blue"
                          style={{ width: `${Math.max(2, selectedProduct.issOrOtherPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="chart-callout">
                    <p>
                      <strong>Como se aplica ({selectedProduct.name}):</strong> {selectedProduct.howItApplies}
                    </p>
                    <p className="reform-callout">
                      <strong>Regra / Reforma Tributária:</strong> {selectedProduct.reformNote}
                    </p>
                  </div>
                </div>

                <div className="chart-panel">
                  <h3 className="chart-question-title">
                    Comparativo Direto: Por que o refrigerante e o sorvete pagam mais imposto que a cesta básica?
                  </h3>
                  <div className="product-cards-stack">
                    {CONSUMPTION_PRODUCT_EXAMPLES.map((item) => (
                      <article key={item.id} className="product-explanation-card">
                        <div className="product-card-header">
                          <strong>{item.name}</strong>
                          <span className="mono-num product-tax-badge">
                            Carga: {item.totalTaxRatePct.toFixed(1)}%
                          </span>
                        </div>
                        <p>{item.howItApplies}</p>
                        <div className="product-mini-breakdown mono-num">
                          <span>ICMS: {item.icmsPct}%</span>
                          <span>IPI: {item.ipiPct}%</span>
                          <span>PIS/COFINS: {item.pisCofinsPct}%</span>
                          <span>ISS/Cadeia: {item.issOrOtherPct}%</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section
              className="ledger-section"
              aria-labelledby="heading-guias-detalhados"
            >
              <div className="section-rubric">
                <span className="rubric-code">06.B / COMO FUNCIONA CADA IMPOSTO NO BRASIL</span>
                <h2 id="heading-guias-detalhados">
                  Explicação Passo a Passo por Esfera (Consumo, Renda, Previdência e Patrimônio/PJ)
                </h2>
              </div>

              <div className="detailed-guides-stack">
                {DETAILED_TAX_GUIDES.map((guide) => (
                  <article key={guide.id} className="detailed-guide-card">
                    <div className="pcd-card-header">
                      <span className="pcd-scope-tag">Esfera: {guide.sphere}</span>
                      <span className="pcd-status-tag">{guide.categoryLabel}</span>
                    </div>
                    <h3>{guide.title}</h3>
                    <p className="guide-what-is">{guide.whatItIs}</p>

                    <div className="guide-columns">
                      <div className="guide-col">
                        <h4>Como o cálculo se aplica na prática:</h4>
                        <ul className="guide-steps-list">
                          {guide.howItAppliesStepByStep.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="guide-col">
                        <h4>Exemplos concretos de aplicação:</h4>
                        <div className="guide-examples-list">
                          {guide.practicalExamples.map((ex) => (
                            <div key={ex.context} className="guide-example-box">
                              <strong>{ex.context}:</strong> <span>{ex.explanation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section
              id="glossario"
              className="ledger-section"
              aria-labelledby="heading-glossario"
            >
              <div className="section-rubric">
                <span className="rubric-code">06.C / GLOSSÁRIO DE LEGISLAÇÃO</span>
                <h2 id="heading-glossario">Glossário Técnico de Tributos e Regras Fiscais</h2>
              </div>

              <div className="glossary-filter-bar" role="group" aria-label="Filtrar termos do glossário">
                {['TODOS', 'Direto', 'Previdência', 'Consumo', 'Isenção & Conceito'].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`toggle-btn ${glossaryFilter === cat ? 'toggle-btn-active' : ''}`}
                      onClick={() => setGlossaryFilter(cat)}
                      aria-pressed={glossaryFilter === cat}
                    >
                      {cat === 'TODOS' ? 'Todos os Termos' : cat}
                    </button>
                  )
                )}
              </div>

              <div className="glossary-grid">
                {filteredGlossary.map((item) => {
                  const isOpen = activeGlossaryTerm === item.term;
                  return (
                    <article key={item.term} className="glossary-card">
                      <div className="glossary-card-top">
                        <span className="pcd-scope-tag">{item.category}</span>
                        <h3>{item.term}</h3>
                      </div>
                      <p>{item.summary}</p>
                      <button
                        type="button"
                        className="glossary-trigger"
                        onClick={() =>
                          setActiveGlossaryTerm(isOpen ? null : item.term)
                        }
                        aria-expanded={isOpen}
                      >
                        {isOpen ? 'Ocultar base legal' : 'Ver base legal e metodologia'}
                      </button>
                      {isOpen && (
                        <div className="glossary-legal-box">
                          <strong>Referência normativa:</strong> {item.legalOrTechnicalBasis}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>
            <strong>Imposto:</strong> Plataforma educativa de transparência fiscal pessoal. Os cálculos são processados exclusivamente no seu navegador (client-side), sem envio de dados financeiros para servidores externos.
          </p>
          <p className="footer-sources">
            Fontes parametrizadas: Tabelas Progressivas da Receita Federal do Brasil (2015 a 2026), Previdência Social (EC 103/2019), POF/IBGE, IPEA, IBPT e Lei nº 7.713/1988.
          </p>
        </div>
      </footer>
    </div>
  );
};
