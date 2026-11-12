import { AvaliacaoResposta } from "@/components/avaliacao-resposta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { correspondeBusca, lerFiltros } from "@/lib/historico-filtros";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = { title: "Histórico | Fhemigo Responde" };

// Quantas mensagens (mais recentes, dentro do período) entram na busca
const LIMITE_CONSULTA = 500;

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const ROTULO_STATUS: Record<string, string> = {
  pendente: "Aguardando resposta",
  respondida: "Respondida",
  erro: "Sem resposta",
};

type Linha = {
  id: string;
  pergunta: string;
  resposta: string | null;
  status: string;
  created_at: string;
  avaliacao: 1 | -1 | null;
  comentario_avaliacao: string | null;
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function Historico({ searchParams }: { searchParams: SearchParams }) {
  const filtros = lerFiltros(await searchParams);
  const filtrando = Boolean(filtros.termos.length || filtros.de || filtros.ate);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");

  // RLS garante que só voltam as mensagens do próprio usuário
  let consulta = supabase
    .from("historico_mensagens")
    .select("id, pergunta, resposta, status, created_at, avaliacao, comentario_avaliacao")
    .order("created_at", { ascending: false })
    .limit(LIMITE_CONSULTA);
  if (filtros.inicioIso) consulta = consulta.gte("created_at", filtros.inicioIso);
  if (filtros.fimExclusivoIso) consulta = consulta.lt("created_at", filtros.fimExclusivoIso);

  const { data, error } = await consulta;

  const linhas = ((data ?? []) as Linha[]).filter((l) =>
    correspondeBusca(filtros.termos, l.pergunta, l.resposta),
  );

  return (
    <>
      <form
        method="get"
        role="search"
        className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="busca">Buscar</Label>
          <Input
            id="busca"
            name="busca"
            type="search"
            placeholder="Ex.: férias folga"
            defaultValue={filtros.busca}
            maxLength={200}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:contents">
          <div className="grid gap-1.5">
            <Label htmlFor="de">De</Label>
            <Input id="de" name="de" type="date" defaultValue={filtros.de} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ate">Até</Label>
            <Input id="ate" name="ate" type="date" defaultValue={filtros.ate} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1 sm:flex-none">
            Filtrar
          </Button>
          {filtrando && (
            <Button asChild variant="outline" className="flex-1 sm:flex-none">
              <Link href="/historico">Limpar</Link>
            </Button>
          )}
        </div>
      </form>

      {filtros.erro && (
        <p className="text-sm text-amber-600 dark:text-amber-400">{filtros.erro}</p>
      )}

      {error ? (
        <p className="text-sm text-destructive">
          Não foi possível carregar o histórico. Tente novamente mais tarde.
        </p>
      ) : linhas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {filtrando ? (
            "Nenhuma pergunta encontrada com esses filtros."
          ) : (
            <>
              Você ainda não fez perguntas.{" "}
              <Link href="/chat" className="underline underline-offset-4">
                Ir para o chat
              </Link>
            </>
          )}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {linhas.length === 1 ? "1 pergunta" : `${linhas.length} perguntas`}
            {filtrando ? " encontrada(s)" : ""}
          </p>
          <ul className="flex flex-col gap-4">
            {linhas.map((l) => (
              <li key={l.id} className="rounded-lg border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <time
                    dateTime={l.created_at}
                    className="text-xs text-muted-foreground"
                  >
                    {formatoData.format(new Date(l.created_at))}
                  </time>
                  <Badge variant={l.status === "respondida" ? "secondary" : "outline"}>
                    {ROTULO_STATUS[l.status] ?? l.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium whitespace-pre-wrap">{l.pergunta}</p>
                <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                  {l.resposta ?? "—"}
                </p>
                {l.status === "respondida" && l.resposta && (
                  <AvaliacaoResposta
                    mensagemId={l.id}
                    avaliacaoInicial={l.avaliacao}
                    comentarioInicial={l.comentario_avaliacao}
                    className="mt-3 border-t pt-2"
                  />
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export default function HistoricoPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold">Histórico de perguntas</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}
      >
        <Historico searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
