"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LIMITE_ORIENTACOES_ATIVAS,
  mensagemErroOrientacao,
  TEMAS_ORIENTACAO,
} from "@/lib/orientacoes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type Orientacao = {
  id: number;
  texto: string;
  tema: string | null;
  ativa: boolean;
  origem_mensagem_id: string | null;
  criada_por: string;
  criada_em: string;
  atualizada_por: string | null;
  atualizada_em: string | null;
};

const formato = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const campo =
  "rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none";

/** Lista e gestão das orientações que o Fhemigo segue. */
export function OrientacoesGestor({ orientacoes }: { orientacoes: Orientacao[] }) {
  const ativas = orientacoes.filter((o) => o.ativa).length;
  const [criando, setCriando] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {ativas} de {LIMITE_ORIENTACOES_ATIVAS} orientações ativas. O Fhemigo segue as
          ativas em todas as respostas.
        </p>
        {!criando && (
          <Button size="sm" variant="outline" onClick={() => setCriando(true)}>
            Nova orientação
          </Button>
        )}
      </div>

      {criando && <FormOrientacao onFechar={() => setCriando(false)} />}

      {orientacoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma orientação ainda. Crie uma ao revisar uma resposta com 👎 ou pelo botão
          acima.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {orientacoes.map((o) => (
            <ItemOrientacao key={o.id} o={o} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemOrientacao({ o }: { o: Orientacao }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const atualizar = async (mudanca: Partial<Pick<Orientacao, "ativa">>) => {
    setSalvando(true);
    setErro(null);
    const { error } = await createClient().rpc("atualizar_orientacao", {
      p_id: o.id,
      p_texto: o.texto,
      p_tema: o.tema,
      p_ativa: mudanca.ativa ?? o.ativa,
    });
    setSalvando(false);
    if (error) return setErro(mensagemErroOrientacao(error));
    router.refresh();
  };

  const excluir = async () => {
    if (!window.confirm("Excluir esta orientação? Não dá para desfazer.")) return;
    setSalvando(true);
    setErro(null);
    const { error } = await createClient().rpc("excluir_orientacao", { p_id: o.id });
    setSalvando(false);
    if (error) return setErro(mensagemErroOrientacao(error));
    router.refresh();
  };

  if (editando) {
    return (
      <li>
        <FormOrientacao existente={o} onFechar={() => setEditando(false)} />
      </li>
    );
  }

  return (
    <li className={cn("flex flex-col gap-2 rounded-lg border p-3", !o.ativa && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">#{o.id}</span>
        <Badge variant={o.ativa ? "secondary" : "outline"}>{o.ativa ? "Ativa" : "Inativa"}</Badge>
        {o.tema && <Badge variant="outline">{o.tema}</Badge>}
        <span>
          Criada em {formato.format(new Date(o.criada_em))} (MASP {o.criada_por})
          {o.origem_mensagem_id ? " a partir de uma resposta com 👎" : ""}
        </span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{o.texto}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={salvando} onClick={() => atualizar({ ativa: !o.ativa })}>
          {o.ativa ? "Desativar" : "Ativar"}
        </Button>
        <Button size="sm" variant="ghost" disabled={salvando} onClick={() => setEditando(true)}>
          Editar
        </Button>
        <Button size="sm" variant="ghost" disabled={salvando} onClick={excluir} className="text-destructive">
          Excluir
        </Button>
      </div>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </li>
  );
}

function FormOrientacao({
  existente,
  onFechar,
}: {
  existente?: Orientacao;
  onFechar: () => void;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState(existente?.texto ?? "");
  const [tema, setTema] = useState(existente?.tema ?? "Geral");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const tamanho = texto.trim().length;
  const invalido = tamanho < 10 || tamanho > 1000;

  const salvar = async () => {
    setSalvando(true);
    setErro(null);
    const supabase = createClient();
    const temaFinal = tema === "Geral" ? null : tema;
    const { error } = existente
      ? await supabase.rpc("atualizar_orientacao", {
          p_id: existente.id,
          p_texto: texto.trim(),
          p_tema: temaFinal,
          p_ativa: existente.ativa,
        })
      : await supabase.rpc("criar_orientacao", { p_texto: texto.trim(), p_tema: temaFinal });
    setSalvando(false);
    if (error) return setErro(mensagemErroOrientacao(error));
    onFechar();
    router.refresh();
  };

  const idBase = existente ? `orientacao-${existente.id}` : "orientacao-nova";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-secondary/40 p-3">
      <label htmlFor={idBase} className="text-sm font-medium">
        {existente ? `Editar orientação #${existente.id}` : "Nova orientação"} (regra geral, sem
        dados de pessoas)
      </label>
      <textarea
        id={idBase}
        rows={3}
        maxLength={1000}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Ex.: Sempre cite o código da regra usada, entre colchetes."
        className={`resize-y ${campo}`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${idBase}-tema`} className="text-sm text-muted-foreground">
          Tema
        </label>
        <select
          id={`${idBase}-tema`}
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
        <span className="ml-auto text-xs text-muted-foreground">{tamanho}/1000</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled={salvando || invalido} onClick={salvar}>
          Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={onFechar}>
          Cancelar
        </Button>
      </div>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
