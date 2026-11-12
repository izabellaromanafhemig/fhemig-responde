-- =============================================================================
-- Fhemigo Responde — esquema inicial
-- Execute este arquivo no SQL Editor do Supabase (uma única vez).
-- Depois, se quiser dados fictícios para teste, execute 002_dados_teste.sql.
--
-- Princípio de segurança:
--   * O MASP de quem está logado vem SEMPRE da tabela `perfis` (ligada ao
--     auth.uid() da sessão), nunca de algo que o usuário ou a IA informe.
--   * Todas as tabelas têm RLS. Cada servidor só lê as linhas do próprio MASP.
--   * Dados funcionais, frequência, férias e folgas são SOMENTE LEITURA para
--     o servidor. Quem grava é o RH/integração (service_role, que ignora RLS).
--   * O histórico de mensagens é lido e gravado pelo próprio servidor.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Função utilitária: atualiza a coluna updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- =============================================================================
-- 1. dados_funcionais
-- =============================================================================
create table public.dados_funcionais (
  masp                    text primary key
                          check (masp ~ '^[0-9]{6,10}$'),       -- só dígitos
  nome                    text not null,
  data_admissao           date not null,
  vinculo                 text not null
                          check (vinculo in ('efetivo', 'contrato')),
  data_fim_prevista       date,                                 -- só p/ contrato
  formacao                text not null
                          check (formacao in (
                            'ensino_fundamental', 'ensino_medio', 'ensino_tecnico',
                            'superior', 'especializacao', 'mestrado', 'doutorado'
                          )),
  carreira                text not null
                          check (carreira in ('MED', 'PENF', 'TOS', 'AGAS', 'AUAS')),
  categoria_profissional  text not null,                        -- ex.: Psicólogo
  unidade_lotacao         text,                                 -- ex.: Hospital João XXIII
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- contrato exige data fim; efetivo não tem data fim
  constraint ck_data_fim_conforme_vinculo check (
    (vinculo = 'contrato' and data_fim_prevista is not null)
    or (vinculo = 'efetivo' and data_fim_prevista is null)
  ),
  constraint ck_data_fim_apos_admissao check (
    data_fim_prevista is null or data_fim_prevista >= data_admissao
  )
);

comment on table public.dados_funcionais is
  'Cadastro funcional do servidor. Somente leitura para o servidor (RLS).';

create trigger trg_dados_funcionais_updated_at
  before update on public.dados_funcionais
  for each row execute function public.set_updated_at();


-- =============================================================================
-- Perfis: liga o usuário autenticado (auth.users) ao MASP.
-- É a ÚNICA fonte de "qual MASP é o usuário logado".
-- =============================================================================
create table public.perfis (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  masp        text not null unique
              references public.dados_funcionais (masp) on delete cascade,
  created_at  timestamptz not null default now()
);

comment on table public.perfis is
  'Vínculo 1:1 entre a conta de login e o MASP. Criado por trigger no cadastro.';


-- -----------------------------------------------------------------------------
-- masp_atual(): MASP do usuário da sessão atual (ou NULL se não houver).
-- SECURITY DEFINER para poder ler `perfis` dentro das políticas de RLS.
-- -----------------------------------------------------------------------------
create or replace function public.masp_atual()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.masp
  from public.perfis p
  where p.user_id = (select auth.uid())
$$;

revoke all on function public.masp_atual() from public, anon;
grant execute on function public.masp_atual() to authenticated;


