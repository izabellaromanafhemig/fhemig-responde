-- =============================================================================
-- Fhemigo Responde — regras de ACÚMULO DE CARGOS
-- Base: texto de referência da DGP (CF, art. 37, XVI, XVII e § 10;
-- Constituição de MG; Decreto nº 45.841/2011; Resolução SEPLAG nº 11/2012;
-- STF Temas 377, 384 e 1081; Lei 869/1952, art. 249).
--
-- Pode ser executado mais de uma vez: atualiza as regras pelo código.
-- Execute DEPOIS de 001.
-- =============================================================================

insert into public.dados_regras_rh
  (codigo, tema, titulo, descricao, base_legal, aplica_vinculo, palavras_chave, validado, ativo)
values
  -- ------------------------------------------------------------ quando pode
  ('ACU-01', 'Acúmulo de cargos', 'Quando é permitido acumular cargos',
   'Só é possível acumular dois vínculos públicos, e apenas nestes casos: dois cargos '
   'de professor; um cargo de professor e outro técnico ou científico; ou dois cargos '
   'ou empregos de profissional de saúde com profissão regulamentada, como médico, '
   'enfermeiro, técnico de enfermagem, fisioterapeuta e farmacêutico.',
   'CF, art. 37, XVI; Constituição do Estado de MG; Decreto nº 45.841/2011',
   'todos', array['acúmulo', 'acumular', 'dois vínculos', 'dois cargos', 'segundo emprego', 'outro emprego', 'profissional de saúde'],
   true, true),

  ('ACU-02', 'Acúmulo de cargos', 'Requisitos para acumular',
   'Além de estar em um dos casos permitidos, os horários dos dois vínculos precisam '
   'ser compatíveis e nenhum dos dois cargos pode ser de dedicação exclusiva.',
   'CF, art. 37, XVI; Decreto nº 45.841/2011',
   'todos', array['requisitos', 'compatibilidade', 'dedicação exclusiva', 'acúmulo'],
   true, true),

  ('ACU-03', 'Acúmulo de cargos', 'Vínculos que entram na regra',
   'A regra de acúmulo vale também para empregos e funções em autarquias, fundações '
   '(como a FHEMIG), empresas públicas e sociedades de economia mista, de qualquer '
   'esfera: federal, estadual ou municipal. Um vínculo na FHEMIG e outro em hospital '
   'municipal ou federal, por exemplo, entram na regra.',
   'CF, art. 37, XVII',
   'todos', array['prefeitura', 'municipal', 'federal', 'fundação', 'empresa pública', 'acúmulo'],
   true, true),

  -- ------------------------------------------------------------ horários
  ('ACU-04', 'Acúmulo de cargos', 'Intervalo entre as jornadas',
   'Entre o fim de uma jornada e o início da outra é preciso ter pelo menos 15 minutos. '
   'Esse intervalo não é exigido para o profissional de saúde em regime de plantão nem '
   'para o professor com aulas seguidas no mesmo turno, mas continua obrigatório quando '
   'os dois locais de trabalho são diferentes.',
   'Resolução SEPLAG nº 11/2012, art. 4º',
   'todos', array['intervalo', '15 minutos', 'plantão', 'horário', 'jornada', 'deslocamento'],
   true, true),

  ('ACU-05', 'Acúmulo de cargos', 'Limite de horas semanais',
   'O STF decidiu que a lei não pode fixar um teto de horas semanais (como 60 horas) '
   'para negar o acúmulo. O que vale é verificar, em cada caso, se os horários são '
   'realmente compatíveis. Não há limite numérico nas normas de MG.',
   'STF, Tema 1081',
   'todos', array['60 horas', 'limite de horas', 'carga horária', 'horas semanais', 'acúmulo'],
   true, true),

  ('ACU-06', 'Acúmulo de cargos', 'Controle da jornada nos dois vínculos',
   'A chefia imediata de cada cargo controla a pontualidade, a assiduidade e a carga '
   'horária declarada pelo servidor.',
   'Decreto nº 45.841/2011',
   'todos', array['chefia', 'controle', 'pontualidade', 'assiduidade', 'carga horária'],
   true, true),

  -- ------------------------------------------------------------ remuneração
  ('ACU-07', 'Acúmulo de cargos', 'Teto remuneratório no acúmulo',
   'No acúmulo permitido, o teto remuneratório (limite máximo de remuneração) vale '
   'para cada vínculo separadamente, e não para a soma dos dois salários.',
   'STF, Temas 377 e 384',
   'todos', array['teto', 'remuneração', 'salário', 'soma', 'acúmulo'],
   true, true),

  -- ------------------------------------------------------------ aposentados
  ('ACU-08', 'Acúmulo de cargos', 'Aposentado com novo vínculo',
   'Não se pode receber ao mesmo tempo aposentadoria do serviço público e salário de '
   'cargo ativo, com três exceções: quando os dois cargos podiam ser acumulados na '
   'ativa; cargos eletivos; e cargos em comissão. O aposentado que assume novo vínculo '
   'deve apresentar a documentação em até 60 dias depois de entrar no segundo vínculo.',
   'CF, art. 37, § 10; Decreto nº 45.841/2011',
   'todos', array['aposentado', 'aposentadoria', 'novo vínculo', 'cargo em comissão', 'acúmulo'],
   true, true),

  -- ------------------------------------------------------------ declaração
  ('ACU-09', 'Acúmulo de cargos', 'Como declarar o acúmulo',
   'Na posse, informe no formulário "DRH_Posse – Novo Ingresso" se tem outro vínculo '
   'ou se recebe aposentadoria. Em até 60 dias, assine no SEI a "RH – Declaração" de '
   'acumulação. Documentos exigidos: declaração de todos os vínculos, com a descrição '
   'das atividades; quadro de horários preenchido pelo RH e assinado pela chefia; '
   'diploma ou registro no conselho profissional; lei ou edital com as atribuições e '
   'a carga horária do cargo; e o último contracheque de cada vínculo.',
   'Decreto nº 45.841/2011; Resolução SEPLAG nº 11/2012',
   'todos', array['declarar', 'declaração', 'posse', 'SEI', 'documentos', 'quadro de horários', '60 dias'],
   true, true),

  ('ACU-10', 'Acúmulo de cargos', 'Análise do acúmulo',
   'A análise é feita pela SEPLAG, pela Diretoria Central de Gestão de Direitos do '
   'Servidor, ou pelo RH do órgão, se ele tiver certificação para isso, em até 90 dias. '
   'O resultado sai como ato declaratório de acúmulo lícito ou ilícito, publicado no '
   'Diário Oficial. Só é preciso abrir novo processo se mudar de cargo, de carreira ou '
   'de horário; não há renovação anual. Servidores com 60 anos ou mais ou com doença '
   'grave podem pedir prioridade na análise.',
   'Decreto nº 45.841/2011; Resolução SEPLAG nº 11/2012',
   'todos', array['análise', 'prazo', '90 dias', 'ato declaratório', 'Diário Oficial', 'renovação', 'prioridade'],
   true, true),

  -- ------------------------------------------------------------ ilegal
  ('ACU-11', 'Acúmulo de cargos', 'Acúmulo considerado ilegal',
   'A partir da publicação do ato, o servidor tem 30 dias para escolher um dos vínculos '
   'e pedir exoneração ou rescisão do outro, ou para recorrer à Comissão de Acumulação '
   'de Cargos e Funções da SEPLAG. Se o recurso for negado, tem 10 dias para escolher. '
   'Sem escolha e sem recurso, o processo vai à Controladoria-Geral do Estado, que abre '
   'o processo disciplinar. A acumulação ilegal pode levar à demissão e, se houver '
   'má-fé, também à devolução de valores.',
   'Decreto nº 45.841/2011; Lei Estadual nº 869/1952, art. 249',
   'todos', array['ilegal', 'ilícito', 'recurso', 'exoneração', 'demissão', 'Controladoria', '30 dias'],
   true, true)

on conflict (codigo) do update set
  tema           = excluded.tema,
  titulo         = excluded.titulo,
  descricao      = excluded.descricao,
  base_legal     = excluded.base_legal,
  aplica_vinculo = excluded.aplica_vinculo,
  palavras_chave = excluded.palavras_chave,
  validado       = excluded.validado,
  ativo          = excluded.ativo;
