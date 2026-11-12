// Monta o JSON de importação do n8n a partir de:
//   n8n/buscar-dados-servidor.js  (código do nó Code)
//   n8n/prompt-sistema.md         (mensagem de sistema do agente)
// Uso: node n8n/gerar-fluxo.mjs  ->  n8n/fhemigo-responde-agente.json

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const codigo = readFileSync(join(DIR, "buscar-dados-servidor.js"), "utf8");
const prompt = readFileSync(join(DIR, "prompt-sistema.md"), "utf8");

const id = (n) => `f3e1a0c0-0000-4000-8000-${String(n).padStart(12, "0")}`;

const nodes = [
  {
    id: id(1),
    name: "Webhook",
    type: "n8n-nodes-base.webhook",
    typeVersion: 2,
    position: [0, 300],
    webhookId: "8d0a7c55-5f0e-4e3b-9a51-a1b2c3d4e5f6",
    parameters: {
      httpMethod: "POST",
      path: "fhemigo-responde",
      authentication: "headerAuth",
      responseMode: "responseNode",
      options: {},
    },
  },
  {
    id: id(2),
    name: "Config",
    type: "n8n-nodes-base.set",
    typeVersion: 3.4,
    position: [220, 300],
    parameters: {
      assignments: {
        assignments: [
          {
            id: id(101),
            name: "supabase_url",
            value: "https://SEU-PROJETO.supabase.co",
            type: "string",
          },
          {
            id: id(102),
            name: "supabase_publishable_key",
            value: "COLE-AQUI-A-CHAVE-PUBLICA (publishable/anon) — NUNCA a service_role",
            type: "string",
          },
        ],
      },
      options: {},
    },
  },
  {
    id: id(3),
    name: "Buscar dados do servidor",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [440, 300],
    parameters: { jsCode: codigo },
  },
  {
    id: id(4),
    name: "Dados OK?",
    type: "n8n-nodes-base.if",
    typeVersion: 2,
    position: [660, 300],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: "", typeValidation: "loose" },
        conditions: [
          {
            id: id(103),
            leftValue: "={{ $json.ok }}",
            rightValue: true,
            operator: { type: "boolean", operation: "true", singleValue: true },
          },
        ],
        combinator: "and",
      },
      options: {},
    },
  },
  {
    id: id(5),
    name: "Agente Fhemigo Responde",
    type: "@n8n/n8n-nodes-langchain.agent",
    typeVersion: 1.7,
    position: [900, 200],
    parameters: {
      promptType: "define",
      text: "={{ $json.pergunta }}",
      options: { systemMessage: "=" + prompt },
    },
  },
  {
    id: id(6),
    name: "Modelo OpenAI",
    type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
    typeVersion: 1.2,
    position: [840, 440],
    parameters: {
      model: { __rl: true, value: "gpt-4.1-mini", mode: "list", cachedResultName: "gpt-4.1-mini" },
      options: { temperature: 0.2 },
    },
  },
  {
    id: id(7),
    name: "Memória da conversa",
    type: "@n8n/n8n-nodes-langchain.memoryBufferWindow",
    typeVersion: 1.3,
    position: [1000, 440],
    parameters: {
      sessionIdType: "customKey",
      sessionKey: "={{ $json.session_key }}",
      contextWindowLength: 10,
    },
  },
  {
    id: id(8),
    name: "Responder",
    type: "n8n-nodes-base.respondToWebhook",
    typeVersion: 1.1,
    position: [1260, 200],
    parameters: {
      respondWith: "json",
      responseBody: '={{ { "resposta": $json.output } }}',
      options: { responseCode: 200 },
    },
  },
  {
    id: id(9),
    name: "Responder erro",
    type: "n8n-nodes-base.respondToWebhook",
    typeVersion: 1.1,
    position: [900, 620],
    parameters: {
      respondWith: "json",
      responseBody: '={{ { "erro": $json.erro } }}',
      options: { responseCode: "={{ $json.status }}" },
    },
  },
  {
    id: id(10),
    name: "Leia-me",
    type: "n8n-nodes-base.stickyNote",
    typeVersion: 1,
    position: [-20, -60],
    parameters: {
      width: 660,
      height: 300,
      content:
        "## Fhemigo Responde — agente de RH\n" +
        "1. **Webhook**: crie uma credencial *Header Auth* com nome `X-Fhemigo-Secret` e o mesmo valor de `N8N_WEBHOOK_SECRET` do app.\n" +
        "2. **Config**: preencha a URL do Supabase e a chave **pública** (publishable/anon). Nunca a service_role.\n" +
        "3. **Modelo OpenAI**: selecione sua credencial OpenAI.\n" +
        "4. Ative o fluxo e use a *Production URL* em `N8N_WEBHOOK_URL`.\n\n" +
        "Os dados são buscados com o token do próprio servidor: o RLS do Supabase garante que só voltam os dados do MASP dele.",
    },
  },
];

const connections = {
  Webhook: { main: [[{ node: "Config", type: "main", index: 0 }]] },
  Config: { main: [[{ node: "Buscar dados do servidor", type: "main", index: 0 }]] },
  "Buscar dados do servidor": { main: [[{ node: "Dados OK?", type: "main", index: 0 }]] },
  "Dados OK?": {
    main: [
      [{ node: "Agente Fhemigo Responde", type: "main", index: 0 }],
      [{ node: "Responder erro", type: "main", index: 0 }],
    ],
  },
  "Agente Fhemigo Responde": { main: [[{ node: "Responder", type: "main", index: 0 }]] },
  "Modelo OpenAI": {
    ai_languageModel: [[{ node: "Agente Fhemigo Responde", type: "ai_languageModel", index: 0 }]],
  },
  "Memória da conversa": {
    ai_memory: [[{ node: "Agente Fhemigo Responde", type: "ai_memory", index: 0 }]],
  },
};

const fluxo = {
  name: "Fhemigo Responde — Agente de RH",
  nodes,
  connections,
  pinData: {},
  settings: { executionOrder: "v1" },
  active: false,
  meta: { templateCredsSetupCompleted: false },
  tags: [],
};

writeFileSync(join(DIR, "fhemigo-responde-agente.json"), JSON.stringify(fluxo, null, 2) + "\n", "utf8");
console.log("n8n/fhemigo-responde-agente.json gerado");
