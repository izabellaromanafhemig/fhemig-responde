-- =============================================================================
-- Fhemigo Responde — DADOS FICTÍCIOS PARA TESTE
-- Execute depois de 001_initial_schema.sql. NÃO use em produção.
-- Nenhuma pessoa real: nomes e MASPs são inventados.
--
-- Para testar o isolamento, cadastre-se no app com dois MASPs diferentes
-- (ex.: 90000011 = "João" e 90000029 = "Ana") e confira que cada um só vê
-- os próprios dados.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Cadastro funcional
-- -----------------------------------------------------------------------------
insert into public.dados_funcionais
  (masp, nome, data_admissao, vinculo, data_fim_prevista, formacao, carreira,
   categoria_profissional, unidade_lotacao)
values
  ('90000011', 'João Teste da Silva',     '2024-02-01', 'contrato', '2027-01-31',
   'superior',           'MED',  'Médico Clínico',          'Hospital Teste A'),
  ('90000029', 'Ana Teste Pereira',       '2012-03-15', 'efetivo',  null,
   'especializacao',     'PENF', 'Enfermeira',              'Hospital Teste A'),
  ('90000037', 'Maria Teste Souza',       '2016-08-01', 'efetivo',  null,
   'mestrado',           'AGAS', 'Psicóloga',               'Hospital Teste B'),
  ('90000045', 'Carlos Teste Oliveira',   '2025-06-02', 'contrato', '2026-12-15',
   'ensino_tecnico',     'PENF', 'Técnico de Enfermagem',   'Hospital Teste B'),
  ('90000053', 'Pedro Teste Lima',        '2009-11-03', 'efetivo',  null,
   'ensino_fundamental', 'AUAS', 'Auxiliar de Serviços',    'Hospital Teste A');


-- -----------------------------------------------------------------------------
-- 2. Frequência (agosto a outubro de 2026)
-- -----------------------------------------------------------------------------
insert into public.dados_frequencia
  (masp, mes_referencia, quantidade_faltas, horas_extras_autorizadas, observacao)
values
  ('90000011', '2026-08-01', 0, 12.00, null),
  ('90000011', '2026-09-01', 1,  6.00, 'Falta justificada por atestado'),
  ('90000011', '2026-10-01', 0, 18.00, null),
  ('90000029', '2026-08-01', 0,  0.00, null),
  ('90000029', '2026-09-01', 0,  8.00, null),
  ('90000029', '2026-10-01', 2,  0.00, 'Uma falta sem justificativa'),
  ('90000037', '2026-08-01', 0,  0.00, null),
  ('90000037', '2026-09-01', 0,  0.00, null),
  ('90000037', '2026-10-01', 0,  4.00, null),
  ('90000045', '2026-08-01', 3, 24.00, null),
  ('90000045', '2026-09-01', 0, 30.00, null),
  ('90000045', '2026-10-01', 1, 12.00, null),
  ('90000053', '2026-10-01', 0,  0.00, null);


-- -----------------------------------------------------------------------------
-- 3. Férias: direito anual + períodos
-- -----------------------------------------------------------------------------
insert into public.dados_ferias (masp, ano_referencia, dias_direito) values
  ('90000011', 2026, 30),
  ('90000029', 2026, 25),
  ('90000037', 2026, 25),
  ('90000045', 2026, 30),
  ('90000053', 2026, 25);

insert into public.dados_ferias_periodos
  (masp, ano_referencia, data_inicio, data_fim, dias, situacao)
values
  -- João: tirou 15, tem 15 programados para janeiro
  ('90000011', 2026, '2026-07-06', '2026-07-20', 15, 'gozada'),
  ('90000011', 2026, '2027-01-04', '2027-01-18', 15, 'programada'),
  -- Ana: tirou 10, programou 15, cancelou um período antigo
  ('90000029', 2026, '2026-04-06', '2026-04-17', 10, 'gozada'),
  ('90000029', 2026, '2026-05-04', '2026-05-08',  5, 'cancelada'),
  ('90000029', 2026, '2026-12-07', '2026-12-29', 15, 'programada'),
  -- Maria: tirou tudo
  ('90000037', 2026, '2026-02-02', '2026-03-06', 25, 'gozada'),
  -- Carlos: nada marcado ainda
  -- Pedro: em gozo agora (ajuste as datas se testar em outra época)
  ('90000053', 2026, '2026-11-09', '2026-11-27', 15, 'em_gozo');


-- -----------------------------------------------------------------------------
-- 4. Folgas compensativas (extrato)
-- -----------------------------------------------------------------------------
insert into public.dados_folgas
  (masp, tipo, dias, origem, data_referencia, validade, descricao)
values
  ('90000011', 'credito', 2, 'servico_eleitoral', '2026-10-04', null,
   'Convocação como mesário — 1º turno (dispensa em dobro)'),
  ('90000011', 'debito',  1, 'gozo',              '2026-10-16', null,
   'Folga usufruída'),
  ('90000029', 'credito', 1, 'plantao_feriado',   '2026-09-07', '2027-03-07',
   'Plantão no feriado de 7 de setembro'),
  ('90000029', 'credito', 1, 'horas_extras',      '2026-10-31', '2027-04-30',
   'Conversão de 8h extras autorizadas em folga'),
  ('90000029', 'debito',  1, 'gozo',              '2026-11-20', null,
   'Folga agendada'),
  ('90000045', 'credito', 2, 'plantao_feriado',   '2026-11-02', '2027-05-02',
   'Plantões em feriados');