-- -----------------------------------------------------------------------------
-- Cadastro: ao criar um usuário no Supabase Auth, cria o perfil.
--   * O app envia o MASP em user_metadata.masp e usa "<masp>@<dominio>" como
--     e-mail técnico de login.
--   * Recusa o cadastro (erro) se o MASP não existir em dados_funcionais,
--     se o e-mail não corresponder ao MASP, ou se o MASP já tiver conta.
--
-- ATENÇÃO (POC): isso garante que só MASPs reais se cadastrem, mas NÃO prova
-- que a pessoa é dona daquele MASP. Em produção, use login institucional
-- (gov.br / AD da FHEMIG) ou uma verificação adicional antes do cadastro.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_masp text := nullif(trim(new.raw_user_meta_data ->> 'masp'), '');
begin
  if v_masp is null then
    raise exception 'MASP_OBRIGATORIO';
  end if;

  if split_part(lower(new.email), '@', 1) <> v_masp then
    raise exception 'MASP_EMAIL_DIVERGENTE';
  end if;

  if not exists (select 1 from public.dados_funcionais d where d.masp = v_masp) then
    raise exception 'MASP_NAO_ENCONTRADO';
  end if;

  insert into public.perfis (user_id, masp) values (new.id, v_masp);
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================================
-- 2. dados_frequencia (uma linha por servidor por mês)
-- =============================================================================
create table public.dados_frequencia (
  id                        bigint generated always as identity primary key,
  masp                      text not null
                            references public.dados_funcionais (masp) on delete cascade,
  mes_referencia            date not null
                            check (extract(day from mes_referencia) = 1), -- sempre dia 1
  quantidade_faltas         integer not null default 0 check (quantidade_faltas >= 0),
  horas_extras_autorizadas  numeric(6, 2) not null default 0
                            check (horas_extras_autorizadas >= 0),
  observacao                text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (masp, mes_referencia)
);

comment on column public.dados_frequencia.mes_referencia is
  'Primeiro dia do mês de referência. Ex.: 2026-10-01 = outubro/2026.';

create trigger trg_dados_frequencia_updated_at
  before update on public.dados_frequencia
  for each row execute function public.set_updated_at();


-- =============================================================================
-- 3. Férias
--   dados_ferias          -> direito anual (quantos dias o servidor tem no ano)
--   dados_ferias_periodos -> cada período marcado (programado, em gozo, gozado...)
--   vw_saldo_ferias       -> visão pronta p/ a IA: direito x tirados x restantes
--
-- A contagem de dias (corridos ou úteis) é a que o RH registrar em `dias`;
-- o banco não recalcula pelas datas.
-- =============================================================================
create table public.dados_ferias (
  id               bigint generated always as identity primary key,
  masp             text not null
                   references public.dados_funcionais (masp) on delete cascade,
  ano_referencia   integer not null check (ano_referencia between 1950 and 2100),
  dias_direito     integer not null check (dias_direito between 0 and 60),
  observacao       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (masp, ano_referencia)
);

create trigger trg_dados_ferias_updated_at
  before update on public.dados_ferias
  for each row execute function public.set_updated_at();

