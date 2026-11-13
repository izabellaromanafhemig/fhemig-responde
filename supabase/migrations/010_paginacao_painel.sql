-- =============================================================================
-- Fhemigo Responde — PAGINAÇÃO da lista de respostas do painel do gestor
-- Substitui painel_avaliacoes (008) por uma versão com p_offset.
-- Requer 008. Pode ser executado mais de uma vez.
-- =============================================================================

drop function if exists public.painel_avaliacoes(timestamptz, timestamptz, text, integer);
drop function if exists public.painel_avaliacoes(timestamptz, timestamptz, text, integer, integer);

create function public.painel_avaliacoes(
  p_inicio timestamptz,
  p_fim    timestamptz,
  p_tipo   text    default 'pendentes',
  p_limite integer default 20,
  p_offset integer default 0
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
  -- ordem estável (id desempata) para as páginas não repetirem itens
  order by coalesce(h.avaliada_em, h.created_at) desc, h.id
  limit least(greatest(coalesce(p_limite, 20), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.painel_avaliacoes(timestamptz, timestamptz, text, integer, integer)
  from public, anon;
grant execute on function public.painel_avaliacoes(timestamptz, timestamptz, text, integer, integer)
  to authenticated;
