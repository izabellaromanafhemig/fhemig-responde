"use client";

import { Mascote } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Mensagem = {
  id: string;
  pergunta: string;
  resposta: string | null;
  status: "enviando" | "pendente" | "respondida" | "erro";
  aviso?: string;
};

export function ChatPanel() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [conversaId, setConversaId] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens]);

  const enviar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const pergunta = texto.trim();
    if (!pergunta || enviando) return;

    const tempId = `temp-${Date.now()}`;
    setMensagens((m) => [
      ...m,
      { id: tempId, pergunta, resposta: null, status: "enviando" },
    ]);
    setTexto("");
    setEnviando(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta, conversaId }),
      });
      const dados = await r.json();
      if (!r.ok) throw new Error(dados?.erro ?? "Falha ao enviar.");

      setConversaId(dados.conversaId);
      setMensagens((m) =>
        m.map((msg) =>
          msg.id === tempId
            ? {
                id: dados.id,
                pergunta,
                resposta: dados.resposta,
                status: dados.status,
                aviso: dados.aviso,
              }
            : msg,
        ),
      );
    } catch (err) {
      setMensagens((m) =>
        m.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                status: "erro",
                aviso: err instanceof Error ? err.message : "Falha ao enviar.",
              }
            : msg,
        ),
      );
    } finally {
      setEnviando(false);
    }
  };

  const novaConversa = () => {
    setMensagens([]);
    setConversaId(undefined);
  };

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col rounded-lg border">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
        <p className="text-sm text-muted-foreground">
          Pergunte sobre férias, folgas, frequência ou regras de RH.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={novaConversa}
          disabled={enviando || mensagens.length === 0}
        >
          Nova conversa
        </Button>
      </div>

      <div
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        aria-live="polite"
      >
        {mensagens.length === 0 && (
          <div className="m-auto flex max-w-sm flex-col items-center gap-3 text-center">
            <Mascote size={120} />
            <p className="font-semibold text-brand-strong">
              Olá! Eu sou o Fhemigo.
            </p>
            <p className="text-sm text-muted-foreground">
              Pergunte, por exemplo: &quot;Quantos dias de férias ainda tenho
              em 2026?&quot;
            </p>
          </div>
        )}

        {mensagens.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-2">
            <div className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground">
              {msg.pergunta}
            </div>
            <div className="flex max-w-[90%] items-end gap-2 self-start">
              <Mascote size={32} alt="Fhemigo" />
              <div
                className={cn(
                  "rounded-2xl rounded-bl-sm px-3 py-2 text-sm whitespace-pre-wrap",
                  msg.status === "erro"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {msg.status === "enviando"
                  ? "Fhemigo está pensando..."
                  : (msg.resposta ?? msg.aviso)}
              </div>
            </div>
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      <form onSubmit={enviar} className="flex items-end gap-2 border-t p-3">
        <label htmlFor="pergunta" className="sr-only">
          Sua pergunta
        </label>
        <textarea
          id="pergunta"
          rows={2}
          maxLength={4000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          placeholder="Digite sua pergunta e pressione Enter"
          className="flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={enviando || !texto.trim()}
          aria-label="Enviar pergunta"
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
