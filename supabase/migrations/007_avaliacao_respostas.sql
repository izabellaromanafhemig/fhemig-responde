-- =============================================================================
-- Fhemigo Responde — AVALIAÇÃO DAS RESPOSTAS (👍 / 👎)
-- O servidor avalia cada resposta do Fhemigo; o RH acompanha a qualidade.
--
-- Pode ser executado mais de uma vez.
--
-- Para o RH acompanhar (SQL Editor do Supabase):
--   select * from public.vw_qualidade_respostas;          -- resumo por semana
--   select * from public.vw_respostas_negativas;          -- respostas com 👎
-- =============================================================================

alter table public.historico_mensagens
  add column if not exists avaliacao smallint,
  add column if not exists comentario_avaliacao text,
  add column if not exists avaliada_em timestamptz;

alter table public.historico_mensagens
  drop constraint if exists ck_avaliacao_valor,
  drop constraint if exists ck_avaliacao_comentario,
  drop constraint if exists ck_avaliacao_so_com_resposta;

alter table public.historico_mensagens
  add constraint ck_avaliacao_valor
    check (avaliacao is null or avaliacao in (-1, 1)),          -- -1 = 👎, 1 = 👍
  add constraint ck_avaliacao_comentario
    check (comentario_avaliacao is null or char_length(comentario_avaliacao) <= 1000),
  add constraint ck_avaliacao_so_com_resposta
    check (avaliacao is null or resposta is not null);           -- só avalia o que foi respondido

-- O servidor pode gravar a avaliação nas PRÓPRIAS mensagens
-- (a política "servidor atualiza o proprio historico" do 001 já limita às linhas dele).
grant update (avaliacao, comentario_avaliacao, avaliada_em)
  on public.historico_mensagens to authenticated;


-- -----------------------------------------------------------------------------
-- Visões para o RH (sem acesso para servidores: só SQL Editor / service_role)
-- -----------------------------------------------------------------------------
create or replace view public.vw_qualidade_respostas as
select
  date_trunc('week', created_at at time zone 'America/Sao_Paulo')::date as semana,
  count(*) filter (where status = 'respondida')                        as respondidas,
  count(*) filter (where avaliacao is not null)                        as avaliadas,
  count(*) filter (where avaliacao = 1)                                as positivas,
  count(*) filter (where avaliacao = -1)                               as negativas,
  round(100.0 * count(*) filter (where avaliacao = 1)
        / nullif(count(*) filter (where avaliacao is not null), 0), 1) as pct_positivas,
  round(100.0 * count(*) filter (where avaliacao is not null)
        / nullif(count(*) filter (where status = 'respondida'), 0), 1) as pct_avaliadas
from public.historico_mensagens
group by 1
order by 1 desc;

comment on view public.vw_qualidade_respostas is
  'Resumo semanal: respostas dadas, avaliadas, % de 👍. Uso do RH.';

create or replace view public.vw_respostas_negativas as
select
  h.avaliada_em,
  h.created_at as perguntada_em,
  h.masp,
  h.pergunta,
  h.resposta,
  h.comentario_avaliacao,
  h.id
from public.historico_mensagens h
where h.avaliacao = -1
order by h.avaliada_em desc nulls last;

comment on view public.vw_respostas_negativas is
  'Respostas avaliadas com 👎, com o comentário do servidor. Uso do RH.';

revoke all on public.vw_qualidade_respostas, public.vw_respostas_negativas
  from anon, authenticated;
