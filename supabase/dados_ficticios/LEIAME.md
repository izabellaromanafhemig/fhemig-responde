# Dados fictícios — Fhemigo Responde

60 servidores **inventados** (nenhuma pessoa real), com frequência, férias,
folgas e regras de RH extras. Gerados por `scripts/gerar-dados-ficticios.mjs`
(para gerar de novo: `node scripts/gerar-dados-ficticios.mjs`).

Os MASPs começam com `91`, então não conflitam com os de `002_dados_teste.sql`
(que começam com `9000`). Você pode importar com ou sem o 002.

| Arquivo | Tabela | Linhas |
|---|---|---|
| 01_dados_funcionais.csv | dados_funcionais | 60 (43 efetivos, 17 contratos) |
| 02_dados_frequencia.csv | dados_frequencia | 720 (nov/2025 a out/2026) |
| 03_dados_ferias.csv | dados_ferias | 120 (2025 e 2026) |
| 04_dados_ferias_periodos.csv | dados_ferias_periodos | 210 |
| 05_dados_folgas.csv | dados_folgas | 153 |
| 06_dados_regras_rh.csv | dados_regras_rh | 12 regras extras (`validado = false`) |

## Opção 1 — importar os CSVs (Table Editor)

**Importe nesta ordem**, porque as tabelas dependem umas das outras
(o período de férias precisa do direito anual, que precisa do servidor):

1. `01_dados_funcionais.csv` → `dados_funcionais`
2. `02_dados_frequencia.csv` → `dados_frequencia`
3. `03_dados_ferias.csv` → `dados_ferias`
4. `04_dados_ferias_periodos.csv` → `dados_ferias_periodos`
5. `05_dados_folgas.csv` → `dados_folgas`
6. `06_dados_regras_rh.csv` → `dados_regras_rh`

Em cada tabela: **Table Editor → escolha a tabela → Insert → Import data from CSV**.

Os CSVs não têm as colunas `id`, `created_at`, `updated_at` nem `busca`:
o banco preenche sozinho. Campos vazios viram `NULL`.

## Opção 2 — um único script SQL (mais rápido)

Abra `dados_ficticios.sql` no **SQL Editor**, cole e execute. Insere tudo de
uma vez, na ordem certa, numa única transação (se algo falhar, nada é gravado).

Use **só uma das opções**. Rodar as duas duplica dados ou dá erro de chave
repetida.

## MASPs bons para testar

| MASP | Situação para perguntar à IA |
|---|---|
| 91000023 | Contrato vencendo em 07/02/2027 |
| 91000075 | Em férias agora (02/11 a 13/11/2026) |
| 91000052 | Vários lançamentos de folga compensativa |
| 91000011 | Efetivo, enfermeiro, férias de 2025 e 2026 |

Cadastre-se no app com esses MASPs (um de cada vez) e confira que cada um só
vê os próprios dados.

> Os status das férias (gozada / em gozo / programada) foram calculados com
> base em 12/11/2026. Com o passar do tempo, eles não se atualizam sozinhos.
> Para atualizar, gere os dados de novo depois de mudar `HOJE` no script.
