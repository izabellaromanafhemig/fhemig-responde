import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

// O login é por MASP e não há e-mail real cadastrado, então a recuperação
// automática por e-mail não está disponível neste POC.
export default function Page() {
  return (
    <div className="flex flex-1 w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Esqueceu a senha?</CardTitle>
            <CardDescription>Redefinição de senha</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Procure o RH da sua unidade informando o seu MASP. A equipe
              responsável vai redefinir o seu acesso.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">Voltar para o login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
