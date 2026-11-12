import { CircleUserRound } from "lucide-react";
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
    <div className="flex items-center gap-2">
      <Link
        href="/perfil"
        title={nome ? `Meu perfil — ${nome}` : "Meu perfil"}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <CircleUserRound className="h-5 w-5" aria-hidden />
        <span className="hidden sm:inline">{saudacao ?? "Meu perfil"}</span>
        <span className="sr-only sm:hidden">Meu perfil</span>
      </Link>
      <LogoutButton />
    </div>
  );
}
