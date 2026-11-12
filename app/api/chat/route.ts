import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/chat
 * Recebe a pergunta do servidor logado, grava no histórico e (quando
 * configurado) encaminha para o agente no n8n.
 *
 * Segurança:
 *  - O usuário vem da sessão (cookie), nunca do corpo da requisição.
 *  - O MASP é preenchido pelo banco (default masp_atual() + RLS).
 *  - O n8n recebe o token de acesso do PRÓPRIO usuário. Usando esse token
 *    nas consultas ao Supabase, o RLS garante que o agente só enxerga os
 *    dados daquele MASP — o agente não escolhe de quem são os dados.
 *
 * Variáveis de ambiente (em .env.local, nunca no código):
 *  - N8N_WEBHOOK_URL     URL do webhook do agente (opcional por enquanto)
 *  - N8N_WEBHOOK_SECRET  segredo compartilhado, enviado no cabeçalho
 *                        X-Fhemigo-Secret para o n8n validar a origem
 */

const TAMANHO_MAXIMO = 4000;
const TIMEOUT_N8N_MS = 60_000;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RespostaN8n =
  | { resposta?: string; output?: string; text?: string }
  | Array<{ resposta?: string; output?: string; text?: string }>;

function extrairResposta(dados: RespostaN8n): string | null {
  const item = Array.isArray(dados) ? dados[0] : dados;
  const texto = item?.resposta ?? item?.output ?? item?.text;
  return typeof texto === "string" && texto.trim() ? texto.trim() : null;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let corpo: { pergunta?: unknown; conversaId?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const pergunta = typeof corpo.pergunta === "string" ? corpo.pergunta.trim() : "";
  if (!pergunta || pergunta.length > TAMANHO_MAXIMO) {
    return NextResponse.json(
      { erro: `Escreva uma pergunta de até ${TAMANHO_MAXIMO} caracteres.` },
      { status: 400 },
    );
  }
  const conversaId =
    typeof corpo.conversaId === "string" && UUID_RE.test(corpo.conversaId)
      ? corpo.conversaId
      : undefined;

  // 1. Grava a pergunta (user_id e masp vêm dos defaults do banco)
  const { data: mensagem, error: erroInsert } = await supabase
    .from("historico_mensagens")
    .insert({ pergunta, ...(conversaId ? { conversa_id: conversaId } : {}) })
    .select("id, conversa_id, created_at")
    .single();

  if (erroInsert || !mensagem) {
    console.error("Erro ao gravar pergunta:", erroInsert?.message);
    return NextResponse.json(
      { erro: "Não foi possível registrar a pergunta." },
      { status: 500 },
    );
  }

  const base = {
    id: mensagem.id as string,
    conversaId: mensagem.conversa_id as string,
    criadaEm: mensagem.created_at as string,
  };

  // 2. Agente ainda não configurado: a pergunta fica pendente no histórico
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({
      ...base,
      status: "pendente",
      resposta: null,
      aviso:
        "Pergunta registrada. O assistente ainda não está conectado — a resposta aparecerá aqui quando ele for ativado.",
    });
  }

  // 3. Encaminha ao n8n com o token do próprio usuário
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let resposta: string | null = null;
  try {
    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "X-Fhemigo-Secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
        ...(session?.access_token
          ? { "X-Supabase-Access-Token": session.access_token }
          : {}),
      },
      body: JSON.stringify({
        mensagem_id: base.id,
        conversa_id: base.conversaId,
        pergunta,
      }),
      signal: AbortSignal.timeout(TIMEOUT_N8N_MS),
    });
    if (!r.ok) throw new Error(`n8n respondeu ${r.status}`);
    resposta = extrairResposta((await r.json()) as RespostaN8n);
    if (!resposta) throw new Error("n8n não retornou texto de resposta");
  } catch (e) {
    console.error("Erro ao consultar o agente:", e instanceof Error ? e.message : e);
  }

  const status = resposta ? "respondida" : "erro";
  await supabase
    .from("historico_mensagens")
    .update({
      resposta,
      status,
      respondida_em: resposta ? new Date().toISOString() : null,
    })
    .eq("id", base.id);

  return NextResponse.json({
    ...base,
    status,
    resposta,
    aviso: resposta
      ? undefined
      : "O assistente não conseguiu responder agora. Tente novamente em instantes.",
  });
}