-- -----------------------------------------------------------------------------
-- 5. Regras de RH (TESTE — validado = false)
-- Texto simplificado para testar a IA. Antes de uso real, a DGP precisa
-- revisar cada regra e a base legal, e marcar validado = true.
-- -----------------------------------------------------------------------------
insert into public.dados_regras_rh
  (codigo, tema, titulo, descricao, base_legal, aplica_vinculo, palavras_chave)
values
  ('FER-01', 'Férias', 'Direito a férias anuais',
   'O servidor efetivo tem direito a férias anuais, gozadas conforme a escala '
   'aprovada pela chefia. No Estatuto de MG o direito é de 25 dias úteis por ano.',
   'Lei Estadual nº 869/1952 (Estatuto), art. 152 — confirmar redação vigente',
   'efetivo', array['férias', 'dias', 'direito', 'anual']),

  ('FER-02', 'Férias', 'Adicional de 1/3 de férias',
   'Ao sair de férias, o servidor recebe um adicional de, no mínimo, um terço '
   'da remuneração normal.',
   'Constituição Federal, art. 7º, XVII, c/c art. 39, § 3º',
   'todos', array['terço', '1/3', 'adicional', 'férias', 'pagamento']),

  ('FER-03', 'Férias', 'Férias de contratados temporários',
   'O contratado temporário tem direito a férias e ao terço constitucional, '
   'inclusive proporcionais ao fim do contrato. Regras específicas a confirmar '
   'com a DGP.',
   'Lei Estadual nº 23.750/2020 — a confirmar',
   'contrato', array['férias', 'contrato', 'temporário', 'proporcional']),

  ('FER-04', 'Férias', 'Alteração de férias programadas',
   'Mudanças em férias já programadas dependem de pedido à chefia imediata e '
   'de registro pelo RH da unidade antes do início do período.',
   'Norma interna — a confirmar',
   'todos', array['alterar', 'remarcar', 'cancelar', 'férias', 'escala']),

  ('FOL-01', 'Folgas', 'Folga por serviço eleitoral',
   'Quem é convocado pela Justiça Eleitoral (mesário, apoio etc.) tem direito '
   'a dispensa do serviço pelo dobro dos dias de convocação, sem prejuízo da '
   'remuneração, mediante apresentação da declaração do cartório eleitoral.',
   'Lei Federal nº 9.504/1997, art. 98',
   'todos', array['eleição', 'mesário', 'folga', 'dobro', 'TRE']),

  ('FOL-02', 'Folgas', 'Folga compensativa por trabalho extra',
   'Horas trabalhadas além da jornada ou plantões em feriados podem ser '
   'compensados em folga, desde que autorizados previamente pela chefia. O '
   'gozo da folga também depende de agendamento com a chefia.',
   'Norma interna — a confirmar',
   'todos', array['folga', 'compensativa', 'banco de horas', 'feriado', 'plantão']),

  ('FRE-01', 'Frequência', 'Faltas sem justificativa',
   'Faltas não justificadas geram desconto na remuneração do dia e podem ter '
   'reflexos em férias e na avaliação de desempenho.',
   'Estatuto (Lei Estadual nº 869/1952) — artigo a confirmar',
   'todos', array['falta', 'desconto', 'injustificada', 'frequência']),

  ('FRE-02', 'Frequência', 'Atestado médico',
   'Afastamentos por motivo de saúde devem ser comunicados à chefia e o '
   'atestado registrado conforme as normas de perícia médica do Estado, '
   'dentro do prazo definido pelo RH.',
   'Normas de perícia médica do Estado de MG — prazo a confirmar',
   'todos', array['atestado', 'doença', 'perícia', 'licença saúde']),

  ('HEX-01', 'Horas extras', 'Autorização de horas extras',
   'Só são pagas ou convertidas em folga as horas extras autorizadas '
   'previamente pela chefia e registradas no sistema de frequência.',
   'Norma interna — a confirmar',
   'todos', array['hora extra', 'autorização', 'pagamento', 'plantão extra']),

  ('LIC-01', 'Licenças', 'Licença-maternidade',
   'A servidora gestante tem direito a licença-maternidade remunerada. Em MG '
   'o prazo foi ampliado para 180 dias.',
   'CF, art. 7º, XVIII; legislação estadual de ampliação — a confirmar',
   'todos', array['maternidade', 'gestante', 'licença', 'bebê', 'adoção']),

  ('LIC-02', 'Licenças', 'Licença-paternidade',
   'O servidor tem direito a licença-paternidade remunerada de, no mínimo, '
   '5 dias. Verificar eventual ampliação na legislação estadual.',
   'CF, art. 7º, XIX; ADCT, art. 10, § 1º — ampliação estadual a confirmar',
   'todos', array['paternidade', 'pai', 'nascimento', 'licença']),

  ('REM-01', 'Remuneração', '13º salário (gratificação natalina)',
   'O servidor recebe a gratificação natalina com base na remuneração de '
   'dezembro, proporcional aos meses trabalhados no ano.',
   'CF, art. 7º, VIII, c/c art. 39, § 3º',
   'todos', array['13º', 'décimo terceiro', 'gratificação natalina', 'dezembro']),

  ('CON-01', 'Contrato', 'Término do contrato temporário',
   'O contrato temporário termina na data prevista. A prorrogação só ocorre '
   'por ato formal, dentro dos limites da lei, antes do término.',
   'Lei Estadual nº 23.750/2020 — a confirmar',
   'contrato', array['contrato', 'fim', 'término', 'prorrogação', 'renovação']),

  ('GER-01', 'Atendimento', 'Quando procurar o RH',
   'Dúvidas não respondidas pelo assistente, correções de dados e pedidos '
   'formais devem ser encaminhados ao RH da unidade de lotação.',
   'Orientação interna',
   'todos', array['contato', 'RH', 'atendimento', 'correção']);
