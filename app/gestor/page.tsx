import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  OrientacoesGestor,
  type Orientacao,
} from "@/components/orientacoes-gestor";
import { RevisaoAvaliacao } from "@/components/revisao-avaliacao";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { Lock, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = { title: "Painel do gestor | Fhemigo Responde" };

const LIMITE_LISTA = 100;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Resumo = {
  perguntas: number;
  respondidas: number;
  sem_resposta: number;
  avaliadas: number;
  positivas: number;
  negativas: number;
  negativas_pendentes: number;
  servidores: number;
};
type Item = {
  id: string;
  perguntada_em: string;
  avaliada_em: string | null;
  pergunta: string;
  resposta: string | null;
  status: string;
  avaliacao: 1 | -1 | null;
  comentario_avaliacao: string | null;
  revisada_em: string | null;
  revisada_por: string | null;
  nota_revisao: string | null;
};

const ABAS = [
  { tipo: "pendentes", rotulo: "👎 A revisar" },
  { tipo: "revisadas", rotulo: "👎 Revisadas" },
  { tipo: "positivas", rotulo: "👍 Úteis" },
  { tipo: "sem_resposta", rotulo: "Sem resposta" },
] as const;
type Tipo = (typeof ABAS)[number]["tipo"];
type Aba = "respostas" | "orientacoes";

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const pct = (parte: number, total: number) =>
  total > 0 ? `${Math.round((100 * parte) / total)}%` : "—";

// ---------------------------------------------------------------- página
export default function GestorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Carregando...</p>
        }
      >
        <Painel searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Painel({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");

  const { data: gestor } = await supabase.rpc("eh_gestor");
  if (!gestor) return <AcessoRestrito />;

  // Sem filtro de período: considera todo o histórico
  const inicio = "2000-01-01T00:00:00Z";
  const fim = new Date(Date.now() + 86_400_000).toISOString();
  const tipoParam = Array.isArray(params.tipo) ? params.tipo[0] : params.tipo;
  const tipo: Tipo = ABAS.some((a) => a.tipo === tipoParam)
    ? (tipoParam as Tipo)
    : "pendentes";
  const abaParam = Array.isArray(params.aba) ? params.aba[0] : params.aba;
  const aba: Aba = abaParam === "orientacoes" ? "orientacoes" : "respostas";
  const vazio = { data: [], error: null };

  // Resumo e orientações alimentam os contadores das duas abas;
  // a lista só é buscada na aba de respostas.
  const [resumoR, orientacoesR, itensR] = await Promise.all([
    supabase.rpc("painel_resumo", { p_inicio: inicio, p_fim: fim }),
    supabase.rpc("painel_orientacoes"),
    aba === "respostas"
      ? supabase.rpc("painel_avaliacoes", {
          p_inicio: inicio,
          p_fim: fim,
          p_tipo: tipo,
          p_limite: LIMITE_LISTA,
        })
      : Promise.resolve(vazio),
  ]);

  if (resumoR.error || itensR.error) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar o painel. Confira se o script
        008_perfil_gestor.sql foi executado no Supabase.
      </p>
    );
  }

  const r = (resumoR.data as Resumo[])[0];
  const itens = (itensR.data ?? []) as Item[];
  const orientacoes = (orientacoesR.data ?? []) as Orientacao[];
  const orientacoesAtivas = orientacoes.filter((o) => o.ativa).length;

  const qs = (extra: Record<string, string>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(extra)) u.set(k, v);
    return `/gestor?${u.toString()}`;
  };
  const contagem: Record<Tipo, number> = {
    pendentes: r.negativas_pendentes,
    revisadas: r.negativas - r.negativas_pendentes,
    positivas: r.positivas,
    sem_resposta: r.sem_resposta,
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Painel do gestor</h1>

      {/* Abas do painel */}
      <nav
        aria-label="Seções do painel"
        className="-mb-2 flex flex-wrap gap-1 border-b"
      >
        {(
          [
            {
              id: "respostas",
              rotulo: "Avaliação das respostas",
              badge:
                r.negativas_pendentes > 0
                  ? `${r.negativas_pendentes} a revisar`
                  : null,
              href: qs({ aba: "respostas", tipo }),
            },
            {
              id: "orientacoes",
              rotulo: "Orientações para o Fhemigo",
              badge: orientacoesR.error ? null : `${orientacoesAtivas} ativas`,
              href: qs({ aba: "orientacoes" }),
            },
          ] as const
        ).map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={aba === t.id ? "page" : undefined}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors",
              aba === t.id
                ? "border-primary font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.rotulo}
            {t.badge && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  t.id === "respostas"
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {t.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {aba === "orientacoes" ? (
        <section
          aria-label="Orientações para o Fhemigo"
          className="flex flex-col gap-3"
        >
          {orientacoesR.error ? (
            <p className="text-sm text-muted-foreground">
              Orientações indisponíveis. Execute o script 009_orientacoes_ia.sql
              no Supabase.
            </p>
          ) : (
            <OrientacoesGestor orientacoes={orientacoes} />
          )}
        </section>
      ) : (
        <>
          {/* Indicadores */}
          <section
            aria-labelledby="indicadores"
            className="flex flex-col gap-3"
          >
            <h2 id="indicadores" className="sr-only">
              Indicadores
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              <Indicador
                rotulo="Perguntas recebidas"
                valor={r.perguntas}
                detalhe={`${r.servidores} servidores`}
              />
              <Indicador
                rotulo="Respondidas"
                valor={pct(r.respondidas, r.perguntas)}
                detalhe={`${r.respondidas} de ${r.perguntas}`}
              />
              <Indicador
                rotulo="Avaliadas"
                valor={pct(r.avaliadas, r.respondidas)}
                detalhe={`${r.avaliadas} das respondidas`}
              />
              <Indicador
                rotulo="Respostas úteis"
                valor={pct(r.positivas, r.avaliadas)}
                detalhe={`${r.positivas} 👍 · ${r.negativas} 👎`}
                destaque
              />
              <Indicador
                rotulo="👎 a revisar"
                valor={r.negativas_pendentes}
                detalhe={
                  r.negativas_pendentes ? "aguardando revisão" : "nada pendente"
                }
                alerta={r.negativas_pendentes > 0}
              />
              <Indicador
                rotulo="Sem resposta"
                valor={r.sem_resposta}
                detalhe="erro ou não respondida"
              />
            </div>
          </section>

          {/* Lista para revisão */}
          <section aria-labelledby="lista" className="flex flex-col gap-3">
            <h2 id="lista" className="text-lg font-semibold">
              Respostas
            </h2>
            <nav
              aria-label="Filtrar respostas"
              className="flex flex-wrap gap-2"
            >
              {ABAS.map((a) => (
                <Link
                  key={a.tipo}
                  href={qs({ aba: "respostas", tipo: a.tipo })}
                  aria-current={tipo === a.tipo ? "page" : undefined}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors hover:bg-accent",
                    tipo === a.tipo
                      ? "border-primary bg-accent font-semibold text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {a.rotulo} ({contagem[a.tipo]})
                </Link>
              ))}
            </nav>

            {itens.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {tipo === "pendentes"
                  ? "Nenhuma resposta com 👎 aguardando revisão. 🎉"
                  : "Nenhuma resposta nesta lista."}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {itens.map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-col gap-3 rounded-lg border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <time dateTime={i.perguntada_em}>
                        Perguntada em{" "}
                        {formatoData.format(new Date(i.perguntada_em))}
                      </time>
                      {i.avaliacao === -1 && (
                        <Badge variant="outline" className="gap-1">
                          <ThumbsDown className="h-3 w-3" aria-hidden /> Não
                          ajudou
                        </Badge>
                      )}
                      {i.avaliacao === 1 && (
                        <Badge variant="secondary" className="gap-1">
                          <ThumbsUp className="h-3 w-3" aria-hidden /> Útil
                        </Badge>
                      )}
                      {i.status !== "respondida" && (
                        <Badge variant="outline">
                          {i.status === "erro"
                            ? "Erro do agente"
                            : "Não respondida"}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Pergunta
                      </p>
                      <p className="text-sm font-medium whitespace-pre-wrap">
                        {i.pergunta}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Resposta do Fhemigo
                      </p>
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {i.resposta ?? "—"}
                      </p>
                    </div>
                    {i.comentario_avaliacao && (
                      <div className="rounded-md border-l-4 border-primary bg-secondary/40 px-3 py-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Comentário do servidor
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {i.comentario_avaliacao}
                        </p>
                      </div>
                    )}
                    {i.avaliacao === -1 && (
                      <RevisaoAvaliacao
                        mensagemId={i.id}
                        comentario={i.comentario_avaliacao}
                        revisadaEm={i.revisada_em}
                        revisadaPor={i.revisada_por}
                        notaRevisao={i.nota_revisao}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
            {itens.length === LIMITE_LISTA && (
              <p className="text-xs text-muted-foreground">
                Mostrando as {LIMITE_LISTA} mais recentes.
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- blocos
function Indicador({
  rotulo,
  valor,
  detalhe,
  destaque,
  alerta,
}: {
  rotulo: string;
  valor: string | number;
  detalhe?: string;
  destaque?: boolean;
  alerta?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border bg-card p-4",
        destaque && "border-primary",
        alerta && "border-amber-400 dark:border-amber-500/60",
      )}
    >
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="text-2xl font-bold tabular-nums text-foreground">{valor}</p>
      {detalhe && <p className="text-xs text-muted-foreground">{detalhe}</p>}
    </div>
  );
}

function AcessoRestrito() {
  return (
    <section className="m-auto flex max-w-md flex-col items-center gap-3 py-10 text-center">
      <Lock className="h-8 w-8 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-bold">Acesso restrito</h1>
      <p className="text-muted-foreground">
        Esta página é exclusiva para gestores do Fhemigo Responde. Se você
        precisa de acesso, fale com a Diretoria de Gestão de Pessoas.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Voltar para o início</Link>
      </Button>
    </section>
  );
}
