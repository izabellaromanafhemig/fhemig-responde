-- =============================================================================
-- Fhemigo Responde — ORIENTAÇÕES PARA A IA
-- Correções aprovadas pelo gestor que o agente (n8n) passa a seguir em todas
-- as respostas. Requer 001, 007 e 008. Pode ser executado mais de uma vez.
--
-- Regras:
--  * Só o gestor cria, edita, ativa/desativa e exclui (via funções abaixo).
--  * Servidores logados leem só texto e tema das orientações ATIVAS — é assim
--    que o n8n as busca, com o token do próprio servidor. Não é dado pessoal.
--  * Máximo de 30 orientações ativas (cada uma aumenta o prompt).
-- =============================================================================

create table if not exists public.orientacoes_ia (
  id                 bigint generated always as identity primary key,
  texto              text not null check (char_length(texto) between 10 and 1000),
  tema               text check (tema is null or char_length(tema) <= 60),
  ativa              boolean not null default true,
  origem_mensagem_id uuid references public.historico_mensagens (id) on delete set null,
  criada_por         text not null,
  criada_em          timestamptz not null default now(),
  atualizada_por     text,
  atualizada_em      timestamptz
);

create index if not exists idx_orientacoes_ativas on public.orientacoes_ia (ativa, criada_em);

alter table public.orientacoes_ia enable row level security;

-- Leitura direta: só orientações ativas e só as colunas não sensíveis
revoke all on public.orientacoes_ia from anon, authenticated;
grant select (id, texto, tema, ativa, criada_em) on public.orientacoes_ia to authenticated;

drop policy if exists "logados leem orientacoes ativas" on public.orientacoes_ia;
create policy "logados leem orientacoes ativas"
  on public.orientacoes_ia for select to authenticated
  using (ativa);


-- -----------------------------------------------------------------------------
-- Funções do gestor
-- -----------------------------------------------------------------------------
create or replace function public.verificar_limite_orientacoes()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.orientacoes_ia where ativa) >= 30 then
    raise exception 'LIMITE_ORIENTACOES_ATIVAS' using errcode = 'P0001',
      hint = 'Desative uma orientação antes de criar ou ativar outra.';
  end if;
end;
$$;
revoke all on function public.verificar_limite_orientacoes() from public, anon, authenticated;

create or replace function public.criar_orientacao(
  p_texto       text,
  p_tema        text default null,
  p_mensagem_id uuid default null
)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  perform public.exigir_gestor();
  perform public.verificar_limite_orientacoes();
  insert into public.orientacoes_ia (texto, tema, origem_mensagem_id, criada_por)
  values (trim(p_texto), nullif(trim(p_tema), ''), p_mensagem_id, public.masp_atual())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.atualizar_orientacao(
  p_id    bigint,
  p_texto text,
  p_tema  text,
  p_ativa boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ativa_atual boolean;
begin
  perform public.exigir_gestor();
  select ativa into v_ativa_atual from public.orientacoes_ia where id = p_id;
  if not found then
    raise exception 'ORIENTACAO_NAO_ENCONTRADA' using errcode = 'P0002';
  end if;
  if p_ativa and not v_ativa_atual then
    perform public.verificar_limite_orientacoes();
  end if;
  update public.orientacoes_ia
     set texto = trim(p_texto),
         tema = nullif(trim(p_tema), ''),
         ativa = p_ativa,
         atualizada_por = public.masp_atual(),
         atualizada_em = now()
   where id = p_id;
end;
$$;

create or replace function public.excluir_orientacao(p_id bigint)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform public.exigir_gestor();
  delete from public.orientacoes_ia where id = p_id;
  if not found then
    raise exception 'ORIENTACAO_NAO_ENCONTRADA' using errcode = 'P0002';
  end if;
end;
$$;

-- Lista completa para o painel (inclui inativas e autoria)
create or replace function public.painel_orientacoes()
returns table (
  id                 bigint,
  texto              text,
  tema               text,
  ativa              boolean,
  origem_mensagem_id uuid,
  criada_por         text,
  criada_em          timestamptz,
  atualizada_por     text,
  atualizada_em      timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.exigir_gestor();
  return query
  select o.id, o.texto, o.tema, o.ativa, o.origem_mensagem_id, o.criada_por,
         o.criada_em, o.atualizada_por, o.atualizada_em
  from public.orientacoes_ia o
  order by o.ativa desc, o.criada_em desc;
end;
$$;

revoke all on function public.criar_orientacao(text, text, uuid) from public, anon;
revoke all on function public.atualizar_orientacao(bigint, text, text, boolean) from public, anon;
revoke all on function public.excluir_orientacao(bigint) from public, anon;
revoke all on function public.painel_orientacoes() from public, anon;

grant execute on function public.criar_orientacao(text, text, uuid) to authenticated;
grant execute on function public.atualizar_orientacao(bigint, text, text, boolean) to authenticated;
grant execute on function public.excluir_orientacao(bigint) to authenticated;
grant execute on function public.painel_orientacoes() to authenticated;
