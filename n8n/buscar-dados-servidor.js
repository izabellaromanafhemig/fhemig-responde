// Código do nó "Buscar dados do servidor" (n8n Code node, "Run Once for All Items").
// Mantido aqui para versionamento; o mesmo conteúdo está dentro do JSON do fluxo.
//
// Segurança: as consultas usam o token do PRÓPRIO usuário + chave pública.
// O RLS do Supabase devolve só as linhas do MASP dele. Nunca use a
// service_role key aqui.

const cfg = $('Config').first().json;
const req = $('Webhook').first().json;
const helpers = this.helpers;

const token = String(req.headers?.['x-supabase-access-token'] ?? '').trim();
const pergunta = String(req.body?.pergunta ?? '').trim();
const conversaId = String(req.body?.conversa_id ?? '').trim();

if (!token || !pergunta || pergunta.length > 4000) {
  return [{ json: { ok: false, status: 400, erro: 'Requisição inválida.' } }];
}

const base = String(cfg.supabase_url).replace(/\/+$/, '') + '/rest/v1/';
const headers = {
  apikey: cfg.supabase_publishable_key,
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
};

const chamar = (caminho, metodo = 'GET') =>
  helpers.httpRequest({
    method: metodo,
    url: base + caminho,
    headers: metodo === 'POST' ? { ...headers, 'Content-Type': 'application/json' } : headers,
    body: metodo === 'POST' ? {} : undefined,
    json: true,
  });

// 1. Valida o token e descobre o MASP da sessão (vem do banco, não da pergunta)
let masp;
try {
  masp = await chamar('rpc/masp_atual', 'POST');
} catch (e) {
  return [{ json: { ok: false, status: 401, erro: 'Sessão inválida ou expirada.' } }];
}
if (!masp) {
  return [{ json: { ok: false, status: 403, erro: 'Usuário sem MASP vinculado.' } }];
}

// 2. Busca os dados (o RLS já filtra pelo MASP do token)
const [funcionais, saldoFerias, periodos, frequencia, saldoFolgas, folgas, regras] =
  await Promise.all([
    chamar('dados_funcionais?select=nome,data_admissao,vinculo,data_fim_prevista,formacao,carreira,categoria_profissional,unidade_lotacao'),
    chamar('vw_saldo_ferias?select=ano_referencia,dias_direito,dias_tirados,dias_programados,dias_restantes,dias_a_programar,proximo_periodo_inicio&order=ano_referencia.desc'),
    chamar('dados_ferias_periodos?select=ano_referencia,data_inicio,data_fim,dias,situacao&order=data_inicio.desc&limit=20'),
    chamar('dados_frequencia?select=mes_referencia,quantidade_faltas,horas_extras_autorizadas,observacao&order=mes_referencia.desc&limit=12'),
    chamar('vw_saldo_folgas?select=dias_creditados,dias_usufruidos,saldo_dias,proxima_folga'),
    chamar('dados_folgas?select=tipo,dias,origem,data_referencia,validade,descricao&order=data_referencia.desc&limit=30'),
    chamar('dados_regras_rh?select=codigo,tema,titulo,descricao,base_legal,aplica_vinculo,validado&ativo=eq.true&order=codigo'),
  ]);

const servidor = funcionais[0] ?? null;
const primeiroNome = servidor?.nome ? String(servidor.nome).split(' ')[0] : null;
if (servidor) delete servidor.nome; // minimização: o modelo só recebe o primeiro nome

const secao = (titulo, dados) =>
  `### ${titulo}\n${dados && (!Array.isArray(dados) || dados.length) ? JSON.stringify(dados) : '(sem registros)'}`;

const dadosServidor = [
  secao('Cadastro funcional', servidor),
  secao('Saldo de férias por ano', saldoFerias),
  secao('Períodos de férias', periodos),
  secao('Frequência (últimos 12 meses)', frequencia),
  secao('Saldo de folgas compensativas', saldoFolgas[0] ?? null),
  secao('Extrato de folgas compensativas', folgas),
].join('\n\n');

const regrasTexto = regras
  .map((r) =>
    `[${r.codigo}] ${r.tema} — ${r.titulo} (aplica a: ${r.aplica_vinculo}; ` +
    `${r.validado ? 'validada' : 'EM VALIDAÇÃO'})\n${r.descricao}\nBase legal: ${r.base_legal ?? 'não informada'}`)
  .join('\n\n');

return [{
  json: {
    ok: true,
    pergunta,
    // memória da conversa separada por MASP verificado + conversa
    session_key: `${masp}:${conversaId || 'sem-conversa'}`,
    primeiro_nome: primeiroNome,
    hoje: $now.setZone('America/Sao_Paulo').toFormat('dd/MM/yyyy'),
    dados_servidor: dadosServidor,
    regras: regrasTexto,
  },
}];
