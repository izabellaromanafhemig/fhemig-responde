-- =============================================================================
-- Fhemigo Responde — regras de FALTAS, FREQUÊNCIA e HORAS EXTRAS
-- Base: texto de referência da DGP (Lei 869/1952, Decreto 48.348/2022 e
-- Resolução SEPLAG 35/2023).
--
-- ATENÇÃO: o site de legislação de MG mostra a Resolução SEPLAG 35/2023 como
-- revogada em 15/10/2026, sem indicar a norma substituta. Por isso a regra
-- de prazos no Ponto Digital (FRE-03) está com validado = false.
--
-- Pode ser executado mais de uma vez: atualiza as regras pelo código.
-- Execute DEPOIS de 001 (e, se usados, de 002, da importação dos CSVs e do 003).
-- =============================================================================

insert into public.dados_regras_rh
  (codigo, tema, titulo, descricao, base_legal, aplica_vinculo, palavras_chave, validado, ativo)
values
  -- ------------------------------------------------------------ conceito
  ('FRE-01', 'Frequência', 'Falta justificada ou injustificada',
   'Só conta como justificada a ausência comprovada e prevista em norma. É proibido '
   'abonar falta sem justificativa. São ocorrências negativas: atrasos, saídas '
   'antecipadas, saídas no meio do expediente e faltas.',
   'Lei Estadual nº 869/1952, art. 95, § 2º; Decreto nº 48.348/2022, art. 16',
   'todos', array['falta', 'justificada', 'injustificada', 'abonar', 'abono', 'ocorrência'],
   true, true),

  ('FRE-02', 'Frequência', 'Ausências justificadas (abonos)',
   'São justificadas, com comprovação: consulta médica ou odontológica e perícia '
   'médica; prova ou exame escolar; curso ou treinamento autorizado pelo órgão; '
   'licenças e afastamentos legais, como licença-saúde, licença-gestante e acidente '
   'em serviço. Júri e outros serviços obrigatórios por lei contam como efetivo '
   'exercício. O serviço para a Justiça Eleitoral gera folga compensativa '
   '(ver FOL-01). Casamento e luto têm regra própria (LIC-04 e LIC-05).',
   'Decreto nº 48.348/2022; Resolução SEPLAG nº 35/2023 (ver aviso de revogação)',
   'todos', array['abono', 'atestado', 'consulta', 'dentista', 'perícia', 'prova', 'curso', 'júri', 'licença'],
   true, true),

  ('FRE-05', 'Frequência', 'Doação de sangue',
   'O servidor que doa sangue fica dispensado do trabalho no dia da doação.',
   'Decreto nº 48.348/2022',
   'todos', array['doação de sangue', 'doar sangue', 'dispensa', 'hemominas'],
   true, true),

  ('FRE-06', 'Frequência', 'Situações excepcionais',
   'Ausências causadas por situações excepcionais, como enchente, greve de transporte '
   'ou calamidade, podem ser abonadas com aprovação da SEPLAG.',
   'Decreto nº 48.348/2022',
   'todos', array['enchente', 'greve', 'transporte', 'calamidade', 'chuva', 'abono'],
   true, true),

  ('FRE-07', 'Frequência', 'Doença grave ou súbita',
   'Em caso de doença grave ou súbita, avise a chefia imediatamente, por escrito ou '
   'por meio de outra pessoa.',
   'Lei Estadual nº 869/1952, art. 101',
   'todos', array['doença', 'passei mal', 'emergência', 'avisar chefia', 'súbita'],
   true, true),

  -- ------------------------------------------------------------ descontos
  ('FRE-04', 'Frequência', 'Descontos por falta, atraso e saída antecipada',
   'Descontos no salário: falta no dia inteiro desconta o dia inteiro; atraso de até '
   '55 minutos desconta 1/5 do dia; atraso de mais de 55 minutos desconta o dia '
   'inteiro; saída no fim da 2ª hora desconta 4/5 do dia; saída durante a 3ª hora, '
   '3/5 do dia; saída durante a 4ª hora, 2/5 do dia; saída a partir da 5ª hora, 1/5 '
   'do dia.',
   'Lei Estadual nº 869/1952, art. 99',
   'todos', array['desconto', 'atraso', 'saída antecipada', 'falta', 'salário', '55 minutos'],
   true, true),

  ('FRE-08', 'Frequência', 'Faltas seguidas e ponto facultativo',
   'Em faltas seguidas, também são descontados os sábados, domingos e feriados que '
   'caírem no meio. Faltar a um ponto facultativo para o qual você foi escalado é '
   'falta integral.',
   'Lei Estadual nº 869/1952, art. 100',
   'todos', array['faltas seguidas', 'fim de semana', 'feriado', 'ponto facultativo', 'escala'],
   true, true),

  -- ------------------------------------------------------------ justificar
  ('FRE-03', 'Frequência', 'Como e quando justificar no Ponto Digital',
   'Até o 4º dia útil do mês seguinte, o servidor lança a justificativa no Ponto '
   'Digital e anexa os documentos. Até o 6º dia útil, a chefia avalia; se não avaliar '
   'no prazo, a justificativa é aceita automaticamente. Até o 7º dia útil, o servidor '
   'assina a folha. Marcação feita pela web ou à mão precisa de processo no SEI. '
   'Atenção: a resolução que define esses prazos aparece como revogada em 15/10/2026; '
   'confirme com o RH da unidade os prazos em vigor.',
   'Resolução SEPLAG nº 35/2023 — consta como revogada em 15/10/2026; norma substituta não identificada',
   'todos', array['justificar', 'Ponto Digital', 'prazo', 'dia útil', 'assinar folha', 'SEI', 'anexar'],
   false, true),

  -- ------------------------------------------------------------ disciplinar
  ('FRE-09', 'Frequência', 'Assiduidade e pontualidade',
   'Ser assíduo e pontual é dever do servidor. O descumprimento leva a repreensão e, '
   'se houver má-fé, a suspensão de até 90 dias.',
   'Lei Estadual nº 869/1952',
   'todos', array['assiduidade', 'pontualidade', 'repreensão', 'suspensão', 'punição'],
   true, true),

  ('FRE-10', 'Frequência', 'Abandono de cargo',
   'Há abandono de cargo, que leva a demissão, com mais de 30 faltas seguidas sem '
   'justificativa ou com mais de 90 faltas intercaladas sem justificativa no mesmo ano.',
   'Lei Estadual nº 869/1952',
   'todos', array['abandono', 'demissão', '30 faltas', '90 faltas', 'faltas seguidas'],
   true, true),

  ('FRE-11', 'Frequência', 'Inassiduidade',
   'Inassiduidade é faltar sem justificativa sem chegar aos limites do abandono de '
   'cargo. A Corregedoria orienta: até 10 dias, o caso é arquivado; de 11 a 30 dias, '
   'repreensão; de 31 a 89 dias, suspensão, maior quando há má-fé ou reincidência. '
   'Atrasos e saídas antecipadas não se somam para virar dias de falta.',
   'Lei Estadual nº 869/1952; orientação da Corregedoria',
   'todos', array['inassiduidade', 'corregedoria', 'repreensão', 'suspensão', 'quantas faltas'],
   true, true),

  ('FRE-12', 'Frequência', 'Faltas no estágio probatório',
   'No estágio probatório, a assiduidade é avaliada e as faltas podem levar à exoneração.',
   'Lei Estadual nº 869/1952',
   'efetivo', array['estágio probatório', 'exoneração', 'assiduidade', 'novo servidor'],
   true, true),

  ('FRE-13', 'Frequência', 'Falta injustificada e tempo de serviço',
   'Falta injustificada não conta como tempo de efetivo exercício. Pela leitura da lei, '
   'isso afeta adicionais por tempo de serviço, mas essa é uma interpretação, não uma '
   'regra escrita.',
   'Lei Estadual nº 869/1952 — efeito nos adicionais é interpretação',
   'todos', array['tempo de serviço', 'efetivo exercício', 'adicional', 'quinquênio'],
   false, true),

  -- ------------------------------------------------------------ licenças
  ('LIC-04', 'Licenças', 'Falecimento de familiar (luto)',
   'Em caso de falecimento de cônjuge, filho, pai, mãe ou irmão, o servidor pode se '
   'ausentar por até 8 dias, sem perda do salário.',
   'Lei Estadual nº 869/1952, art. 88',
   'todos', array['falecimento', 'luto', 'nojo', 'morte', 'família', '8 dias'],
   true, true),

  ('LIC-05', 'Licenças', 'Casamento (gala)',
   'Em razão de casamento, o servidor pode se ausentar por até 8 dias, sem perda do '
   'salário.',
   'Lei Estadual nº 869/1952, art. 88',
   'todos', array['casamento', 'gala', 'casar', '8 dias'],
   true, true),

  -- ------------------------------------------------------------ horas extras
  ('HEX-01', 'Horas extras', 'Compensação de horas e banco de horas',
   'A compensação de horas deve ser feita dentro do mesmo mês e autorizada pela chefia '
   'imediata. A hora extra vai de preferência para o banco de horas, com acréscimo de '
   '50%. O banco de horas só pode abonar ocorrências nos meses seguintes.',
   'Decreto nº 48.348/2022',
   'todos', array['compensar', 'compensação', 'banco de horas', 'hora extra', '50%'],
   true, true),

  ('HEX-02', 'Horas extras', 'Limite de horas extras',
   'O limite de serviço extraordinário é de 50 horas por mês. Acima disso, só com '
   'autorização do Governador.',
   'Decreto nº 48.348/2022',
   'todos', array['limite', 'hora extra', '50 horas', 'plantão extra', 'serviço extraordinário'],
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
