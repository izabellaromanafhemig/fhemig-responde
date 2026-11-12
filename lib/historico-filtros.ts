/**
 * Filtros da página de histórico (vindos da URL: ?busca=&de=&ate=).
 * - busca: palavras separadas por espaço; todas precisam aparecer na pergunta
 *   ou na resposta. Ignora maiúsculas/minúsculas e acentos ("ferias" acha "férias").
 * - de / ate: datas AAAA-MM-DD, no fuso de Brasília, inclusivas.
 */

export type FiltrosHistorico = {
  busca: string;
  termos: string[];
  de: string;
  ate: string;
  /** Limites em ISO (UTC) para consultar created_at, ou null. */
  inicioIso: string | null;
  fimExclusivoIso: string | null;
  erro: string | null;
};

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const FUSO_BRASILIA = "-03:00"; // Brasil sem horário de verão desde 2019

export function normalizarTexto(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function primeiro(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

function dataValida(s: string): boolean {
  if (!DATA_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function diaSeguinte(s: string): string {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function lerFiltros(
  params: Record<string, string | string[] | undefined>,
): FiltrosHistorico {
  const busca = primeiro(params.busca).slice(0, 200);
  let de = primeiro(params.de);
  let ate = primeiro(params.ate);
  let erro: string | null = null;

  if (de && !dataValida(de)) {
    erro = "Data inicial inválida.";
    de = "";
  }
  if (ate && !dataValida(ate)) {
    erro = "Data final inválida.";
    ate = "";
  }
  if (de && ate && de > ate) {
    erro = "A data inicial é maior que a final; as datas foram invertidas.";
    [de, ate] = [ate, de];
  }

  const termos = normalizarTexto(busca)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 10);

  return {
    busca,
    termos,
    de,
    ate,
    inicioIso: de ? new Date(`${de}T00:00:00${FUSO_BRASILIA}`).toISOString() : null,
    fimExclusivoIso: ate
      ? new Date(`${diaSeguinte(ate)}T00:00:00${FUSO_BRASILIA}`).toISOString()
      : null,
    erro,
  };
}

export function correspondeBusca(
  termos: string[],
  ...textos: (string | null | undefined)[]
): boolean {
  if (termos.length === 0) return true;
  const alvo = normalizarTexto(textos.filter(Boolean).join(" "));
  return termos.every((t) => alvo.includes(t));
}
