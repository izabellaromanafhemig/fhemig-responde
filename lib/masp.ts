/**
 * Login por MASP.
 *
 * O Supabase Auth exige um e-mail, então cada MASP vira um e-mail técnico
 * "<masp>@<domínio>". Nenhum e-mail é enviado para esse endereço; por isso a
 * confirmação de e-mail precisa estar DESATIVADA no Supabase
 * (Authentication > Sign In / Providers > Email > "Confirm email").
 *
 * O banco (trigger handle_new_user) confere que a parte antes do "@" é igual
 * ao MASP informado e que o MASP existe em dados_funcionais.
 */

const DOMINIO_PADRAO = "servidor.fhemigo.local";

export const MASP_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_MASP_EMAIL_DOMAIN?.trim() || DOMINIO_PADRAO;

/** Remove pontos, traços e espaços: "1234567-8" -> "12345678". */
export function normalizarMasp(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function maspValido(masp: string): boolean {
  return /^\d{6,10}$/.test(masp);
}

export function maspParaEmail(masp: string): string {
  return `${masp}@${MASP_EMAIL_DOMAIN}`;
}

/** Recupera o MASP a partir do e-mail técnico (para exibição). */
export function maspDoEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  const [local, dominio] = email.split("@");
  return dominio === MASP_EMAIL_DOMAIN && maspValido(local) ? local : null;
}

/** Traduz erros do Supabase Auth para mensagens em português. */
export function mensagemErroAuth(erro: unknown, contexto: "login" | "cadastro") {
  const msg = erro instanceof Error ? erro.message : String(erro ?? "");

  if (/invalid login credentials/i.test(msg)) {
    return "MASP ou senha inválidos.";
  }
  if (/already registered|already been registered|user_already_exists/i.test(msg)) {
    return "Este MASP já possui cadastro. Use a tela de login.";
  }
  if (/database error saving new user/i.test(msg)) {
    // Erro do trigger handle_new_user (MASP inexistente, divergente etc.)
    return "MASP não encontrado no cadastro funcional da FHEMIG. Confira o número ou procure o RH da sua unidade.";
  }
  if (/password should be at least|weak password/i.test(msg)) {
    return "A senha é fraca. Use pelo menos 8 caracteres, misturando letras e números.";
  }
  if (/email not confirmed/i.test(msg)) {
    return "Cadastro pendente de confirmação. Avise o administrador do sistema.";
  }
  if (/is invalid/i.test(msg) && /email/i.test(msg)) {
    return "Não foi possível usar este MASP para login. Avise o administrador do sistema.";
  }
  return contexto === "login"
    ? "Não foi possível entrar. Tente novamente."
    : "Não foi possível concluir o cadastro. Tente novamente.";
}
