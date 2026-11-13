import { Badge } from "@/components/ui/badge";
import { dataBr, hojeBrasilia, mesAnoBr, plural } from "@/lib/inicio";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = { title: "Meus extratos | Fhemigo Responde" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const ABAS = [
  { id: "ferias", rotulo: "Férias" },
  { id: "folgas", rotulo: "Folgas compensatórias" },
  { id: "frequencia", rotulo: "Frequência" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

// ---------------------------------------------------------------- tipos
type SaldoFerias = {
  ano_referencia: number;
  dias_direito: number;
  dias_tirados: number;
  dias_programados: number;
  dias_restantes: number;
  dias_a_programar: number;
};
type Periodo = {
  ano_referencia: number;
  data_inicio: string;
  data_fim: string;
  dias: number;
  situacao: "programada" | "em_gozo" | "gozada" | "cancelada";
};
type Folga = {
  id: number;
  tipo: "credito" | "debito";
  dias: number | string;
  origem: string;
  data_referencia: string;
  validade: string | null;
  descricao: string | null;
};
type Frequencia = {
  mes_referencia: string;
  quantidade_faltas: number;
  horas_extras_autorizadas: number | string;
  observacao: string | null;
};

const SITUACAO: Record<
  Periodo["situacao"],
  { rotulo: string; variante: "default" | "secondary" | "outline" }
> = {
  programada: { rotulo: "Programada", variante: "outline" },
  em_gozo: { rotulo: "Em andamento", variante: "default" },
  gozada: { rotulo: "Concluída", variante: "secondary" },
  cancelada: { rotulo: "Cancelada", variante: "outline" },
};

const ORIGEM: Record<string, string> = {
  horas_extras: "Horas extras",
  plantao_feriado: "Plantão em feriado",
  servico_eleitoral: "Serviço eleitoral",
  gozo: "Folga usufruída",
  outros: "Outros",
};

const num = (v: number | string) => Number(v).toLocaleString("pt-BR");

// ---------------------------------------------------------------- página
export default function ExtratosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Meus extratos</h1>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Carregando...</p>
        }
      >
        <Extratos searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Extratos({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const abaParam = Array.isArray(params.aba) ? params.aba[0] : params.aba;
  const aba: Aba = ABAS.some((a) => a.id === abaParam)
    ? (abaParam as Aba)
    : "ferias";

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");

  return (
    <>
      <nav
        aria-label="Tipo de extrato"
        className="-mb-2 flex flex-wrap gap-1 border-b"
      >
        {ABAS.map((a) => (
          <Link
            key={a.id}
            href={`/extratos?aba=${a.id}`}
            aria-current={aba === a.id ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
              aba === a.id
                ? "border-primary font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {a.rotulo}
          </Link>
        ))}
      </nav>

      {aba === "ferias" && <ExtratoFerias />}
      {aba === "folgas" && <ExtratoFolgas />}
      {aba === "frequencia" && <ExtratoFrequencia />}

      <p className="text-sm text-muted-foreground">
        Encontrou algum dado errado? Procure o RH da sua unidade.
      </p>
    </>
  );
}

function Erro() {
  return (
    <p className="text-sm text-destructive">
      Não foi possível carregar o extrato. Tente novamente mais tarde.
    </p>
  );
}

// ---------------------------------------------------------------- férias
async function ExtratoFerias() {
  const supabase = await createClient();
  // RLS: só os dados do próprio servidor
  const [saldosR, periodosR] = await Promise.all([
    supabase
      .from("vw_saldo_ferias")
      .select(
        "ano_referencia, dias_direito, dias_tirados, dias_programados, dias_restantes, dias_a_programar",
      )
      .order("ano_referencia", { ascending: false }),
    supabase
      .from("dados_ferias_periodos")
      .select("ano_referencia, data_inicio, data_fim, dias, situacao")
      .order("data_inicio", { ascending: true }),
  ]);
  if (saldosR.error || periodosR.error) return <Erro />;

  const saldos = saldosR.data as SaldoFerias[];
  const periodos = periodosR.data as Periodo[];
  if (saldos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum registro de férias.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {saldos.map((s) => {
        const doAno = periodos.filter(
          (p) => p.ano_referencia === s.ano_referencia,
        );
        return (
          <section
            key={s.ano_referencia}
            aria-labelledby={`ferias-${s.ano_referencia}`}
            className="flex flex-col gap-3 rounded-lg border p-4"
          >
            <h2
              id={`ferias-${s.ano_referencia}`}
              className="text-lg font-semibold"
            >
              Férias {s.ano_referencia}
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Numero
                rotulo="Direito"
                valor={plural(s.dias_direito, "dia útil", "dias úteis")}
              />
              <Numero
                rotulo="Já tirados"
                valor={plural(s.dias_tirados, "dia", "dias")}
              />
              <Numero
                rotulo="Programados"
                valor={plural(s.dias_programados, "dia", "dias")}
              />
              <Numero
                rotulo="Ainda a programar"
                valor={plural(s.dias_a_programar, "dia", "dias")}
                destaque={s.dias_a_programar > 0}
              />
            </dl>
            {doAno.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum período marcado.
              </p>
            ) : (
              <Tabela
                legenda={`Períodos de férias de ${s.ano_referencia}`}
                colunas={["Início", "Fim", "Dias úteis", "Situação"]}
                alinharDireita={[2]}
              >
                {doAno.map((p) => (
                  <tr key={p.data_inicio}>
                    <td className="px-3 py-2">{dataBr(p.data_inicio)}</td>
                    <td className="px-3 py-2">{dataBr(p.data_fim)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {p.dias}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={SITUACAO[p.situacao].variante}>
                        {SITUACAO[p.situacao].rotulo}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </Tabela>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- folgas
async function ExtratoFolgas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dados_folgas")
    .select("id, tipo, dias, origem, data_referencia, validade, descricao")
    .order("data_referencia", { ascending: true })
    .order("id", { ascending: true });
  if (error) return <Erro />;

  const lancamentos = data as Folga[];
  if (lancamentos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum lançamento de folga compensatória.
      </p>
    );
  }

  // saldo acumulado em ordem cronológica; exibição do mais recente para o mais antigo
  let saldo = 0;
  const comSaldo = lancamentos.map((l) => {
    saldo += (l.tipo === "credito" ? 1 : -1) * Number(l.dias);
    return { ...l, saldo };
  });
  const creditos = lancamentos
    .filter((l) => l.tipo === "credito")
    .reduce((a, l) => a + Number(l.dias), 0);
  const debitos = lancamentos
    .filter((l) => l.tipo === "debito")
    .reduce((a, l) => a + Number(l.dias), 0);
  const hoje = hojeBrasilia();

  return (
    <section
      aria-label="Extrato de folgas compensatórias"
      className="flex flex-col gap-4"
    >
      <dl className="grid grid-cols-3 gap-3">
        <Numero rotulo="Créditos" valor={`${num(creditos)} dias`} />
        <Numero rotulo="Usadas ou agendadas" valor={`${num(debitos)} dias`} />
        <Numero
          rotulo="Saldo atual"
          valor={`${num(saldo)} dias`}
          destaque={saldo > 0}
        />
      </dl>
      <Tabela
        legenda="Lançamentos de folga, do mais recente para o mais antigo"
        colunas={["Data", "Lançamento", "Dias", "Validade", "Saldo"]}
        alinharDireita={[2, 4]}
      >
        {[...comSaldo].reverse().map((l) => {
          const futura = l.tipo === "debito" && l.data_referencia > hoje;
          return (
            <tr key={l.id}>
              <td className="px-3 py-2 whitespace-nowrap">
                {dataBr(l.data_referencia)}
              </td>
              <td className="px-3 py-2">
                <span className="font-medium">
                  {l.tipo === "credito"
                    ? (ORIGEM[l.origem] ?? l.origem)
                    : futura
                      ? "Folga agendada"
                      : "Folga usufruída"}
                </span>
                {l.descricao && (
                  <span className="block text-xs text-muted-foreground">
                    {l.descricao}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-right font-medium whitespace-nowrap tabular-nums">
                {l.tipo === "credito" ? "+" : "−"}
                {num(l.dias)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {l.validade ? dataBr(l.validade) : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {num(l.saldo)}
              </td>
            </tr>
          );
        })}
      </Tabela>
    </section>
  );
}

// ---------------------------------------------------------------- frequência
async function ExtratoFrequencia() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dados_frequencia")
    .select(
      "mes_referencia, quantidade_faltas, horas_extras_autorizadas, observacao",
    )
    .order("mes_referencia", { ascending: false });
  if (error) return <Erro />;

  const meses = data as Frequencia[];
  if (meses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum registro de frequência.
      </p>
    );
  }
  const faltas = meses.reduce((a, m) => a + m.quantidade_faltas, 0);
  const horas = meses.reduce(
    (a, m) => a + Number(m.horas_extras_autorizadas),
    0,
  );

  return (
    <section aria-label="Extrato de frequência" className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-3">
        <Numero rotulo="Meses registrados" valor={meses.length} />
        <Numero rotulo="Faltas no período" valor={faltas} />
        <Numero rotulo="Horas extras autorizadas" valor={`${num(horas)} h`} />
      </dl>
      <Tabela
        legenda="Frequência mês a mês, do mais recente para o mais antigo"
        colunas={["Mês", "Faltas", "Horas extras", "Observação"]}
        alinharDireita={[1, 2]}
      >
        {meses.map((m) => (
          <tr key={m.mes_referencia}>
            <td className="px-3 py-2 whitespace-nowrap capitalize">
              {mesAnoBr(m.mes_referencia)}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {m.quantidade_faltas}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {num(m.horas_extras_autorizadas)} h
            </td>
            <td className="px-3 py-2 text-muted-foreground">
              {m.observacao ?? "—"}
            </td>
          </tr>
        ))}
      </Tabela>
    </section>
  );
}

// ---------------------------------------------------------------- blocos
function Numero({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string | number;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3",
        destaque && "border-primary",
      )}
    >
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="text-lg font-bold tabular-nums">{valor}</dd>
    </div>
  );
}

function Tabela({
  legenda,
  colunas,
  alinharDireita = [],
  children,
}: {
  legenda: string;
  colunas: string[];
  alinharDireita?: number[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <caption className="sr-only">{legenda}</caption>
        <thead className="bg-muted/60 text-left text-muted-foreground">
          <tr>
            {colunas.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={cn(
                  "px-3 py-2 font-medium",
                  alinharDireita.includes(i) && "text-right",
                )}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}
