// Gera dados FICTÍCIOS para o Fhemigo Responde.
//   node scripts/gerar-dados-ficticios.mjs
// Saída: supabase/dados_ficticios/*.csv  +  supabase/dados_ficticios/dados_ficticios.sql
//
// Determinístico (semente fixa): rodar de novo gera os mesmos dados.
// Nenhuma pessoa real. MASPs começam com "91" para não colidir com os do
// 002_dados_teste.sql (que começam com "9000").

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "supabase", "dados_ficticios");
const HOJE = new Date("2026-11-12T00:00:00Z"); // data de referência dos status
const QTD_SERVIDORES = 60;

// ---------------------------------------------------------------- aleatório
let semente = 20261112;
function rnd() {
  // mulberry32
  semente |= 0;
  semente = (semente + 0x6d2b79f5) | 0;
  let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

// ---------------------------------------------------------------- datas
const d = (s) => new Date(`${s}T00:00:00Z`);
const iso = (dt) => dt.toISOString().slice(0, 10);
const addDias = (dt, n) => new Date(dt.getTime() + n * 86400000);
// Feriados nacionais (não contam como dia útil). Ponto facultativo
// (Carnaval, Corpus Christi) conta como dia útil — regra FER-01.
const FERIADOS = new Set([
  "2025-01-01", "2025-04-18", "2025-04-21", "2025-05-01", "2025-09-07",
  "2025-10-12", "2025-11-02", "2025-11-15", "2025-11-20", "2025-12-25",
  "2026-01-01", "2026-04-03", "2026-04-21", "2026-05-01", "2026-09-07",
  "2026-10-12", "2026-11-02", "2026-11-15", "2026-11-20", "2026-12-25",
  "2027-01-01",
]);
const fimDeSemana = (dt) => [0, 6].includes(dt.getUTCDay());
const diaUtil = (dt) => !fimDeSemana(dt) && !FERIADOS.has(iso(dt));
function proximoDiaUtil(dt) {
  let x = dt;
  while (!diaUtil(x)) x = addDias(x, 1);
  return x;
}
function ultimoDiaUtilDoAno(ano) {
  let x = d(`${ano}-12-31`);
  while (!diaUtil(x)) x = addDias(x, -1);
  return x;
}
/** Data final contando `n` dias úteis a partir de `inicio` (inclusive). */
function fimPorDiasUteis(inicio, n) {
  let x = inicio;
  let contados = diaUtil(x) ? 1 : 0;
  while (contados < n) {
    x = addDias(x, 1);
    if (diaUtil(x)) contados++;
  }
  return x;
}
function addMeses(dt, n) {
  const x = new Date(dt);
  x.setUTCMonth(x.getUTCMonth() + n);
  return x;
}
function dataEntre(a, b) {
  if (b <= a) return a;
  return addDias(a, Math.floor(rnd() * ((b - a) / 86400000 + 1)));
}
function dataAleatoria(inicio, fim) {
  const a = d(inicio).getTime();
  const b = d(fim).getTime();
  return new Date(a + Math.floor(rnd() * ((b - a) / 86400000 + 1)) * 86400000);
}

// ---------------------------------------------------------------- catálogos
const NOMES_F = ["Ana", "Beatriz", "Camila", "Daniela", "Eduarda", "Fernanda",
  "Gabriela", "Helena", "Isabela", "Juliana", "Larissa", "Mariana", "Natália",
  "Patrícia", "Renata", "Simone", "Tatiane", "Vanessa", "Luciana", "Cláudia"];
const NOMES_M = ["André", "Bruno", "Carlos", "Diego", "Eduardo", "Felipe",
  "Gustavo", "Henrique", "Igor", "João", "Leonardo", "Marcelo", "Rafael",
  "Rodrigo", "Thiago", "Vinícius", "Paulo", "Fábio", "Sérgio", "Ricardo"];
const SOBRENOMES = ["Almeida", "Barbosa", "Cardoso", "Costa", "Dias", "Ferreira",
  "Gomes", "Lima", "Martins", "Melo", "Moreira", "Nascimento", "Oliveira",
  "Pereira", "Ribeiro", "Rocha", "Santos", "Silva", "Souza", "Teixeira",
  "Vieira", "Campos", "Fonseca", "Rezende"];

const UNIDADES = ["Hospital João XXIII", "Hospital Infantil João Paulo II",
  "Hospital Alberto Cavalcanti", "Maternidade Odete Valadares",
  "Hospital Eduardo de Menezes", "Hospital Júlia Kubitschek",
  "Hospital Regional João Penido", "Hospital Regional de Barbacena",
  "Administração Central"];

// carreira -> [ [categoria masc, categoria fem, formações possíveis], ... ]
const SUP = ["superior", "especializacao", "mestrado", "doutorado"];
const CARREIRAS = {
  MED: [
    ["Médico Clínico", "Médica Clínica", ["superior", "especializacao", "mestrado"]],
    ["Médico Pediatra", "Médica Pediatra", ["especializacao", "mestrado"]],
    ["Médico Anestesiologista", "Médica Anestesiologista", ["especializacao"]],
    ["Médico Intensivista", "Médica Intensivista", ["especializacao", "mestrado"]],
    ["Médico Cirurgião Geral", "Médica Cirurgiã Geral", ["especializacao", "doutorado"]],
  ],
  PENF: [
    ["Enfermeiro", "Enfermeira", ["superior", "especializacao", "mestrado"]],
    ["Técnico de Enfermagem", "Técnica de Enfermagem", ["ensino_tecnico", "superior"]],
  ],
  AGAS: [
    ["Psicólogo", "Psicóloga", SUP],
    ["Assistente Social", "Assistente Social", SUP],
    ["Fisioterapeuta", "Fisioterapeuta", SUP],
    ["Nutricionista", "Nutricionista", SUP],
    ["Farmacêutico", "Farmacêutica", SUP],
    ["Analista Administrativo", "Analista Administrativa", SUP],
  ],
  TOS: [
    ["Técnico em Radiologia", "Técnica em Radiologia", ["ensino_tecnico"]],
    ["Técnico de Laboratório", "Técnica de Laboratório", ["ensino_tecnico", "superior"]],
    ["Técnico em Segurança do Trabalho", "Técnica em Segurança do Trabalho", ["ensino_tecnico"]],
  ],
  AUAS: [
    ["Auxiliar Administrativo", "Auxiliar Administrativa", ["ensino_medio", "superior"]],
    ["Auxiliar de Serviços Gerais", "Auxiliar de Serviços Gerais", ["ensino_fundamental", "ensino_medio"]],
    ["Maqueiro", "Maqueira", ["ensino_fundamental", "ensino_medio"]],
  ],
};
const PESO_CARREIRA = ["MED", "MED", "PENF", "PENF", "PENF", "PENF", "AGAS",
  "AGAS", "TOS", "AUAS", "AUAS"];

// ---------------------------------------------------------------- servidores
const funcionais = [];
const usados = new Set();
for (let i = 0; i < QTD_SERVIDORES; i++) {
  const fem = chance(0.6);
  let nome;
  do {
    const s1 = pick(SOBRENOMES);
    let s2;
    do s2 = pick(SOBRENOMES); while (s2 === s1);
    nome = `${pick(fem ? NOMES_F : NOMES_M)} ${s1} ${s2}`;
  } while (usados.has(nome));
  usados.add(nome);

  const carreira = pick(PESO_CARREIRA);
  const [catM, catF, formacoes] = pick(CARREIRAS[carreira]);
  const vinculo = chance(0.4) ? "contrato" : "efetivo";

  let admissao;
  let dataFim = null;
  if (vinculo === "efetivo") {
    admissao = dataAleatoria("1998-01-01", "2024-12-31");
  } else {
    admissao = dataAleatoria("2023-01-01", "2026-09-30");
    // concentra parte dos contratos vencendo nos próximos meses (problema #1)
    dataFim = chance(0.45)
      ? dataAleatoria("2026-11-20", "2027-02-28")
      : dataAleatoria("2027-03-01", "2027-12-31");
  }

  funcionais.push({
    masp: String(91000000 + (i + 1) * 7 + int(0, 6)).padStart(8, "0"),
    nome,
    data_admissao: iso(admissao),
    vinculo,
    data_fim_prevista: dataFim ? iso(dataFim) : null,
    formacao: pick(formacoes),
    carreira,
    categoria_profissional: fem ? catF : catM,
    unidade_lotacao: pick(UNIDADES),
  });
}

// ---------------------------------------------------------------- frequência
// Nov/2025 a Out/2026, só a partir do mês de admissão
const frequencia = [];
for (const s of funcionais) {
  for (let m = 0; m < 12; m++) {
    const mes = new Date(Date.UTC(2025, 10 + m, 1));
    const admMes = new Date(Date.UTC(d(s.data_admissao).getUTCFullYear(),
      d(s.data_admissao).getUTCMonth(), 1));
    if (mes < admMes) continue;
    const plantonista = ["MED", "PENF", "TOS"].includes(s.carreira);
    const faltas = chance(0.8) ? 0 : chance(0.7) ? 1 : int(2, 4);
    const horas = plantonista
      ? (chance(0.35) ? 0 : int(1, 8) * 6)
      : (chance(0.8) ? 0 : int(1, 4) * 4);
    frequencia.push({
      masp: s.masp,
      mes_referencia: iso(mes),
      quantidade_faltas: faltas,
      horas_extras_autorizadas: horas.toFixed(2),
      observacao: faltas === 0 ? null
        : chance(0.6) ? "Falta(s) justificada(s) por atestado" : "Falta(s) sem justificativa",
    });
  }
}

// ---------------------------------------------------------------- férias
const ferias = [];
const periodos = [];
function situacao(inicio, fim) {
  if (fim < HOJE) return "gozada";
  if (inicio <= HOJE) return "em_gozo";
  return "programada";
}
// Segue as regras FER-01, FER-04, FER-07 e FER-08:
//  - efetivo e contratado: 25 dias úteis (FER-01 e FER-03)
//  - primeiras férias só após 11 meses de exercício
//  - no máximo 2 períodos, cada um com pelo menos 10 dias úteis
//  - todos os períodos começam dentro do ano de referência (até o último
//    dia útil); sem acúmulo: 2025 fica todo gozado
for (const s of funcionais) {
  const adm = d(s.data_admissao);
  const elegivel = proximoDiaUtil(addMeses(adm, 11));
  const fimContrato = s.data_fim_prevista ? d(s.data_fim_prevista) : null;

  for (const ano of [2025, 2026]) {
    const ultimoUtil = ultimoDiaUtilDoAno(ano);
    const inicioMin = new Date(Math.max(proximoDiaUtil(d(`${ano}-01-05`)), elegivel));
    if (inicioMin > ultimoUtil) continue; // ainda não completou 11 meses

    const direito = 25;
    ferias.push({ masp: s.masp, ano_referencia: ano, dias_direito: direito,
      observacao: "25 dias úteis" });

    // 2026: ~8% ainda não marcou nada (gera alerta de férias a programar)
    if (ano === 2026 && chance(0.08)) continue;

    let partes = pick([[25], [15, 10], [10, 15], [13, 12]]);
    // pouco tempo até o fim do ano: um período só
    if (partes.length === 2 && (ultimoUtil - inicioMin) / 86400000 < 100) partes = [direito];

    const calcFim = (ini, dias) => fimPorDiasUteis(ini, dias);

    // 1º período
    const limite1 = partes.length === 2 ? addDias(ultimoUtil, -80) : ultimoUtil;
    const ini1 = proximoDiaUtil(dataEntre(inicioMin, limite1));
    const fim1 = calcFim(ini1, partes[0]);
    if (fimContrato && ini1 > fimContrato) continue;
    periodos.push({ masp: s.masp, ano_referencia: ano, data_inicio: iso(ini1),
      data_fim: iso(fim1), dias: partes[0], situacao: situacao(ini1, fim1) });

    // 2º período (em 2026, ~30% ainda não programou)
    if (partes.length === 2) {
      if (ano === 2026 && chance(0.3)) continue;
      let ini2 = proximoDiaUtil(dataEntre(addDias(fim1, 20), ultimoUtil));
      if (ini2 > ultimoUtil) ini2 = ultimoUtil;
      if (fimContrato && ini2 > fimContrato) continue;
      const fim2 = calcFim(ini2, partes[1]);
      periodos.push({ masp: s.masp, ano_referencia: ano, data_inicio: iso(ini2),
        data_fim: iso(fim2), dias: partes[1], situacao: situacao(ini2, fim2) });
    }
  }
}

// ---------------------------------------------------------------- folgas
const folgas = [];
for (const s of funcionais) {
  if (chance(0.3)) continue; // nem todo mundo tem folga
  let saldo = 0;
  const n = int(1, 4);
  for (let k = 0; k < n; k++) {
    const origem = pick(["horas_extras", "plantao_feriado", "plantao_feriado",
      "servico_eleitoral", "outros"]);
    const data = origem === "servico_eleitoral"
      ? d(pick(["2026-10-04", "2026-10-25"]))
      : dataAleatoria("2025-12-01", "2026-10-31");
    if (data < d(s.data_admissao)) continue;
    const dias = origem === "servico_eleitoral" ? 2 : pick([1, 1, 1, 2]);
    folgas.push({
      masp: s.masp, tipo: "credito", dias: dias.toFixed(2), origem,
      data_referencia: iso(data),
      validade: origem === "servico_eleitoral" ? null : iso(addDias(data, 180)),
      descricao: {
        horas_extras: "Conversão de horas extras autorizadas em folga",
        plantao_feriado: "Plantão em feriado",
        servico_eleitoral: "Convocação pela Justiça Eleitoral (dispensa em dobro)",
        outros: "Compensação autorizada pela chefia",
      }[origem],
    });
    saldo += dias;
    // usa parte do saldo (no passado ou agendado)
    if (saldo >= 1 && chance(0.6)) {
      const uso = 1;
      const dataUso = proximoDiaUtil(addDias(data, int(7, 60)));
      folgas.push({
        masp: s.masp, tipo: "debito", dias: uso.toFixed(2), origem: "gozo",
        data_referencia: iso(dataUso), validade: null,
        descricao: dataUso > HOJE ? "Folga agendada" : "Folga usufruída",
      });
      saldo -= uso;
    }
  }
}

// ---------------------------------------------------------------- regras extras
// Complementam as regras do 002_dados_teste.sql. Férias e folgas ficam no
// 003_regras_ferias_folgas.sql; faltas, horas extras e luto/casamento no
// 004_regras_faltas.sql (não repetir códigos FER-, FOL-, FRE-, HEX-, LIC-04/05 aqui).
const regras = [
  ["LIC-03", "Licenças", "Licença para tratamento de saúde",
   "Afastamentos por doença acima do limite definido em norma dependem de perícia médica oficial.",
   "Normas de perícia médica do Estado de MG — a confirmar", "todos", ["licença saúde", "perícia", "doença", "afastamento"]],
  ["CAR-01", "Carreira", "Progressão e promoção",
   "Servidores efetivos avançam na carreira por progressão e promoção, conforme tempo de serviço, avaliação de desempenho e requisitos da carreira.",
   "Lei da carreira da saúde de MG — a confirmar", "efetivo", ["progressão", "promoção", "carreira", "avaliação"]],
  ["CAR-02", "Carreira", "Avaliação de desempenho",
   "O servidor passa por avaliação de desempenho periódica, que pode influenciar progressão e outras vantagens.",
   "Legislação estadual de avaliação de desempenho — a confirmar", "efetivo", ["avaliação", "desempenho", "ADI"]],
  ["CON-02", "Contrato", "Documentos para renovação",
   "Para eventual prorrogação do contrato, mantenha registro profissional e documentos obrigatórios atualizados junto ao RH.",
   "Norma interna — a confirmar", "contrato", ["documentos", "renovação", "prorrogação", "registro"]],
].map(([codigo, tema, titulo, descricao, base_legal, aplica_vinculo, palavras]) => ({
  codigo, tema, titulo, descricao, base_legal, aplica_vinculo,
  palavras_chave: palavras, validado: false,
}));

// ---------------------------------------------------------------- saída CSV
const pgArray = (arr) =>
  `{${arr.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",")}}`;

function celulaCsv(v) {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) v = pgArray(v);
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function csv(linhas, colunas) {
  return [colunas.join(","), ...linhas.map((l) => colunas.map((c) => celulaCsv(l[c])).join(","))]
    .join("\n") + "\n";
}

// ---------------------------------------------------------------- saída SQL
function literal(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return `array[${v.map(literal).join(", ")}]`;
  return `'${String(v).replace(/'/g, "''")}'`;
}
function sqlInsert(tabela, linhas, colunas) {
  if (!linhas.length) return "";
  const valores = linhas.map((l) => `  (${colunas.map((c) => literal(l[c])).join(", ")})`);
  return `insert into public.${tabela} (${colunas.join(", ")}) values\n${valores.join(",\n")};\n`;
}

const TABELAS = [
  ["01_dados_funcionais", "dados_funcionais", funcionais,
    ["masp", "nome", "data_admissao", "vinculo", "data_fim_prevista", "formacao",
     "carreira", "categoria_profissional", "unidade_lotacao"]],
  ["02_dados_frequencia", "dados_frequencia", frequencia,
    ["masp", "mes_referencia", "quantidade_faltas", "horas_extras_autorizadas", "observacao"]],
  ["03_dados_ferias", "dados_ferias", ferias,
    ["masp", "ano_referencia", "dias_direito", "observacao"]],
  ["04_dados_ferias_periodos", "dados_ferias_periodos", periodos,
    ["masp", "ano_referencia", "data_inicio", "data_fim", "dias", "situacao"]],
  ["05_dados_folgas", "dados_folgas", folgas,
    ["masp", "tipo", "dias", "origem", "data_referencia", "validade", "descricao"]],
  ["06_dados_regras_rh", "dados_regras_rh", regras,
    ["codigo", "tema", "titulo", "descricao", "base_legal", "aplica_vinculo",
     "palavras_chave", "validado"]],
];

mkdirSync(SAIDA, { recursive: true });
let sql = `-- DADOS FICTÍCIOS gerados por scripts/gerar-dados-ficticios.mjs
-- Alternativa à importação dos CSVs: cole no SQL Editor e execute.
-- Requer 001_initial_schema.sql. Pode ser usado com ou sem 002_dados_teste.sql.
begin;\n\n`;
for (const [arquivo, tabela, linhas, colunas] of TABELAS) {
  writeFileSync(join(SAIDA, `${arquivo}.csv`), csv(linhas, colunas), "utf8");
  sql += sqlInsert(tabela, linhas, colunas) + "\n";
  console.log(`${arquivo}.csv  ${String(linhas.length).padStart(4)} linhas`);
}
sql += "commit;\n";
writeFileSync(join(SAIDA, "dados_ficticios.sql"), sql, "utf8");
console.log("dados_ficticios.sql");

// Recarga de férias e folgas para quem JÁ importou os dados fictícios antigos.
// Apaga só os MASPs fictícios "91…" e refaz os períodos do 002 (MASPs "9000…").
let recarga = `-- RECARGA de férias e folgas fictícias (gerado por scripts/gerar-dados-ficticios.mjs)
-- Use se você JÁ importou os dados fictícios: substitui férias, períodos e folgas
-- dos MASPs 91… pelos novos (que seguem as regras do 003) e corrige o 002.
-- Cadastro, frequência e regras não são alterados.
begin;

delete from public.dados_folgas where masp like '91%';
delete from public.dados_ferias where masp like '91%'; -- apaga os períodos em cascata

`;
recarga += sqlInsert("dados_ferias", ferias, ["masp", "ano_referencia", "dias_direito", "observacao"]) + "\n";
recarga += sqlInsert("dados_ferias_periodos", periodos,
  ["masp", "ano_referencia", "data_inicio", "data_fim", "dias", "situacao"]) + "\n";
recarga += sqlInsert("dados_folgas", folgas,
  ["masp", "tipo", "dias", "origem", "data_referencia", "validade", "descricao"]) + "\n";
recarga += `-- Correções do 002_dados_teste.sql (sem efeito se o 002 não foi usado):
-- todos com 25 dias úteis (efetivos e contratados) e períodos dentro das regras.
update public.dados_ferias set dias_direito = 25
  where masp in ('90000011', '90000045') and ano_referencia = 2026;
delete from public.dados_ferias_periodos
  where masp in ('90000011', '90000029', '90000037', '90000053');
insert into public.dados_ferias_periodos
  (masp, ano_referencia, data_inicio, data_fim, dias, situacao)
select v.masp, v.ano, v.ini::date, v.fim::date, v.dias, v.sit
from (values
  ('90000011', 2026, '2026-07-06', '2026-07-24', 15, 'gozada'),
  ('90000011', 2026, '2026-12-07', '2026-12-18', 10, 'programada'),
  ('90000029', 2026, '2026-04-06', '2026-04-17', 10, 'gozada'),
  ('90000029', 2026, '2026-12-07', '2026-12-28', 15, 'programada'),
  ('90000037', 2026, '2026-02-02', '2026-03-06', 25, 'gozada'),
  ('90000053', 2026, '2026-11-09', '2026-11-30', 15, 'em_gozo')
) as v(masp, ano, ini, fim, dias, sit)
where exists (select 1 from public.dados_ferias f
              where f.masp = v.masp and f.ano_referencia = v.ano);

commit;
`;
writeFileSync(join(SAIDA, "recarregar_ferias_folgas.sql"), recarga, "utf8");
console.log("recarregar_ferias_folgas.sql");
