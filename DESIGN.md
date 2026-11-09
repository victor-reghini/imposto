# DESIGN.md: Direção Visual do Projeto Imposto

## Identidade e Propósito
- **Produto**: Imposto (Calculadora de Transparência Fiscal Pessoal e Educação Tributária).
- **Público**: Trabalhadores CLT, servidores públicos, profissionais PJ/MEI/autônomos, aposentados e pessoas com deficiência (PCD) no Brasil.
- **Linguagem Visual**: Caderno Contábil Cívico (inspirado em boletins estatísticos do IBGE/IPEA e formulários técnicos da Receita Federal, com foco em leitura tabular precisa e contraste matemático).
- **Dial**: ENERGY 2 / RHYTHM 2 / MOTION 1

## Decisões de Design Documentadas (R-31)
- **Paleta (2 cores base + 1 destaque + neutros)**:
  - Neutros de Papel e Tinta (`#F8F7F4`, `#FFFFFF`, `#14181F`, `#3E4856` no modo claro; `#0F141C`, `#18202C`, `#F1F5F9`, `#B8C4D4` no modo escuro) para leitura prolongada de tabelas fiscais com razão de contraste acima de 8.5:1.
  - Verde Cívico (`#0F5238` claro / `#34D399` escuro) para representar renda líquida preservada e economia legal por isenções PCD ou deduções.
  - Azul Contábil (`#1E40AF` claro / `#60A5FA` escuro) para contribuições previdenciárias (INSS/RPPS) e comparativos históricos.
  - Destaque Deliberado Terracota Fiscal (`#9A3412` claro / `#FB923C` escuro) reservado para o peso total de tributos, o marco do Dia da Liberdade de Impostos e alertas de defasagem da tabela do IRPF.
- **Tipografia**:
  - Títulos e corpo em fonte humanista sem serifa do sistema (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`) com escala fluida via `clamp()` para legibilidade imediata em qualquer tela sem carregamento de fontes externas.
  - Valores monetários, alíquotas e tabelas com `font-variant-numeric: tabular-nums` e fonte monoespaçada técnica (`ui-monospace, 'Cascadia Mono', 'Segoe UI Mono', monospace`) exclusivamente em células numéricas e fórmulas para alinhamento decimal vertical.
- **Layout e Ritmo (RHYTHM 2)**:
  - Três estados responsivos reais: coluna única empilhada abaixo de `680px`, grade fluida de duas colunas entre `680px` e `1080px`, e painel editorial assimétrico (formulário lateral + caderno analítico principal) acima de `1080px`.
  - Variação estrutural entre seções: cabeçalho com seletor temporal e resumo executivo, painel de decomposição salarial com gráfico cascata/rosca, série histórica 2015-2026 com análise de defasagem inflacionária, comparativo entre regimes (CLT vs. MEI vs. Simples vs. Autônomo), quadro de direitos PCD e glossário interativo.
- **Movimento (MOTION 1)**:
  - Apenas estados de foco (`:focus-visible`) e hover/active imediatos, sem animações em loop, pulsos decorativos ou transições que atrasem a leitura dos dados.
- **Motivo de Identidade**:
  - Cabeçalhos de seção numerados como rubricas de declaração fiscal (`01 / Identificação`, `02 / Raio-X Anual`, `03 / Série Histórica 2015-2026`, `04 / Comparador de Regimes`, `05 / Direitos e Isenções PCD`, `06 / Glossário Tributário`) com alinhamento tabular rigoroso.

