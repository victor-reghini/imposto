# Especificação de Projeto: Imposto

## 1. Visão Geral

O **Imposto** é uma aplicação web interativa focada em transparência fiscal pessoal e educação tributária. A plataforma permite que o cidadão insira dados sobre sua realidade socioeconômica (renda, ocupação, enquadramento PCD, dependentes, etc.) e visualize com clareza matemática e visual:
1. Quanto paga de impostos diretos (IRPF, INSS, taxas de classe, etc.).
2. Estimativas de impostos indiretos (embutidos no consumo conforme a faixa de renda).
3. A evolução histórica da sua carga tributária ao longo dos anos, com gráficos comparativos e análises de impacto inflacionário vs. defasagem de tabelas tributárias.

---

## 2. Personas e Casos de Uso

* **Trabalhador CLT**: Quer entender o desconto na folha (INSS, IRRF) e comparar com o que pagava em anos anteriores.
* **Pessoa com Deficiência (PCD)**: Quer verificar suas isenções aplicáveis (ex.: isenções em compra de veículos, IRPF sobre certas rendas/aposentadorias, teto de deduções).
* **Profissional PJ / Autônomo**: Quer simular impostos de sua modalidade (Simples Nacional, Carnê-Leão, MEI, ISS) e comparar com CLT.
* **Cidadão Comum**: Busca conscientização sobre quanto tempo do ano trabalha apenas para pagar impostos ("Dia da Liberdade de Impostos").

---

## 3. Arquitetura Funcional

### 3.1 Módulo de Identificação do Usuário (Entrada de Dados)

O formulário deve ser dinâmico e amigável:

* **Renda e Remuneração:**
  * Salário bruto mensal / Faturamento anual.
  * Benefícios e descontos obrigatórios conhecidos.
  * 13º salário e adicionais (opcional).
* **Regime de Trabalho / Ocupação:**
  * CLT (com carteira assinada).
  * Servidor Público (RPPS / RGPS).
  * Pessoa Jurídica (Simples Nacional, Lucro Presumido).
  * Autônomo / Profissional Liberal.
  * Aposentado / Pensionista.
* **Condições Especiais:**
  * Enquadramento PCD (Pessoa com Deficiência) ou doenças graves com isenção de IRPF sobre proventos.
  * Idade (para isenção extra de aposentados acima de 65 anos).
* **Estrutura Familiar e Deduções:**
  * Número de dependentes.
  * Gastos anuais médios com saúde e instrução/educação.
  * Pensão alimentícia judicial.
* **Localização (Opcional):**
  * Estado / UF (para cálculo aproximado de IPVA e ICMS padrão).

---

### 3.2 Motor de Cálculo Tributário (*Tax Engine*)

O motor deve processar regras fiscais parametrizadas por ano:

* **Tributação Direta:**
  * **IRPF (Imposto de Renda Pessoa Física):** Cálculo progressivo com base na tabela oficial do ano selecionado, considerando dedução simplificada ou completa.
  * **Previdência (INSS / Regime Próprio):** Alíquotas progressivas e teto do regime geral de cada período.
  * **Tributos PJ/MEI (quando aplicável):** DAS-MEI, alíquotas do anexo do Simples Nacional ou IRPJ/CSLL/PIS/COFINS/ISS.
* **Isenções e Regras PCD:**
  * Isenção de IRPF em aposentadoria/reforma para doenças graves ou condições previstas em lei.
  * Apontamento de direitos a isenções de IPVA, IPI, ICMS e IOF em veículos/tecnologias assistivas.
* **Estimativa de Tributos sobre Consumo:**
  * Baseado no perfil de renda (metodologias do IBGE/POF e IPEA) estimando a parcela do consumo gasta em impostos indiretos (ICMS, PIS, COFINS, ISS, IPI / CBS e IBS).

---

### 3.3 Seletor Temporal e Evolução Histórica

* **Filtro de Ano:** Seletor interativo (ex.: 2015 até o ano vigente).
* **Parâmetros Históricos:**
  * Tabela de IRPF vigente em cada ano.
  * Salário mínimo e teto do INSS da época.
  * Cesta de consumo média e inflação acumulada (IPCA).
