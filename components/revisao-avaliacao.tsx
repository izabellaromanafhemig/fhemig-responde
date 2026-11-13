"use client";

import { Button } from "@/components/ui/button";
import { mensagemErroOrientacao, TEMAS_ORIENTACAO } from "@/lib/orientacoes";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const formato = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const campo =
  "rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none";

/**
 * Ação do gestor numa resposta com 👎: marcar como revisada (ou desfazer) e,
 * opcionalmente, criar uma orientação que o Fhemigo passa a seguir.
 */
export function RevisaoAvaliacao({
  mensagemId,
  comentario,
  revisadaEm,
  revisadaPor,
  notaRevisao,
}: {
  mensagemId: string;
  comentario: string | null;
  revisadaEm: string | null;
  revisadaPor: string | null;
  notaRevisao: string | null;
}) {
  const router = useRouter();
  const [abrindo, setAbrindo] = useState(false);
  const [nota, setNota] = useState("");
  const [criarOrientacao, setCriarOrientacao] = useState(false);
  const [orientacao, setOrientacao] = useState(comentario ?? "");
  const [tema, setTema] = useState<string>("Geral");
  const [orientacaoCriada, setOrientacaoCriada] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const supabase = createClient();

  const desfazer = async () => {
    setSalvando(true);
    setErro(null);
    const { error } = await supabase.rpc("marcar_revisada", {
      p_id: mensagemId,
      p_nota: null,
      p_revisada: false,
    });
    setSalvando(false);
    if (error) return setErro("Não foi possível desfazer. Tente novamente.");
    router.refresh();
  };

  const confirmar = async () => {
    setSalvando(true);
    setErro(null);
    let notaFinal = nota.trim();

    if (criarOrientacao) {
      // se já criou numa tentativa anterior (e só a revisão falhou), não duplica
      let idOrientacao = orientacaoCriada;
      if (idOrientacao === null) {
        const { data, error } = await supabase.rpc("criar_orientacao", {
          p_texto: orientacao.trim(),
          p_tema: tema === "Geral" ? null : tema,
          p_mensagem_id: mensagemId,
        });
        if (error) {
          setSalvando(false);
          return setErro(mensagemErroOrientacao(error));
        }
        idOrientacao = data as number;
        setOrientacaoCriada(idOrientacao);
      }
      notaFinal = [notaFinal, `Orientação #${idOrientacao} criada para o Fhemigo.`]
        .filter(Boolean)
        .join(" ");
    }

    const { error } = await supabase.rpc("marcar_revisada", {
      p_id: mensagemId,
      p_nota: notaFinal || null,
      p_revisada: true,
    });
    setSalvando(false);
    if (error) return setErro("Não foi possível marcar como revisada. Tente novamente.");
    setAbrindo(false);
    router.refresh();
  };

  if (revisadaEm) {
    return (
      <div className="flex flex-col gap-1 rounded-md bg-secondary/60 px-3 py-2 text-sm">
        <p className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="h-4 w-4 text-brand-strong" aria-hidden />
          Revisada em {formato.format(new Date(revisadaEm))}
          {revisadaPor ? ` (MASP ${revisadaPor})` : ""}
        </p>
        {notaRevisao && <p className="text-muted-foreground">{notaRevisao}</p>}
        <div>
          <Button size="sm" variant="ghost" className="h-7 px-2" disabled={salvando} onClick={desfazer}>
            Desfazer revisão
          </Button>
        </div>
        {erro && <p className="text-xs text-destructive">{erro}</p>}
      </div>
    );
  }

  if (!abrindo) {
    return (
      <div>
        <Button size="sm" variant="outline" onClick={() => setAbrindo(true)}>
          Revisar
        </Button>
      </div>
    );
  }

  const orientacaoInvalida =
    criarOrientacao && (orientacao.trim().length < 10 || orientacao.trim().length > 1000);

  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`nota-${mensagemId}`} className="text-sm font-medium">
          O que foi feito? (opcional)
        </label>
        <textarea
          id={`nota-${mensagemId}`}
          rows={2}
          maxLength={1000}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ex.: regra FER-07 corrigida; nova pergunta frequente"
          className={`resize-none ${campo}`}
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={criarOrientacao}
          onChange={(e) => setCriarOrientacao(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
        />
        <span>
          <span className="font-medium">Criar orientação para o Fhemigo</span>
          <span className="block text-muted-foreground">
            O Fhemigo passa a seguir esta orientação em todas as respostas, para todos os
            servidores.
          </span>
        </span>
      </label>

      {criarOrientacao && (
        <div className="flex flex-col gap-2 rounded-md bg-secondary/40 p-3">
          <label htmlFor={`orientacao-${mensagemId}`} className="text-sm font-medium">
            Orientação (escreva como regra geral, sem dados de pessoas)
          </label>
          <textarea
            id={`orientacao-${mensagemId}`}
            rows={3}
            maxLength={1000}
            value={orientacao}
            onChange={(e) => setOrientacao(e.target.value)}
            placeholder="Ex.: Em acúmulo ilegal, diferencie exoneração (escolha do servidor em 30 dias) de demissão (resultado do processo disciplinar)."
            className={`resize-y ${campo}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`tema-${mensagemId}`} className="text-sm text-muted-foreground">
              Tema
            </label>
            <select
              id={`tema-${mensagemId}`}
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className={campo}
            >
              {TEMAS_ORIENTACAO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <span className="ml-auto text-xs text-muted-foreground">
              {orientacao.trim().length}/1000
            </span>
          </div>
          {comentario && (
            <p className="text-xs text-muted-foreground">
              O texto começou com o comentário do servidor. Revise antes de confirmar: o
              Fhemigo vai seguir exatamente o que estiver escrito aqui.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" disabled={salvando || orientacaoInvalida} onClick={confirmar}>
          {criarOrientacao ? "Criar orientação e marcar revisada" : "Marcar como revisada"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setAbrindo(false)}>
          Cancelar
        </Button>
      </div>
      {orientacaoInvalida && (
        <p className="text-xs text-muted-foreground">
          A orientação precisa ter entre 10 e 1.000 caracteres.
        </p>
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
