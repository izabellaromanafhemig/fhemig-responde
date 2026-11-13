import { Mascote } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  dataBr,
  hojeBrasilia,
  linkChat,
  mesAnoBr,
  montarAlertas,
  plural,
  type Alerta,
} from "@/lib/inicio";
import { createClient } from "@/lib/supabase/server";
import {
  BellRing,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardList,
  Palmtree,
  SendHorizonal,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

// ---------------------------------------------------------------- tipos
type Funcionais = {
  nome: string;
  vinculo: "efetivo" | "contrato";
  data_fim_prevista: string | null;
  categoria_profissional: string;
  unidade_lotacao: string | null;
  data_admissao: string;
};
type SaldoFerias = {
  ano_referencia: number;
  dias_direito: number;
  dias_tirados: number;
  dias_restantes: number;
  dias_a_programar: number;
  proximo_periodo_inicio: string | null;
};
type SaldoFolgas = { saldo_dias: number | string; proxima_folga: string | null };
type Frequencia = {
  mes_referencia: string;
  quantidade_faltas: number;
  horas_extras_autorizadas: number | string;
};

// ---------------------------------------------------------------- página
export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
        <Inicio />
      </Suspense>
    </div>
  );
}

async function Inicio() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return <BoasVindasVisitante />;

  const hoje = hojeBrasilia();
  const ano = Number(hoje.slice(0, 4));

  // RLS: todas as consultas devolvem só as linhas do servidor logado
  const [funcionais, ferias, folgas, frequencia, creditos] = await Promise.all([
    supabase
      .from("dados_funcionais")
      .select("nome, vinculo, data_fim_prevista, categoria_profissional, unidade_lotacao, data_admissao")
      .maybeSingle(),
    supabase.from("vw_saldo_ferias").select("*").eq("ano_referencia", ano).maybeSingle(),
    supabase.from("vw_saldo_folgas").select("saldo_dias, proxima_folga").maybeSingle(),
    supabase
      .from("dados_frequencia")
      .select("mes_referencia, quantidade_faltas, horas_extras_autorizadas")
      .order("mes_referencia", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("dados_folgas").select("validade").eq("tipo", "credito").gte("validade", hoje),
  ]);

  const f = funcionais.data as Funcionais | null;
  const sf = ferias.data as SaldoFerias | null;
  const sg = folgas.data as SaldoFolgas | null;
  const fr = frequencia.data as Frequencia | null;
  const saldoFolgas = sg ? Number(sg.saldo_dias) : null;

  const alertas = montarAlertas({
    hoje,
    vinculo: f?.vinculo,
    dataFimPrevista: f?.data_fim_prevista,
    anoFerias: sf ? ano : undefined,
    diasAProgramar: sf?.dias_a_programar,
    saldoFolgas,
    validadesCreditosFolga: (creditos.data ?? []).map((c) => c.validade as string | null),
  });

  const primeiroNome = f?.nome?.trim().split(/\s+/)[0];

  return (
    <>
      <Saudacao nome={primeiroNome} />

      {alertas.length > 0 && <Alertas alertas={alertas} />}

      <section aria-labelledby="resumo" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="resumo" className="text-lg font-semibold">
            Seu resumo
          </h2>
          <Link
            href="/extratos"
            className="text-sm font-medium text-brand-strong underline-offset-4 hover:underline"
          >
            Ver extratos completos
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CartaoResumo
            icone={<Palmtree className="h-5 w-5" />}
            titulo={`Férias ${ano}`}
          >
            {sf ? (
              <>
                <Destaque>
                  {sf.dias_restantes}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}de {sf.dias_direito} dias
                  </span>
                </Destaque>
                <p>restantes no ano</p>
                <p>
                  {sf.proximo_periodo_inicio
                    ? `Próximas férias: ${dataBr(sf.proximo_periodo_inicio)}`
                    : "Nenhum período futuro marcado"}
                </p>
              </>
            ) : (
              <SemDados />
            )}
          </CartaoResumo>

          <CartaoResumo
            icone={<CalendarCheck className="h-5 w-5" />}
            titulo="Folgas compensativas"
          >
            {saldoFolgas !== null ? (
              <>
                <Destaque>
                  {saldoFolgas.toLocaleString("pt-BR")}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}{saldoFolgas === 1 ? "dia" : "dias"}
                  </span>
                </Destaque>
                <p>de saldo disponível</p>
                <p>
                  {sg?.proxima_folga
                    ? `Próxima folga: ${dataBr(sg.proxima_folga)}`
                    : "Nenhuma folga agendada"}
                </p>
              </>
            ) : (
              <SemDados texto="Nenhum lançamento de folga" />
            )}
          </CartaoResumo>

          <CartaoResumo
            icone={<ClipboardList className="h-5 w-5" />}
            titulo="Frequência"
          >
            {fr ? (
              <>
                <Destaque>
                  {fr.quantidade_faltas}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}{fr.quantidade_faltas === 1 ? "falta" : "faltas"}
                  </span>
                </Destaque>
                <p>em {mesAnoBr(fr.mes_referencia)}</p>
                <p>
                  {plural(Number(fr.horas_extras_autorizadas), "hora extra autorizada", "horas extras autorizadas")}
                </p>
              </>
            ) : (
              <SemDados />
            )}
          </CartaoResumo>

          <CartaoResumo
            icone={<BriefcaseBusiness className="h-5 w-5" />}
            titulo="Meu vínculo"
          >
            {f ? (
              <>
                <Destaque>{f.vinculo === "contrato" ? "Contrato" : "Efetivo"}</Destaque>
                <p>
                  {f.vinculo === "contrato" && f.data_fim_prevista
                    ? `Término previsto: ${dataBr(f.data_fim_prevista)}`
                    : `Desde ${dataBr(f.data_admissao)}`}
                </p>
                <p>
                  {f.categoria_profissional}
                  {f.unidade_lotacao ? ` · ${f.unidade_lotacao}` : ""}
                </p>
              </>
            ) : (
              <SemDados texto="Cadastro funcional não encontrado" />
            )}
          </CartaoResumo>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------- blocos
