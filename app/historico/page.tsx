import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = { title: "Histórico | Fhemigo Responde" };

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
};

async function ListaHistorico() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");

  // RLS garante que só voltam as mensagens do próprio usuário
  const { data, error } = await supabase
    .from("historico_mensagens")
    .select("id, pergunta, resposta, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar o histórico. Tente novamente mais tarde.
      </p>
    );
  }

  const linhas = (data ?? []) as Linha[];
  if (linhas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Você ainda não fez perguntas.{" "}
        <Link href="/chat" className="underline underline-offset-4">
          Ir para o chat
        </Link>
      </p>
    );
  }

  return (
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
        </li>
      ))}
    </ul>
  );
}

export default function HistoricoPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold">Histórico de perguntas</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}
      >
        <ListaHistorico />
      </Suspense>
    </div>
  );
}