* **Análise de Defasagem:** Comparação entre o que o usuário pagou e o que pagaria caso a tabela do IRPF tivesse sido corrigida integralmente pela inflação.

---

### 3.4 Visualizações e Gráficos

1. **Raio-X do Salário (Donut Chart / Waterfall):**
   * Salário Bruto vs. Descontos Previdenciários vs. IRPF vs. Salário Líquido Real.
2. **Evolução Temporal da Carga Tributária (Line / Area Chart):**
   * Eixo X: Anos (ex.: 2018 - 2026).
   * Eixo Y: Percentual da renda consumido por impostos (Alíquota Efetiva) e valor nominal total pago em tributos.
3. **Distribuição dos Impostos (Bar Chart):**
   * Impostos sobre Renda vs. Impostos sobre Consumo vs. Previdência.
4. **Métricas Rápidas (KPI Cards):**
   * *Alíquota Efetiva Atual*: `%` real pago sobre o total da renda.
   * *Dias Trabalhados para o Estado*: Quantidade de dias no ano dedicados ao pagamento de tributos.
   * *Economia por Isenções (PCD/Dependentes)*: Valor poupado através das regras específicas declaradas.

---

## 4. Modelagem de Dados Sugerida (TypeScript)

```typescript
export type WorkRegime = 'CLT' | 'PJ_MEI' | 'PJ_SIMPLES' | 'AUTONOMO' | 'PUBLIC_SERVANT' | 'RETIRED';

export interface UserProfile {
  grossMonthlyIncome: number;
  regime: WorkRegime;
  isPCD: boolean;
  hasQualifyingConditionForIRExemption: boolean;
  age: number;
  dependentsCount: number;
  annualHealthExpenses?: number;
  annualEducationExpenses?: number;
  stateUF?: string;
}

export interface TaxParametersYear {
  year: number;
  minimumWage: number;
  inssCeiling: number;
  inssBrackets: Array<{ limit: number; rate: number }>;
  irpfBrackets: Array<{ limit: number; rate: number; deduction: number }>;
  dependentDeductionMonthly: number;
  simplifiedDiscountLimit: number;
  estimatedConsumptionTaxRateByIncomeDecile: Record<number, number>;
}

export interface YearlyTaxResult {
  year: number;
  grossAnnualIncome: number;
  netAnnualIncome: number;
  totalDirectTaxes: number;
  totalEstimatedIndirectTaxes: number;
  totalTaxesPaid: number;
  effectiveTaxRate: number; // Porcentagem (0 - 100)
  daysWorkedForTaxes: number;
  pcdSavingsAmount: number;
}
```

---

## 5. Recomendações de Stack e Tecnologias

* **Frontend**: Next.js (App Router) ou Vite + React com TypeScript.
* **Estilização**: Tailwind CSS com componentes acessíveis (Radix UI / Shadcn UI).
* **Biblioteca de Gráficos**: Recharts, Tremor ou Chart.js (com suporte a tooltips explicativos e acessibilidade de cores).
* **Armazenamento de Dados**:
  * Tabela estática/JSON versionada contendo os índices tributários oficiais de cada ano (sem necessidade de backend complexo na v1).
  * Estado do cliente salvo em `localStorage` para manter os dados preenchidos localmente sem envio sensível de renda para servidores externos (foco em privacidade).

---

## 6. Roadmap de Implementação

1. **Sprint 1: Base de Cálculos & Perfis**
   * Criar o schema e as tabelas com os parâmetros históricos fiscais (IRPF, INSS de 2015 em diante).
   * Implementar o formulário de identificação (Salário, Regime, PCD, Dependentes).
2. **Sprint 2: Motor de Regras Tributárias**
   * Cálculos de IRPF, INSS e alíquotas efetivas.
   * Regras de isenções PCD e deduções legais.
3. **Sprint 3: Visualização e Gráficos**
   * Construção do dashboard de KPIs e gráficos de distribuição e série temporal.
   * Comparador interativo ano a ano com seletor de data.
4. **Sprint 4: Refinamento & Privacidade**
   * Modo anônimo / local-only.
   * Tooltips educativos explicando o que é cada tributo.