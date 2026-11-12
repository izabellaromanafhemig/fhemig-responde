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

  const masp = maspDoEmail(user.email as string | undefined);

  return (
    <div className="flex items-center gap-3">
      {masp && (
        <span className="hidden text-muted-foreground sm:inline">
          MASP {masp}
        </span>
      )}
      <LogoutButton />
    </div>
  );
}
