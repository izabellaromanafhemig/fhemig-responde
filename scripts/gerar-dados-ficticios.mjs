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
const fimDeSemana = (dt) => [0, 6].includes(dt.getUTCDay());
function proximoDiaUtil(dt) {
  let x = dt;
  while (fimDeSemana(x)) x = addDias(x, 1);
  return x;
}
/** Data final contando `n` dias úteis a partir de `inicio` (inclusive). */
function fimPorDiasUteis(inicio, n) {
  let x = inicio;
  let contados = fimDeSemana(x) ? 0 : 1;
  while (contados < n) {
    x = addDias(x, 1);
    if (!fimDeSemana(x)) contados++;
  }
  return x;
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
for (const s of funcionais) {
  const efetivo = s.vinculo === "efetivo";
  const adm = d(s.data_admissao);
  for (const ano of [2025, 2026]) {
    if (adm.getUTCFullYear() > ano) continue;
    // direito: efetivo 25 dias úteis; contrato 30 corridos (proporcional no 1º ano)
    let direito = efetivo ? 25 : 30;
    if (!efetivo && adm.getUTCFullYear() === ano) {
      const meses = 12 - adm.getUTCMonth();
      direito = Math.max(0, Math.round((30 * meses) / 12));
    }
    if (direito === 0) continue;
    ferias.push({ masp: s.masp, ano_referencia: ano, dias_direito: direito,
      observacao: efetivo ? "25 dias úteis" : "30 dias corridos" });

    // divide o direito em 1 a 3 períodos; parte fica sem programar
    const partes = direito >= 20 ? pick([[direito], [15, direito - 15],
      [10, 10, direito - 20]]) : [direito];
    let cursor = d(`${ano}-${pick(["02", "04", "06", "07", "09"])}-01`);
    if (cursor < adm) cursor = addDias(adm, 60);
    const limite = ano === 2025 ? d("2026-03-31") : d("2027-03-31");

    partes.forEach((dias, idx) => {
      // em 2026, ~30% deixa o último período sem programar ainda
      if (ano === 2026 && idx === partes.length - 1 && partes.length > 1 && chance(0.3)) return;
      cursor = addDias(cursor, int(20, 90));
      const ini = proximoDiaUtil(cursor);
      const fim = efetivo ? fimPorDiasUteis(ini, dias) : addDias(ini, dias - 1);
      if (fim > limite) return;
      cursor = fim;
      const sit = chance(0.06) && ini > HOJE ? "cancelada" : situacao(ini, fim);
      periodos.push({ masp: s.masp, ano_referencia: ano, data_inicio: iso(ini),
        data_fim: iso(fim), dias, situacao: sit });
    });
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
// Complementam as 14 regras do 002_dados_teste.sql (códigos diferentes).
const regras = [
  ["FER-05", "Férias", "Parcelamento de férias",
   "As férias podem ser divididas em períodos, conforme as regras do órgão e a necessidade do serviço, com autorização da chefia.",
   "Norma interna — a confirmar", "todos", ["parcelar", "dividir", "períodos", "férias"]],
  ["FER-06", "Férias", "Férias ao fim do contrato",
   "No encerramento do contrato temporário, os dias de férias não gozados são indenizados de forma proporcional, com o adicional de 1/3.",
   "Lei Estadual nº 23.750/2020 — a confirmar", "contrato", ["indenização", "proporcional", "fim do contrato", "férias"]],
  ["FOL-03", "Folgas", "Prazo para usar folga compensativa",
   "Créditos de folga compensativa podem ter prazo de validade. Consulte a validade no seu extrato de folgas e agende com a chefia antes do vencimento.",
   "Norma interna — a confirmar", "todos", ["validade", "prazo", "vencer", "folga"]],
  ["FRE-03", "Frequência", "Registro de ponto",
   "A frequência é registrada diariamente. Esquecimentos ou erros de marcação devem ser justificados à chefia imediata no próprio mês.",
   "Norma interna — a confirmar", "todos", ["ponto", "marcação", "esquecimento", "frequência"]],
  ["FRE-04", "Frequência", "Atraso e saída antecipada",
   "Atrasos e saídas antecipadas sem compensação autorizada podem gerar desconto proporcional na remuneração.",
   "Estatuto (Lei Estadual nº 869/1952) — artigo a confirmar", "todos", ["atraso", "saída antecipada", "desconto"]],
  ["HEX-02", "Horas extras", "Limite de horas extras",
   "A realização de horas extras é excepcional e limitada pela legislação e por normas internas. Consulte a chefia antes de realizar plantões extras.",
   "Norma interna — a confirmar", "todos", ["limite", "hora extra", "plantão extra"]],
  ["LIC-03", "Licenças", "Licença para tratamento de saúde",
   "Afastamentos por doença acima do limite definido em norma dependem de perícia médica oficial.",
   "Normas de perícia médica do Estado de MG — a confirmar", "todos", ["licença saúde", "perícia", "doença", "afastamento"]],
  ["LIC-04", "Licenças", "Falecimento de familiar (nojo)",
   "O servidor tem direito a dispensa por alguns dias consecutivos em caso de falecimento de familiar próximo.",
   "Estatuto (Lei Estadual nº 869/1952) — prazo a confirmar", "todos", ["falecimento", "nojo", "luto", "família"]],
  ["LIC-05", "Licenças", "Casamento (gala)",
   "O servidor tem direito a dispensa por alguns dias consecutivos em razão de casamento.",
   "Estatuto (Lei Estadual nº 869/1952) — prazo a confirmar", "todos", ["casamento", "gala", "dispensa"]],
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
