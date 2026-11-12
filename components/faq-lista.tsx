"use client";

import { Input } from "@/components/ui/input";
import { correspondeBusca, normalizarTexto } from "@/lib/historico-filtros";
import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

export type PerguntaFrequente = {
  slug: string;
  tema: string;
  pergunta: string;
  resposta: string;
  regras: string[];
};

export function FaqLista({
  perguntas,
  temas,
}: {
  perguntas: PerguntaFrequente[];
  temas: string[];
}) {
  const [busca, setBusca] = useState("");
  const termos = useMemo(
    () => normalizarTexto(busca).split(/\s+/).filter(Boolean),
    [busca],
  );

  const filtradas = perguntas.filter((p) =>
    correspondeBusca(termos, p.pergunta, p.resposta, p.tema),
  );
  const buscando = termos.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <label htmlFor="busca-faq" className="sr-only">
          Buscar nas perguntas frequentes
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="busca-faq"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar: férias, atraso, folga, acúmulo..."
          className="pl-9"
        />
      </div>

      {buscando && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {filtradas.length === 0
            ? "Nenhuma pergunta encontrada. Tente outras palavras ou pergunte ao Fhemigo no chat."
            : filtradas.length === 1
              ? "1 pergunta encontrada"
              : `${filtradas.length} perguntas encontradas`}
        </p>
      )}

      {temas.map((tema) => {
        const doTema = filtradas.filter((p) => p.tema === tema);
        if (doTema.length === 0) return null;
        return (
          <section key={tema} aria-labelledby={`tema-${tema}`} className="flex flex-col gap-2">
            <h2 id={`tema-${tema}`} className="text-lg font-semibold text-brand-strong">
              {tema}
            </h2>
            <div className="flex flex-col divide-y rounded-lg border bg-card">
              {doTema.map((p) => (
                <details key={p.slug} id={p.slug} open={buscando} className="group scroll-mt-24">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3 font-medium hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                    <span>{p.pergunta}</span>
                    <ChevronDown
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="flex flex-col gap-2 px-4 pb-4 text-sm">
                    <p className="whitespace-pre-line text-muted-foreground">{p.resposta}</p>
                    {p.regras.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Regras: {p.regras.join(", ")}
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
