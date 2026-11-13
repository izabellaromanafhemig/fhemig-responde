import { CircleUserRound, LayoutDashboard } from "lucide-react";
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
  const [{ data: cadastro }, { data: perfil }] = await Promise.all([
    supabase.from("dados_funcionais").select("nome").maybeSingle(),
    // se o 008 ainda não foi executado, a coluna não existe e o link não aparece
    supabase.from("perfis").select("papel").maybeSingle(),
  ]);
  const gestor = (perfil as { papel?: string } | null)?.papel === "gestor";

  const nome = (cadastro?.nome as string | undefined)?.trim();
  const primeiroNome = nome?.split(/\s+/)[0];
  const masp = maspDoEmail(user.email as string | undefined);
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}` : masp ? `MASP ${masp}` : null;

  return (
    <div className="flex items-center gap-2">
      {gestor && (
        <Link
          href="/gestor"
          title="Painel do gestor"
          className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 px-2 py-1.5 text-brand-strong transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <LayoutDashboard className="h-4 w-4" aria-hidden />
          <span className="hidden xl:inline">Painel</span>
          <span className="sr-only xl:hidden">Painel do gestor</span>
        </Link>
      )}
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