create table public.dados_ferias_periodos (
  id               bigint generated always as identity primary key,
  masp             text not null,
  ano_referencia   integer not null,
  data_inicio      date not null,
  data_fim         date not null,
  dias             integer not null check (dias > 0),
  situacao         text not null default 'programada'
                   check (situacao in ('programada', 'em_gozo', 'gozada', 'cancelada')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (data_fim >= data_inicio),
  -- o período sempre pertence a um direito anual existente do mesmo MASP
  foreign key (masp, ano_referencia)
    references public.dados_ferias (masp, ano_referencia) on delete cascade
);

create index idx_ferias_periodos_masp_ano
  on public.dados_ferias_periodos (masp, ano_referencia);

create trigger trg_dados_ferias_periodos_updated_at
  before update on public.dados_ferias_periodos
  for each row execute function public.set_updated_at();

-- security_invoker = true => a view respeita o RLS de quem consulta
create view public.vw_saldo_ferias
with (security_invoker = true)
as
select
  f.masp,
  f.ano_referencia,
  f.dias_direito,
  coalesce(sum(p.dias) filter (where p.situacao in ('gozada', 'em_gozo')), 0)::int
    as dias_tirados,
  coalesce(sum(p.dias) filter (where p.situacao = 'programada'), 0)::int
    as dias_programados,
  (f.dias_direito
    - coalesce(sum(p.dias) filter (where p.situacao in ('gozada', 'em_gozo')), 0))::int
    as dias_restantes,
  (f.dias_direito
    - coalesce(sum(p.dias) filter (where p.situacao <> 'cancelada'), 0))::int
    as dias_a_programar,
  min(p.data_inicio) filter (
    where p.situacao = 'programada' and p.data_inicio >= current_date
  ) as proximo_periodo_inicio
from public.dados_ferias f
left join public.dados_ferias_periodos p
  on p.masp = f.masp and p.ano_referencia = f.ano_referencia
group by f.masp, f.ano_referencia, f.dias_direito;

comment on view public.vw_saldo_ferias is
  'Por servidor e ano: dias de direito, tirados (gozada/em_gozo), programados, '
  'restantes (direito - tirados) e ainda a programar (direito - não cancelados).';


-- =============================================================================
-- 4. Folgas compensativas
-- Folga compensativa = dia de descanso concedido em troca de trabalho além da
-- jornada normal (ex.: horas extras convertidas em folga, plantão em feriado,
-- convocação para eleições). Modelado como extrato: créditos e débitos.
-- =============================================================================
create table public.dados_folgas (
  id               bigint generated always as identity primary key,
  masp             text not null
                   references public.dados_funcionais (masp) on delete cascade,
  tipo             text not null check (tipo in ('credito', 'debito')),
  dias             numeric(5, 2) not null check (dias > 0),
  origem           text not null
                   check (origem in (
                     'horas_extras', 'plantao_feriado', 'servico_eleitoral',
                     'gozo',          -- débito: folga usufruída
                     'outros'
                   )),
  data_referencia  date not null,    -- crédito: data do fato gerador; débito: data da folga
  validade         date,             -- se houver prazo para usar o crédito
  descricao        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_dados_folgas_masp on public.dados_folgas (masp);

create trigger trg_dados_folgas_updated_at
  before update on public.dados_folgas
  for each row execute function public.set_updated_at();

create view public.vw_saldo_folgas
with (security_invoker = true)
as
select
  masp,
  coalesce(sum(dias) filter (where tipo = 'credito'), 0) as dias_creditados,
  coalesce(sum(dias) filter (where tipo = 'debito'), 0)  as dias_usufruidos,
  coalesce(sum(case when tipo = 'credito' then dias else -dias end), 0)
    as saldo_dias,
  min(data_referencia) filter (
    where tipo = 'debito' and data_referencia >= current_date
  ) as proxima_folga
from public.dados_folgas
group by masp;


-- =============================================================================
-- 5. dados_regras_rh — base de conhecimento (não é dado pessoal)
-- =============================================================================
create table public.dados_regras_rh (
  id             bigint generated always as identity primary key,
  codigo         text not null unique,          -- ex.: FER-01
  tema           text not null,                 -- ex.: Férias
  titulo         text not null,
  descricao      text not null,
  base_legal     text,
  aplica_vinculo text not null default 'todos'
                 check (aplica_vinculo in ('todos', 'efetivo', 'contrato')),
  palavras_chave text[] not null default '{}',
  validado       boolean not null default false, -- true só após revisão da DGP
  ativo          boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- busca textual em português (para a IA / n8n)
  busca          tsvector generated always as (
                   to_tsvector('portuguese',
                     coalesce(tema, '') || ' ' || coalesce(titulo, '') || ' ' ||
                     coalesce(descricao, ''))
                 ) stored
);

create index idx_regras_rh_busca on public.dados_regras_rh using gin (busca);

create trigger trg_dados_regras_rh_updated_at
  before update on public.dados_regras_rh
  for each row execute function public.set_updated_at();


-- =============================================================================
-- 6. historico_mensagens — perguntas do servidor e respostas da IA
-- =============================================================================
create table public.historico_mensagens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  masp          text not null default public.masp_atual()
                references public.dados_funcionais (masp) on delete cascade,
  conversa_id   uuid not null default gen_random_uuid(), -- agrupa uma conversa
  pergunta      text not null check (char_length(pergunta) between 1 and 4000),
  resposta      text,
  status        text not null default 'pendente'
                check (status in ('pendente', 'respondida', 'erro')),
  created_at    timestamptz not null default now(),
  respondida_em timestamptz
);

create index idx_historico_masp_data
  on public.historico_mensagens (masp, created_at desc);
create index idx_historico_conversa
  on public.historico_mensagens (conversa_id, created_at);


-- =============================================================================
-- Permissões (GRANTs) — defesa em profundidade, além do RLS
-- =============================================================================
-- Visitante não logado (anon) não acessa nada.
revoke all on
  public.dados_funcionais, public.perfis, public.dados_frequencia,
  public.dados_ferias, public.dados_ferias_periodos, public.dados_folgas,
  public.dados_regras_rh, public.historico_mensagens,
  public.vw_saldo_ferias, public.vw_saldo_folgas
from anon;

-- Servidor logado: só leitura nos dados de RH.
revoke all on
  public.dados_funcionais, public.perfis, public.dados_frequencia,
  public.dados_ferias, public.dados_ferias_periodos, public.dados_folgas,
  public.dados_regras_rh, public.historico_mensagens,
  public.vw_saldo_ferias, public.vw_saldo_folgas
from authenticated;

grant select on
  public.dados_funcionais, public.perfis, public.dados_frequencia,
  public.dados_ferias, public.dados_ferias_periodos, public.dados_folgas,
  public.dados_regras_rh, public.vw_saldo_ferias, public.vw_saldo_folgas
to authenticated;

-- Histórico: ler, criar e completar a resposta (sem alterar pergunta/dono).
grant select, insert on public.historico_mensagens to authenticated;
grant update (resposta, status, respondida_em) on public.historico_mensagens
  to authenticated;


-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.dados_funcionais       enable row level security;
alter table public.perfis                 enable row level security;
alter table public.dados_frequencia       enable row level security;
alter table public.dados_ferias           enable row level security;
alter table public.dados_ferias_periodos  enable row level security;
alter table public.dados_folgas           enable row level security;
alter table public.dados_regras_rh        enable row level security;
alter table public.historico_mensagens    enable row level security;

-- Dados pessoais de RH: cada um lê só o próprio MASP. Sem políticas de escrita.
create policy "servidor le o proprio cadastro"
  on public.dados_funcionais for select to authenticated
  using (masp = (select public.masp_atual()));

create policy "servidor le o proprio perfil"
  on public.perfis for select to authenticated
  using (user_id = (select auth.uid()));

create policy "servidor le a propria frequencia"
  on public.dados_frequencia for select to authenticated
  using (masp = (select public.masp_atual()));

create policy "servidor le as proprias ferias"
  on public.dados_ferias for select to authenticated
  using (masp = (select public.masp_atual()));

create policy "servidor le os proprios periodos de ferias"
  on public.dados_ferias_periodos for select to authenticated
  using (masp = (select public.masp_atual()));

create policy "servidor le as proprias folgas"
  on public.dados_folgas for select to authenticated
  using (masp = (select public.masp_atual()));

-- Regras de RH: conhecimento geral, qualquer servidor logado lê as ativas.
create policy "servidor le regras ativas"
  on public.dados_regras_rh for select to authenticated
  using (ativo);

-- Histórico: o próprio servidor lê, cria e atualiza só as próprias mensagens.
create policy "servidor le o proprio historico"
  on public.historico_mensagens for select to authenticated
  using (user_id = (select auth.uid()) and masp = (select public.masp_atual()));

create policy "servidor cria mensagens no proprio historico"
  on public.historico_mensagens for insert to authenticated
  with check (user_id = (select auth.uid()) and masp = (select public.masp_atual()));

create policy "servidor atualiza o proprio historico"
  on public.historico_mensagens for update to authenticated
  using (user_id = (select auth.uid()) and masp = (select public.masp_atual()))
  with check (user_id = (select auth.uid()) and masp = (select public.masp_atual()));
