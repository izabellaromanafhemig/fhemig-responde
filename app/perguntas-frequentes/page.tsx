import { Mascote } from "@/components/brand";
import { FaqLista, type PerguntaFrequente } from "@/components/faq-lista";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = { title: "Perguntas frequentes | Fhemigo Responde" };

// Ordem de exibição dos temas; temas novos aparecem no fim, em ordem alfabética
const ORDEM_TEMAS = [
  "Férias",
  "Folgas compensatórias",
  "Faltas e frequência",
  "Horas extras",
  "Acúmulo de cargos",
];

async function Conteudo() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");

  const { data, error } = await supabase
    .from("perguntas_frequentes")
    .select("slug, tema, pergunta, resposta, regras")
    .order("ordem", { ascending: true });

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar as perguntas frequentes. Tente novamente mais tarde.
      </p>
    );
  }

  const perguntas = (data ?? []) as PerguntaFrequente[];
  const temas = [
    ...ORDEM_TEMAS.filter((t) => perguntas.some((p) => p.tema === t)),
    ...[...new Set(perguntas.map((p) => p.tema))]
      .filter((t) => !ORDEM_TEMAS.includes(t))
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  ];

  if (perguntas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ainda não há perguntas frequentes cadastradas.
      </p>
    );
  }

  return <FaqLista perguntas={perguntas} temas={temas} />;
}

export default function PerguntasFrequentesPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold">Perguntas frequentes</h1>
        <p className="text-muted-foreground">
          Respostas rápidas sobre férias, folgas, faltas, horas extras e acúmulo de cargos.
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
        <Conteudo />
      </Suspense>

      <section className="flex flex-col items-center gap-3 rounded-xl border bg-secondary/60 p-5 text-center sm:flex-row sm:text-left">
        <Mascote size={64} />
        <div className="flex-1">
          <p className="font-semibold">Não encontrou sua dúvida?</p>
          <p className="text-sm text-muted-foreground">
            Pergunte ao Fhemigo. Ele também consulta os seus dados de férias, folgas e frequência.
          </p>
        </div>
        <Button asChild>
          <Link href="/chat">Ir para o chat</Link>
        </Button>
      </section>
    </div>
  );
}
