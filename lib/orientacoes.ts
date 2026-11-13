/** Orientações para a IA: constantes e mensagens compartilhadas. */

export const LIMITE_ORIENTACOES_ATIVAS = 30;

export const TEMAS_ORIENTACAO = [
  "Geral",
  "Férias",
  "Folgas compensatórias",
  "Faltas e frequência",
  "Horas extras",
  "Acúmulo de cargos",
  "Licenças",
  "Contrato",
] as const;

export function mensagemErroOrientacao(erro: { message?: string } | null): string {
  const msg = erro?.message ?? "";
  if (msg.includes("LIMITE_ORIENTACOES_ATIVAS")) {
    return `Já existem ${LIMITE_ORIENTACOES_ATIVAS} orientações ativas. Desative uma antes de criar ou ativar outra.`;
  }
  if (msg.includes("check") || msg.includes("violates")) {
    return "A orientação precisa ter entre 10 e 1.000 caracteres.";
  }
  if (msg.includes("ACESSO_RESTRITO_GESTOR")) {
    return "Apenas gestores podem alterar orientações.";
  }
  return "Não foi possível salvar. Tente novamente.";
}
