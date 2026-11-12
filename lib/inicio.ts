/**
 * Regras da página de início: datas no fuso de Brasília e alertas.
 * Funções puras (sem Supabase) para facilitar os testes.
 */

export const DIAS_ALERTA_CONTRATO = 90;
export const DIAS_ALERTA_FOLGA = 30;

/** "AAAA-MM-DD" de hoje no fuso de Brasília. */
export function hojeBrasilia(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(agora);
}

/** Dias entre duas datas "AAAA-MM-DD" (b − a). */
export function diasEntre(a: string, b: string): number {
  const ms = Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** "2027-02-07" -> "07/02/2027" (sem conversão de fuso). */
export function dataBr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split("-");
  return a && m && d ? `${d}/${m}/${a}` : null;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
  "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "2026-10-01" -> "outubro/2026" */
export function mesAnoBr(iso: string): string {
  const [a, m] = iso.slice(0, 10).split("-");
  return `${MESES[Number(m) - 1]}/${a}`;
}

export const plural = (n: number, um: string, varios: string) =>
  `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;

export type Alerta = { id: string; texto: string; pergunta: string };

export type DadosAlertas = {
  hoje: string;
  vinculo?: string | null;
  dataFimPrevista?: string | null;
  anoFerias?: number;
  diasAProgramar?: number | null;
  saldoFolgas?: number | null;
  validadesCreditosFolga?: (string | null)[];
};

export function montarAlertas(d: DadosAlertas): Alerta[] {
  const alertas: Alerta[] = [];

  if (d.vinculo === "contrato" && d.dataFimPrevista) {
    const faltam = diasEntre(d.hoje, d.dataFimPrevista);
    if (faltam >= 0 && faltam <= DIAS_ALERTA_CONTRATO) {
      alertas.push({
        id: "contrato",
        texto:
          faltam === 0
            ? "Seu contrato termina hoje."
            : `Seu contrato termina em ${dataBr(d.dataFimPrevista)} (faltam ${plural(faltam, "dia", "dias")}).`,
        pergunta: "Meu contrato está terminando. O que preciso saber sobre o fim do contrato e a prorrogação?",
      });
    }
  }

  if (d.anoFerias && d.diasAProgramar && d.diasAProgramar > 0) {
    alertas.push({
      id: "ferias",
      texto: `Você ainda tem ${plural(d.diasAProgramar, "dia", "dias")} de férias de ${d.anoFerias} para programar.`,
      pergunta: `Quantos dias de férias de ${d.anoFerias} ainda preciso programar e como faço isso?`,
    });
  }

  if (d.saldoFolgas && d.saldoFolgas > 0) {
    const vencendo = (d.validadesCreditosFolga ?? [])
      .filter((v): v is string => Boolean(v))
      .map((v) => ({ v, dias: diasEntre(d.hoje, v) }))
      .filter((x) => x.dias >= 0 && x.dias <= DIAS_ALERTA_FOLGA)
      .sort((a, b) => a.dias - b.dias)[0];
    if (vencendo) {
      alertas.push({
        id: "folga",
        texto: `Você tem folga compensativa com validade até ${dataBr(vencendo.v)}. Agende com a sua chefia.`,
        pergunta: "Tenho folga compensativa perto de vencer. Qual meu saldo e como agendar?",
      });
    }
  }

  return alertas;
}

/** Link para o chat com a pergunta já preenchida. */
export function linkChat(pergunta: string): string {
  return `/chat?pergunta=${encodeURIComponent(pergunta)}`;
}