function Saudacao({ nome }: { nome?: string }) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-xl border bg-secondary/60 p-5 sm:flex-row sm:p-6">
      <Mascote size={96} priority className="sm:order-2 sm:ml-auto" />
      <div className="flex w-full flex-col gap-3 sm:order-1 sm:max-w-xl">
        <div>
          <h1 className="text-2xl font-bold">
            {nome ? `Olá, ${nome}!` : "Olá!"}
          </h1>
          <p className="text-muted-foreground">
            Eu sou o Fhemigo. Como posso ajudar hoje?
          </p>
        </div>
        <form action="/chat" method="get" className="flex gap-2">
          <label htmlFor="pergunta-inicio" className="sr-only">
            Sua pergunta
          </label>
          <Input
            id="pergunta-inicio"
            name="pergunta"
            required
            maxLength={4000}
            placeholder="Ex.: Quantos dias de férias ainda tenho?"
            className="bg-background"
          />
          <Button type="submit" aria-label="Perguntar ao Fhemigo">
            <SendHorizonal className="h-4 w-4" />
            <span className="hidden sm:inline">Perguntar</span>
          </Button>
        </form>
      </div>
    </section>
  );
}

function Alertas({ alertas }: { alertas: Alerta[] }) {
  return (
    <section aria-labelledby="avisos" className="flex flex-col gap-3">
      <h2 id="avisos" className="text-lg font-semibold">
        Avisos para você
      </h2>
      <ul className="flex flex-col gap-2">
        {alertas.map((a) => (
          <li
            key={a.id}
            className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
          >
            <span className="flex items-start gap-2">
              <BellRing className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {a.texto}
            </span>
            <Link
              href={linkChat(a.pergunta)}
              className="font-medium whitespace-nowrap underline underline-offset-4 sm:ml-auto"
            >
              Perguntar ao Fhemigo
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CartaoResumo({
  icone,
  titulo,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-brand-strong" aria-hidden>
          {icone}
        </span>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-1 text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

function Destaque({ children }: { children: React.ReactNode }) {
  return <p className="text-3xl font-bold text-foreground">{children}</p>;
}

function SemDados({ texto = "Sem registros" }: { texto?: string }) {
  return <p className="py-2">{texto}</p>;
}

function BoasVindasVisitante() {
  return (
    <section className="m-auto flex max-w-lg flex-col items-center gap-5 py-8 text-center">
      <Mascote size={160} priority />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Fhemigo Responde</h1>
        <p className="text-muted-foreground">
          O assistente de RH dos servidores da FHEMIG. Consulte férias, folgas,
          frequência e regras de RH em um só lugar, a qualquer hora.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/auth/login">Entrar</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/sign-up">Cadastrar</Link>
        </Button>
      </div>
    </section>
  );
}
