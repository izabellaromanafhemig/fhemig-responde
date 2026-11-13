-- =============================================================================
-- Fhemigo Responde — PERFIL GESTOR e PAINEL DE QUALIDADE
-- Requer 001 e 007. Pode ser executado mais de uma vez.
--
-- O gestor (ex.: equipe da DGP) acessa a página /gestor, que mostra a
-- qualidade das respostas do Fhemigo e a lista de respostas com 👎 para
-- revisão. O gestor continua sendo servidor (vê os próprios dados normalmente).
--
-- Segurança:
--  * O papel fica em perfis.papel. Servidores não têm permissão de alterar a
--    tabela perfis, então ninguém se promove sozinho.
--  * O gestor NÃO lê a tabela historico_mensagens diretamente: só acessa as
--    funções painel_* abaixo, que conferem o papel e NÃO devolvem MASP, nome
--    ou id de usuário de quem perguntou (minimização — LGPD).
--
-- Para tornar alguém gestor (o servidor precisa já ter feito o cadastro):
--   update public.perfis set papel = 'gestor' where masp = '91000406';
-- Para voltar a servidor:
--   update public.perfis set papel = 'servidor' where masp = '91000406';
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Papel do usuário
-- -----------------------------------------------------------------------------
alter table public.perfis
  add column if not exists papel text not null default 'servidor';

alter table public.perfis drop constraint if exists ck_perfis_papel;
alter table public.perfis
  add constraint ck_perfis_papel check (papel in ('servidor', 'gestor'));

create or replace function public.eh_gestor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p
    where p.user_id = (select auth.uid()) and p.papel = 'gestor'
  )
$$;

revoke all on function public.eh_gestor() from public, anon;
grant execute on function public.eh_gestor() to authenticated;


-- -----------------------------------------------------------------------------
-- Revisão das respostas com 👎
-- (servidores não recebem permissão de escrita nessas colunas)
-- -----------------------------------------------------------------------------
alter table public.historico_mensagens
  add column if not exists revisada_em timestamptz,
  add column if not exists revisada_por text,
  add column if not exists nota_revisao text;

alter table public.historico_mensagens drop constraint if exists ck_nota_revisao;
alter table public.historico_mensagens
  add constraint ck_nota_revisao
    check (nota_revisao is null or char_length(nota_revisao) <= 1000);

create index if not exists idx_historico_avaliacao
  on public.historico_mensagens (avaliacao, created_at desc)
  where avaliacao is not null;


-- -----------------------------------------------------------------------------
-- Função interna: barra quem não é gestor
-- -----------------------------------------------------------------------------
create or replace function public.exigir_gestor()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.eh_gestor() then
    raise exception 'ACESSO_RESTRITO_GESTOR' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.exigir_gestor() from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- painel_resumo: números do período [p_inicio, p_fim)
