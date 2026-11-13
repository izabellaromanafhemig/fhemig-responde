-- =============================================================================
-- Fhemigo Responde — regras de FÉRIAS e FOLGAS COMPENSATÓRIAS
-- Base: texto de referência da DGP (Lei 869/1952, Decreto 44.693/2007,
-- Decreto 48.559/2022 e FAQ da Secretaria de Fazenda).
--
-- Pode ser executado mais de uma vez: atualiza as regras pelo código.
-- Execute DEPOIS de 001 (e, se usados, de 002 e da importação dos CSVs).
--
-- validado = true  -> ponto com fonte indicada no texto de referência
-- validado = false -> ponto que o próprio texto marca como não confirmado
-- "Folga compensatória" e "folga compensativa" são a mesma coisa.
-- =============================================================================

insert into public.dados_regras_rh
  (codigo, tema, titulo, descricao, base_legal, aplica_vinculo, palavras_chave, validado, ativo)
values
  -- ------------------------------------------------------------ direito
  ('FER-01', 'Férias', 'Direito e duração das férias',
   'O servidor, efetivo ou contratado, tem direito a 25 dias úteis de férias por ano. '
   'Sábados, domingos e feriados nacionais não contam como dias de férias. Ponto '
   'facultativo conta como dia útil.',
   'Lei Estadual nº 869/1952 (Estatuto); Decreto nº 44.693/2007, alterado pelo Decreto nº 48.559/2022',
   'todos', array['férias', 'dias úteis', 'direito', 'anual', '25 dias', 'ponto facultativo'],
   true, true),

  ('FER-03', 'Férias', 'Férias de contratados',
   'O servidor contratado também tem direito a 25 dias úteis de férias por ano e segue '
   'as mesmas regras de marcação, divisão em períodos, alteração e pagamento do 1/3 '
   'dos servidores efetivos.',
   'Orientação da DGP/FHEMIG',
   'contrato', array['férias', 'contrato', 'contratado', 'temporário', '25 dias úteis'],
   true, true),

  ('FER-04', 'Férias', 'Primeiras férias',
   'As primeiras férias só podem ser tiradas depois de 11 meses de efetivo exercício.',
   'Decreto nº 44.693/2007, alterado pelo Decreto nº 48.559/2022',
   'todos', array['primeiras férias', '11 meses', 'novo servidor', 'admissão', 'carência'],
   true, true),

  ('FER-05', 'Férias', 'Dia a mais por doação de sangue',
   'Quem doa sangue a banco de sangue estadual ganha 1 dia a mais de férias, conforme '
   'resolução da SEPLAG.',
   'Decreto nº 48.559/2022; resolução da SEPLAG',
   'todos', array['doação de sangue', 'dia a mais', 'hemominas', 'férias'],
   true, true),

  -- ------------------------------------------------------------ marcação
  ('FER-06', 'Férias', 'Como marcar as férias',
   'A unidade monta a escala de férias conforme a necessidade do serviço, e o servidor '
   'precisa estar incluído nela. O pedido é feito pelo Ponto Digital (Requerimentos, aba '
   '"Férias regulamentares", opção "Solicitar Marcação") ou, nos órgãos sem Ponto '
   'Digital, pelo SEI, no formulário "RH – Férias Regulamentares – Requerimento". A '
   'chefia imediata aprova ou nega o pedido. O prazo para marcar é definido pelo RH de '
   'cada unidade. A FHEMIG pode ter prazos e fluxos internos próprios: confirme com o RH '
   'da sua unidade.',
   'Decreto nº 44.693/2007, alterado pelo Decreto nº 48.559/2022',
   'todos', array['marcar', 'solicitar', 'escala', 'Ponto Digital', 'SEI', 'requerimento', 'chefia'],
   true, true),

  ('FER-07', 'Férias', 'Divisão das férias em períodos',
   'As férias podem ser divididas em no máximo 2 períodos, cada um com pelo menos 10 '
   'dias úteis.',
   'Decreto nº 44.693/2007, alterado pelo Decreto nº 48.559/2022',
   'todos', array['parcelar', 'dividir', 'períodos', 'fracionar', '10 dias'],
   true, true),

  ('FER-08', 'Férias', 'Prazo para tirar as férias e acúmulo',
   'As férias devem ser tiradas dentro do ano a que se referem. O último período tem que '
   'começar até o último dia útil desse ano. Não é permitido acumular férias. Em casos '
   'excepcionais, a Administração aceita dois períodos no mesmo ano, tirados em datas '
   'alternadas.',
   'Decreto nº 44.693/2007, alterado pelo Decreto nº 48.559/2022',
   'todos', array['acumular', 'prazo', 'ano', 'vencer', 'perder férias', 'último dia útil'],
   true, true),

  ('FER-09', 'Férias', 'Férias da gestante',
   'A gestante deve marcar as férias de forma que não coincidam com a licença-maternidade.',
   'Decreto nº 44.693/2007, alterado pelo Decreto nº 48.559/2022',
   'todos', array['gestante', 'grávida', 'licença-maternidade', 'férias'],
   true, true),

  ('FER-16', 'Férias', 'Limite de pessoas da equipe de férias no mesmo mês',
   'Pode haver limite de 1/3 da equipe de férias no mesmo mês. Esse ponto ainda não foi '
   'conferido no texto integral da lei.',
   'Lei Estadual nº 869/1952, art. 152, § 1º — não confirmado no texto integral',
   'todos', array['equipe', 'limite', 'mesmo mês', 'escala', '1/3 da equipe'],
   false, true),

  -- ------------------------------------------------------------ alteração
  ('FER-10', 'Férias', 'Alterar ou desmarcar férias',
   'A data das férias pode ser mudada com autorização da chefia imediata, pelo Ponto '
   'Digital (opção "Solicitar Remarcação") ou pelo SEI (formulário "RH – Férias '
   'Regulamentares – Req. de Alteração"). Não há regra própria para cancelar férias: '
   'quem não vai tirar as férias na data marcada faz um pedido de alteração. Se houver '
   'licença de saúde antes do início, as férias podem ser remarcadas para depois da licença.',
   'Decreto nº 44.693/2007, alterado pelo Decreto nº 48.559/2022',
   'todos', array['alterar', 'remarcar', 'desmarcar', 'cancelar', 'mudar data', 'licença saúde'],
   true, true),

  ('FER-11', 'Férias', 'Efeito da alteração no terço de férias',
   'Se o novo início das férias ficar no mesmo mês, não há acerto no pagamento do 1/3. '
   'Se o início passar para outro mês, ou se as férias não forem tiradas, o RH precisa '
   'ser avisado para acertar o pagamento. Valor de 1/3 recebido indevidamente é devolvido '
   'em parcela única, sem parcelamento.',
   'FAQ da Secretaria de Estado de Fazenda — parte das respostas é antiga',
   'todos', array['terço', '1/3', 'devolver', 'acerto', 'pagamento', 'remarcar'],
   false, true),

  -- ------------------------------------------------------------ interrupção
  ('FER-12', 'Férias', 'Interrupção das férias por convocação',
   'As férias só podem ser interrompidas pela Administração em caso de urgência '
   'comprovada pela chefia, com ciência da autoridade superior. Os dias que sobrarem '
   'viram folgas compensatórias (também chamadas folgas compensativas), que devem ser '
   'usadas em até 5 anos.',
   'Decreto nº 48.559/2022; FAQ da Secretaria de Estado de Fazenda',
   'todos', array['interromper', 'convocação', 'chamado de volta', 'urgência', 'folga compensatória'],
   true, true),

  ('FER-13', 'Férias', 'Parto antecipado durante as férias',
   'Se o parto acontecer durante as férias, elas são interrompidas e o saldo é tirado '
   'logo após o fim da licença-maternidade.',
   'Decreto nº 44.693/2007, alterado pelo Decreto nº 48.559/2022',
   'todos', array['parto', 'antecipado', 'licença-maternidade', 'interromper férias'],
   true, true),

  ('FER-14', 'Férias', 'Licenças que caem durante as férias',
   'Licença de saúde, luto (nojo), casamento (gala) ou paternidade que caia durante as '
   'férias não interrompe as férias.',
   'Decreto nº 44.693/2007, alterado pelo Decreto nº 48.559/2022',
   'todos', array['doente nas férias', 'atestado', 'luto', 'casamento', 'paternidade', 'interromper'],
   true, true),

  -- ------------------------------------------------------------ pagamento
  ('FER-02', 'Férias', 'Adicional de 1/3 de férias',
   'O servidor recebe o adicional de 1/3 sobre a remuneração. Ele é pago de uma só vez, '
   'no mês em que começa o primeiro período, mesmo quando as férias são divididas.',
   'CF, art. 7º, XVII, c/c art. 39, § 3º; Decreto nº 44.693/2007, art. 2º, § 2º',
   'todos', array['terço', '1/3', 'adicional', 'pagamento', 'quando recebo'],
   true, true),

  ('FER-15', 'Férias', 'Remuneração durante as férias',
   'Durante as férias o servidor mantém a remuneração, com exceção da gratificação por '
   'serviço extraordinário. Esse ponto ainda não foi conferido no texto integral da lei.',
   'Lei Estadual nº 869/1952, art. 153 — não confirmado no texto integral',
   'todos', array['salário', 'remuneração', 'férias', 'hora extra', 'gratificação'],
   false, true),

  -- ------------------------------------------------------------ folgas
  ('FOL-01', 'Folgas', 'Folga por serviço eleitoral',
   'Quem é convocado pela Justiça Eleitoral (mesário, apoio etc.) tem direito a dispensa '
   'do serviço pelo dobro dos dias de convocação, sem prejuízo da remuneração, mediante '
   'apresentação da declaração do cartório eleitoral. Essa dispensa é registrada como '
   'folga compensatória (ou compensativa).',
   'Lei Federal nº 9.504/1997, art. 98',
   'todos', array['eleição', 'mesário', 'folga', 'dobro', 'TRE', 'compensatória', 'compensativa'],
   true, true),

  ('FOL-02', 'Folgas', 'Folga compensatória por trabalho extra',
   'Horas trabalhadas além da jornada ou plantões em feriados podem ser compensados em '
   'folga compensatória (também chamada folga compensativa), desde que autorizados '
   'previamente pela chefia. O uso da folga também depende de agendamento com a chefia.',
   'Norma interna — a confirmar',
   'todos', array['folga', 'compensatória', 'compensativa', 'banco de horas', 'feriado', 'plantão'],
   false, true),

  ('FOL-03', 'Folgas', 'Prazo para usar folgas compensatórias',
   'Folgas compensatórias (ou compensativas) geradas pela interrupção das férias devem '
   'ser usadas em até 5 anos. Para folgas de outras origens, consulte a validade no seu '
   'extrato de folgas e agende com a chefia antes do vencimento.',
   'Decreto nº 48.559/2022; FAQ da Secretaria de Estado de Fazenda',
   'todos', array['validade', 'prazo', 'vencer', '5 anos', 'folga', 'compensatória', 'compensativa'],
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
