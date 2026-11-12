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
| 03_dados_ferias.csv | dados_ferias | 115 (2025 e 2026) |
| 04_dados_ferias_periodos.csv | dados_ferias_periodos | 178 |
| 05_dados_folgas.csv | dados_folgas | 159 |
| 06_dados_regras_rh.csv | dados_regras_rh | 4 regras extras (`validado = false`) — férias e folgas ficam no `003`; faltas, horas extras, luto e casamento no `004` |

## Férias seguem as regras do `003_regras_ferias_folgas.sql`

- Efetivos e contratados: 25 dias úteis (sábados, domingos e feriados
  nacionais não contam; ponto facultativo conta) — FER-01 e FER-03.
- Primeiras férias só depois de 11 meses de exercício.
- No máximo 2 períodos por ano, cada um com pelo menos 10 dias úteis.
- Todo período começa dentro do ano de referência, até o último dia útil.
- Sem acúmulo: as férias de 2025 estão todas gozadas.

## Já importou a versão anterior? Use a recarga

Se você importou os dados fictícios **antes** das regras de férias, rode só
`recarregar_ferias_folgas.sql` no **SQL Editor**. Ele troca férias, períodos e
folgas dos MASPs `91…` pelos novos e corrige os períodos do `002`. Cadastro,
frequência e regras não mudam. Não é preciso reimportar os CSVs.

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
| 91000023 | Contrato vencendo em 07/02/2027 e 12 dias úteis de férias de 2026 a programar |
| 91000116 | Em férias agora (10/11 a 26/11/2026; 20/11 é feriado e não conta) |
| 91000406 | Todos os cartões da página de início com valores: 10 dias de férias restantes (próximas em 24/11), saldo de 4 folgas (próxima em 16/11) |
| 91000094 | Vários lançamentos de folga, mas saldo zerado e férias de 2026 todas gozadas (bom para testar "zero") |
| 91000011 | Efetivo; férias de 2026 em 2 períodos, o próximo começa em 19/11/2026 |

Cadastre-se no app com esses MASPs (um de cada vez) e confira que cada um só
vê os próprios dados.

> Os status das férias (gozada / em gozo / programada) foram calculados com
> base em 12/11/2026. Com o passar do tempo, eles não se atualizam sozinhos.
> Para atualizar, gere os dados de novo depois de mudar `HOJE` no script.
