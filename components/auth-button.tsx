import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { maspDoEmail } from "@/lib/masp";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/auth/login">Entrar</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/sign-up">Cadastrar</Link>
        </Button>
      </div>
    );
  }

  // RLS: só volta a linha do próprio servidor
  const { data: cadastro } = await supabase
    .from("dados_funcionais")
    .select("nome")
    .maybeSingle();

  const nome = (cadastro?.nome as string | undefined)?.trim();
  const primeiroNome = nome?.split(/\s+/)[0];
  const masp = maspDoEmail(user.email as string | undefined);
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}` : masp ? `MASP ${masp}` : null;

  return (
    <div className="flex items-center gap-3">
      {saudacao && (
        <span
          className="hidden text-muted-foreground sm:inline"
          title={nome ?? undefined}
        >
          {saudacao}
        </span>
      )}
      <LogoutButton />
    </div>
  );
}
