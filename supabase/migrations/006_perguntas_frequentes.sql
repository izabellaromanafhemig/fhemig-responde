-- =============================================================================
-- Fhemigo Responde — PERGUNTAS FREQUENTES
-- Tabela com perguntas e respostas prontas, exibidas na página
-- "Perguntas frequentes". Conteúdo baseado nas regras validadas
-- (003, 004 e 005). Cada resposta indica os códigos das regras de origem.
--
-- Leitura: qualquer servidor logado. Escrita: só RH/admin (service_role),
-- direto no Supabase (Table Editor).
-- Pode ser executado mais de uma vez: atualiza pelo "slug".
-- =============================================================================

create table if not exists public.perguntas_frequentes (
  id         bigint generated always as identity primary key,
  slug       text not null unique check (slug ~ '^[a-z0-9-]+$'), -- âncora na página
  tema       text not null,
  pergunta   text not null,
  resposta   text not null,
  regras     text[] not null default '{}',                     -- ex.: {FER-01}
  ordem      integer not null default 0,                       -- ordem dentro do tema
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_perguntas_frequentes_updated_at on public.perguntas_frequentes;
create trigger trg_perguntas_frequentes_updated_at
  before update on public.perguntas_frequentes
  for each row execute function public.set_updated_at();

revoke all on public.perguntas_frequentes from anon, authenticated;
grant select on public.perguntas_frequentes to authenticated;

alter table public.perguntas_frequentes enable row level security;

drop policy if exists "servidor le perguntas ativas" on public.perguntas_frequentes;
create policy "servidor le perguntas ativas"
  on public.perguntas_frequentes for select to authenticated
  using (ativo);


-- -----------------------------------------------------------------------------
-- Conteúdo inicial
-- -----------------------------------------------------------------------------
insert into public.perguntas_frequentes (slug, tema, ordem, pergunta, resposta, regras)
values
  -- ============================================================ Férias
  ('ferias-quantos-dias', 'Férias', 1,
   'Quantos dias de férias eu tenho por ano?',
   'São 25 dias úteis por ano, tanto para efetivos quanto para contratados. Sábados, '
   'domingos e feriados nacionais não contam como dias de férias; ponto facultativo '
   'conta como dia útil. Quem doa sangue a banco de sangue estadual ganha 1 dia a mais.',
   array['FER-01', 'FER-03', 'FER-05']),

  ('ferias-primeiras', 'Férias', 2,
   'Quando posso tirar minhas primeiras férias?',
   'As primeiras férias só podem ser tiradas depois de 11 meses de efetivo exercício.',
   array['FER-04']),

  ('ferias-como-marcar', 'Férias', 3,
   'Como marco minhas férias?',
   'A unidade monta a escala de férias e você precisa estar incluído nela. Faça o pedido '
   'no Ponto Digital (Requerimentos › aba "Férias regulamentares" › "Solicitar '
   'Marcação") ou, se não houver Ponto Digital, no SEI, pelo formulário "RH – Férias '
   'Regulamentares – Requerimento". A chefia imediata aprova ou nega. O prazo para '
   'marcar é definido pelo RH da sua unidade.',
   array['FER-06']),

  ('ferias-dividir', 'Férias', 4,
   'Posso dividir minhas férias?',
   'Sim, em no máximo 2 períodos, e cada período precisa ter pelo menos 10 dias úteis.',
   array['FER-07']),

  ('ferias-acumular', 'Férias', 5,
   'Posso deixar férias para o ano seguinte?',
   'Não. As férias devem ser tiradas dentro do ano a que se referem, e o último período '
   'tem que começar até o último dia útil desse ano. Não é permitido acumular férias. '
   'Só em casos excepcionais a Administração aceita dois períodos no mesmo ano, gozados '
   'em datas alternadas.',
   array['FER-08']),

  ('ferias-remarcar', 'Férias', 6,
   'Como remarco ou desmarco minhas férias?',
   'Com autorização da chefia imediata, pelo Ponto Digital ("Solicitar Remarcação") ou '
   'pelo SEI ("RH – Férias Regulamentares – Req. de Alteração"). Não existe pedido de '
   'cancelamento: quem não vai tirar as férias na data marcada faz um pedido de '
   'alteração. Se você entrar em licença de saúde antes do início, as férias podem ser '
   'remarcadas para depois da licença.',
   array['FER-10']),

  ('ferias-terco', 'Férias', 7,
   'Quando recebo o 1/3 de férias?',
   'O adicional de 1/3 é pago de uma só vez, no mês em que começa o primeiro período, '
   'mesmo quando as férias são divididas.',
   array['FER-02']),

  ('ferias-doente', 'Férias', 8,
   'Fiquei doente durante as férias. Elas são interrompidas?',
   'Não. Licença de saúde, luto, casamento ou paternidade que caia durante as férias não '
   'as interrompe. A exceção é o parto antecipado: nesse caso as férias são '
   'interrompidas e o saldo é gozado logo após o fim da licença-maternidade.',
   array['FER-14', 'FER-13']),

  ('ferias-convocado', 'Férias', 9,
   'Fui chamado de volta durante as férias. O que acontece com os dias que faltaram?',
   'A interrupção só pode acontecer em caso de urgência comprovada pela chefia, com '
   'ciência da autoridade superior. Os dias que sobraram viram folgas compensatórias, '
   'que devem ser usadas em até 5 anos.',
   array['FER-12', 'FOL-03']),

  -- ============================================================ Folgas
  ('folga-o-que-e', 'Folgas compensatórias', 1,
   'O que é folga compensatória?',
   'É um dia de descanso concedido para compensar um serviço prestado, como a '
   'convocação pela Justiça Eleitoral ou a interrupção das suas férias. "Folga '
   'compensatória" e "folga compensativa" são a mesma coisa. Seu saldo aparece na '
   'página de início.',
   array['FOL-01', 'FER-12']),

  ('folga-eleitoral', 'Folgas compensatórias', 2,
   'Trabalhei nas eleições. Quantos dias de folga eu ganho?',
   'Quem é convocado pela Justiça Eleitoral (mesário, apoio etc.) tem direito ao dobro '
   'dos dias de convocação, sem prejuízo do salário. Apresente a declaração do cartório '
   'eleitoral.',
   array['FOL-01']),

  ('folga-prazo', 'Folgas compensatórias', 3,
   'Qual o prazo para usar minhas folgas?',
   'As folgas que vêm da interrupção das férias devem ser usadas em até 5 anos. Para as '
   'demais, confira a validade no seu extrato de folgas e agende com a chefia antes do '
   'vencimento.',
   array['FOL-03']),

  -- ============================================================ Faltas
  ('faltas-justificadas', 'Faltas e frequência', 1,
   'Quais ausências podem ser justificadas?',
   'Com comprovação: consulta médica ou odontológica e perícia médica; doação de sangue '
   '(dispensa no dia); prova ou exame escolar; curso ou treinamento autorizado pelo '
   'órgão; júri e outros serviços obrigatórios por lei; licenças e afastamentos legais, '
   'como licença-saúde, licença-gestante e acidente em serviço; casamento ou luto (até '
   '8 dias). Situações excepcionais, como enchente ou greve de transporte, só com '
   'aprovação da SEPLAG. Falta sem justificativa não pode ser abonada.',
   array['FRE-01', 'FRE-02', 'FRE-05', 'FRE-06', 'LIC-04', 'LIC-05']),

  ('faltas-prazo-justificar', 'Faltas e frequência', 2,
   'Qual o prazo para justificar uma falta no Ponto Digital?',
   'Pela regra mais recente conhecida: até o 4º dia útil do mês seguinte você lança a '
   'justificativa e anexa os documentos; até o 6º dia útil a chefia avalia (se não '
   'avaliar, a justificativa é aceita automaticamente); até o 7º dia útil você assina a '
   'folha. Atenção: a resolução que define esses prazos aparece como revogada desde '
   '15/10/2026. Confirme com o RH da sua unidade os prazos em vigor.',
   array['FRE-03']),

  ('faltas-desconto-atraso', 'Faltas e frequência', 3,
   'Quanto é descontado se eu chegar atrasado ou sair mais cedo?',
   'Atraso de até 55 minutos: 1/5 do dia. Atraso de mais de 55 minutos: o dia inteiro. '
   'Saída no fim da 2ª hora: 4/5 do dia; durante a 3ª hora: 3/5; durante a 4ª hora: '
   '2/5; a partir da 5ª hora: 1/5. Falta no dia inteiro desconta o dia inteiro, e em '
   'faltas seguidas também são descontados os sábados, domingos e feriados no meio.',
   array['FRE-04', 'FRE-08']),

  ('faltas-luto-casamento', 'Faltas e frequência', 4,
   'Quantos dias posso faltar por casamento ou falecimento na família?',
   'Até 8 dias, sem perda do salário, em caso de casamento ou de falecimento de cônjuge, '
   'filho, pai, mãe ou irmão.',
   array['LIC-04', 'LIC-05']),

  ('faltas-passei-mal', 'Faltas e frequência', 5,
   'Passei mal e não consegui ir trabalhar. O que eu faço?',
   'Avise a chefia imediatamente, por escrito ou por meio de outra pessoa. Depois, '
   'justifique a ausência com a comprovação (consulta, atestado ou licença-saúde).',
   array['FRE-07', 'FRE-02']),

  ('faltas-demissao', 'Faltas e frequência', 6,
   'Quantas faltas podem levar a punição ou demissão?',
   'Há abandono de cargo, que leva a demissão, com mais de 30 faltas seguidas sem '
   'justificativa ou mais de 90 faltas intercaladas no mesmo ano. Abaixo disso, a '
   'Corregedoria orienta: até 10 dias, arquivamento; de 11 a 30, repreensão; de 31 a '
   '89, suspensão. Atrasos e saídas antecipadas não se somam para virar dias de falta.',
   array['FRE-10', 'FRE-11']),

  -- ============================================================ Horas extras
  ('horas-banco', 'Horas extras', 1,
   'Como funciona o banco de horas?',
   'A compensação de horas deve ser feita dentro do mesmo mês, com autorização da chefia '
   'imediata. A hora extra vai de preferência para o banco de horas, com acréscimo de '
   '50%, e o banco só pode abonar ocorrências nos meses seguintes. O limite de serviço '
   'extraordinário é de 50 horas por mês; acima disso, só com autorização do Governador.',
   array['HEX-01', 'HEX-02']),

  -- ============================================================ Acúmulo
  ('acumulo-posso', 'Acúmulo de cargos', 1,
   'Posso ter outro vínculo público além da FHEMIG?',
   'Só em três casos: dois cargos de professor; um de professor e outro técnico ou '
   'científico; ou dois cargos de profissional de saúde com profissão regulamentada '
   '(como médico, enfermeiro, técnico de enfermagem, fisioterapeuta e farmacêutico). Os '
   'horários precisam ser compatíveis e nenhum dos cargos pode ser de dedicação '
   'exclusiva. A regra vale para vínculos federais, estaduais e municipais.',
   array['ACU-01', 'ACU-02', 'ACU-03']),

  ('acumulo-horarios', 'Acúmulo de cargos', 2,
   'Existe limite de horas ou intervalo entre os dois vínculos?',
   'É preciso ter pelo menos 15 minutos entre o fim de uma jornada e o início da outra. '
   'Esse intervalo não é exigido para profissional de saúde em plantão, mas continua '
   'obrigatório se os locais de trabalho forem diferentes. Não há limite fixo de horas '
   'semanais (como 60 horas): a compatibilidade é avaliada caso a caso.',
   array['ACU-04', 'ACU-05']),

  ('acumulo-declarar', 'Acúmulo de cargos', 3,
   'Como declaro que tenho dois vínculos?',
   'Informe no formulário de posse ("DRH_Posse – Novo Ingresso") e, em até 60 dias, '
   'assine no SEI a "RH – Declaração" de acumulação, com: declaração de todos os vínculos '
   'e atividades; quadro de horários preenchido pelo RH e assinado pela chefia; diploma ou '
   'registro no conselho; lei ou edital do cargo; e o último contracheque de cada vínculo. '
   'A análise leva até 90 dias e não há renovação anual.',
   array['ACU-09', 'ACU-10']),

  ('acumulo-ilegal', 'Acúmulo de cargos', 4,
   'E se meu acúmulo for considerado ilegal?',
   'A partir da publicação, você tem 30 dias para escolher um dos vínculos e pedir '
   'exoneração do outro, ou recorrer à Comissão de Acumulação da SEPLAG. Se o recurso '
   'for negado, são 10 dias para escolher. Sem escolha, o caso vai à Controladoria-Geral '
   'do Estado e pode levar à demissão.',
   array['ACU-11'])

on conflict (slug) do update set
  tema     = excluded.tema,
  ordem    = excluded.ordem,
  pergunta = excluded.pergunta,
  resposta = excluded.resposta,
  regras   = excluded.regras,
  ativo    = true;
