"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

type Valor = 1 | -1 | null;

/**
 * Botões 👍 / 👎 para avaliar uma resposta do Fhemigo.
 * Grava direto em historico_mensagens; o RLS só permite avaliar
 * as mensagens do próprio servidor.
 */
export function AvaliacaoResposta({
  mensagemId,
  avaliacaoInicial = null,
  comentarioInicial = null,
  className,
}: {
  mensagemId: string;
  avaliacaoInicial?: Valor;
  comentarioInicial?: string | null;
  className?: string;
}) {
  const [valor, setValor] = useState<Valor>(avaliacaoInicial);
  const [comentario, setComentario] = useState(comentarioInicial ?? "");
  const [pedirComentario, setPedirComentario] = useState(false);
  const [comentarioEnviado, setComentarioEnviado] = useState(Boolean(comentarioInicial));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async (novo: Valor, texto: string | null) => {
    setSalvando(true);
    setErro(null);
    const { error } = await createClient()
      .from("historico_mensagens")
      .update({
        avaliacao: novo,
        comentario_avaliacao: texto,
        avaliada_em: novo === null ? null : new Date().toISOString(),
      })
      .eq("id", mensagemId);
    setSalvando(false);
    if (error) {
      setErro("Não foi possível salvar a avaliação.");
      return false;
    }
    return true;
  };

  const clicar = async (escolha: 1 | -1) => {
    const anterior = valor;
    const novo: Valor = valor === escolha ? null : escolha; // clicar de novo desfaz
    setValor(novo);
    setComentarioEnviado(false);
    setPedirComentario(novo === -1);
    if (novo !== -1) setComentario("");
    const ok = await salvar(novo, null);
    if (!ok) setValor(anterior);
  };

  const enviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    const texto = comentario.trim().slice(0, 1000) || null;
    if (await salvar(-1, texto)) {
      setPedirComentario(false);
      setComentarioEnviado(true);
    }
  };

  const botao = (escolha: 1 | -1) => {
    const ativo = valor === escolha;
    const Icone = escolha === 1 ? ThumbsUp : ThumbsDown;
    return (
      <button
        type="button"
        onClick={() => clicar(escolha)}
        disabled={salvando}
        aria-pressed={ativo}
        aria-label={escolha === 1 ? "Resposta útil" : "Resposta não ajudou"}
        title={escolha === 1 ? "Resposta útil" : "Resposta não ajudou"}
        className={cn(
          "rounded-md p-1.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50",
          ativo
            ? escolha === 1
              ? "text-brand-strong"
              : "text-destructive"
            : "text-muted-foreground",
        )}
      >
        <Icone className="h-4 w-4" fill={ativo ? "currentColor" : "none"} aria-hidden />
      </button>
    );
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="mr-1">Esta resposta ajudou?</span>
        {botao(1)}
        {botao(-1)}
        {valor !== null && !pedirComentario && (
          <span className="ml-1" aria-live="polite">
            {comentarioEnviado ? "Obrigado pelo comentário!" : "Obrigado pela avaliação!"}
          </span>
        )}
      </div>

      {pedirComentario && (
        <form onSubmit={enviarComentario} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <label htmlFor={`comentario-${mensagemId}`} className="sr-only">
            O que faltou ou estava errado?
          </label>
          <textarea
            id={`comentario-${mensagemId}`}
            rows={2}
            maxLength={1000}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="O que faltou ou estava errado? (opcional)"
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={salvando}>
              Enviar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPedirComentario(false)}
            >
              Pular
            </Button>
          </div>
        </form>
      )}

      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