-- -----------------------------------------------------------------------------
create or replace function public.painel_resumo(p_inicio timestamptz, p_fim timestamptz)
returns table (
  perguntas           integer,
  respondidas         integer,
  sem_resposta        integer,
  avaliadas           integer,
  positivas           integer,
  negativas           integer,
  negativas_pendentes integer,
  servidores          integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exigir_gestor();
  return query
  select
    count(*)::int,
    count(*) filter (where h.status = 'respondida')::int,
    count(*) filter (where h.status <> 'respondida')::int,
    count(*) filter (where h.avaliacao is not null)::int,
    count(*) filter (where h.avaliacao = 1)::int,
    count(*) filter (where h.avaliacao = -1)::int,
    count(*) filter (where h.avaliacao = -1 and h.revisada_em is null)::int,
    count(distinct h.masp)::int
  from public.historico_mensagens h
  where h.created_at >= p_inicio and h.created_at < p_fim;
end;
$$;


-- -----------------------------------------------------------------------------
-- painel_semanal: evolução por semana (fuso de Brasília)
-- -----------------------------------------------------------------------------
create or replace function public.painel_semanal(p_inicio timestamptz, p_fim timestamptz)
returns table (
  semana      date,
  perguntas   integer,
  respondidas integer,
  avaliadas   integer,
  positivas   integer,
  negativas   integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exigir_gestor();
  return query
  select
    date_trunc('week', h.created_at at time zone 'America/Sao_Paulo')::date as semana,
    count(*)::int,
    count(*) filter (where h.status = 'respondida')::int,
    count(*) filter (where h.avaliacao is not null)::int,
    count(*) filter (where h.avaliacao = 1)::int,
    count(*) filter (where h.avaliacao = -1)::int
  from public.historico_mensagens h
  where h.created_at >= p_inicio and h.created_at < p_fim
  group by 1
  order by 1 desc;
end;
$$;


-- -----------------------------------------------------------------------------
-- painel_avaliacoes: lista para revisão (sem identificar quem perguntou)
--   p_tipo: 'pendentes' (👎 não revisadas), 'revisadas' (👎 já revisadas),
--           'positivas' (👍), 'sem_resposta' (erro / pendente)
-- -----------------------------------------------------------------------------
create or replace function public.painel_avaliacoes(
  p_inicio timestamptz,
  p_fim    timestamptz,
  p_tipo   text default 'pendentes',
  p_limite integer default 100
)
returns table (
  id                   uuid,
  perguntada_em        timestamptz,
  avaliada_em          timestamptz,
  pergunta             text,
  resposta             text,
  status               text,
  avaliacao            smallint,
  comentario_avaliacao text,
  revisada_em          timestamptz,
  revisada_por         text,
  nota_revisao         text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exigir_gestor();
  return query
  select h.id, h.created_at, h.avaliada_em, h.pergunta, h.resposta, h.status,
         h.avaliacao, h.comentario_avaliacao, h.revisada_em, h.revisada_por, h.nota_revisao
  from public.historico_mensagens h
  where h.created_at >= p_inicio and h.created_at < p_fim
    and case p_tipo
          when 'pendentes'    then h.avaliacao = -1 and h.revisada_em is null
          when 'revisadas'    then h.avaliacao = -1 and h.revisada_em is not null
          when 'positivas'    then h.avaliacao = 1
          when 'sem_resposta' then h.status <> 'respondida'
          else false
        end
  order by coalesce(h.avaliada_em, h.created_at) desc
  limit least(greatest(coalesce(p_limite, 100), 1), 500);
end;
$$;


-- -----------------------------------------------------------------------------
-- marcar_revisada: gestor registra que tratou uma resposta com 👎
--   p_revisada = false desfaz a revisão
-- -----------------------------------------------------------------------------
create or replace function public.marcar_revisada(
  p_id       uuid,
  p_nota     text default null,
  p_revisada boolean default true
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.exigir_gestor();
  update public.historico_mensagens h
     set revisada_em  = case when p_revisada then now() else null end,
         revisada_por = case when p_revisada then public.masp_atual() else null end,
         nota_revisao = case when p_revisada then nullif(left(trim(p_nota), 1000), '') else null end
   where h.id = p_id and h.avaliacao = -1;
  if not found then
    raise exception 'MENSAGEM_NAO_ENCONTRADA' using errcode = 'P0002';
  end if;
end;
$$;


-- -----------------------------------------------------------------------------
-- Permissões das funções do painel
-- -----------------------------------------------------------------------------
revoke all on function public.painel_resumo(timestamptz, timestamptz) from public, anon;
revoke all on function public.painel_semanal(timestamptz, timestamptz) from public, anon;
revoke all on function public.painel_avaliacoes(timestamptz, timestamptz, text, integer) from public, anon;
revoke all on function public.marcar_revisada(uuid, text, boolean) from public, anon;

grant execute on function public.painel_resumo(timestamptz, timestamptz) to authenticated;
grant execute on function public.painel_semanal(timestamptz, timestamptz) to authenticated;
grant execute on function public.painel_avaliacoes(timestamptz, timestamptz, text, integer) to authenticated;
grant execute on function public.marcar_revisada(uuid, text, boolean) to authenticated;
