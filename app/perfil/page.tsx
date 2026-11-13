import { Mascote } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dataBr, diasEntre, hojeBrasilia, plural, tempoDecorrido } from "@/lib/inicio";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = { title: "Meu perfil | Fhemigo Responde" };

const FORMACAO: Record<string, string> = {
  ensino_fundamental: "Ensino fundamental",
  ensino_medio: "Ensino médio",
  ensino_tecnico: "Ensino técnico",
  superior: "Ensino superior",
  especializacao: "Especialização",
  mestrado: "Mestrado",
  doutorado: "Doutorado",
};

type Funcionais = {
  masp: string;
  nome: string;
  data_admissao: string;
  vinculo: "efetivo" | "contrato";
  data_fim_prevista: string | null;
  formacao: string;
  carreira: string;
  categoria_profissional: string;
  unidade_lotacao: string | null;
};

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-4">
      <dt className="text-sm text-muted-foreground sm:w-48 sm:shrink-0">{rotulo}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

async function Perfil() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/auth/login");

  // RLS: só volta o cadastro do próprio servidor
  const { data, error } = await supabase
    .from("dados_funcionais")
    .select(
      "masp, nome, data_admissao, vinculo, data_fim_prevista, formacao, carreira, categoria_profissional, unidade_lotacao",
    )
    .maybeSingle();

  if (error) {
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar seus dados. Tente novamente mais tarde.
      </p>
    );
  }
  if (!data) {
    return (
      <p className="text-sm text-muted-foreground">
        Seu cadastro funcional não foi encontrado. Procure o RH da sua unidade.
      </p>
    );
  }

  const f = data as Funcionais;
  const hoje = hojeBrasilia();
  const contrato = f.vinculo === "contrato";
  const diasParaFim = contrato && f.data_fim_prevista ? diasEntre(hoje, f.data_fim_prevista) : null;

  return (
    <>
      <section className="flex flex-col items-center gap-4 rounded-xl border bg-secondary/60 p-5 text-center sm:flex-row sm:text-left">
        <Mascote size={72} />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{f.nome}</h1>
          <p className="text-muted-foreground">
            {f.categoria_profissional}
            {f.unidade_lotacao ? ` · ${f.unidade_lotacao}` : ""}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
            <Badge variant="secondary">MASP {f.masp}</Badge>
            <Badge variant="secondary">{contrato ? "Contrato" : "Efetivo"}</Badge>
            <Badge variant="secondary">Carreira {f.carreira}</Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Dados funcionais</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Campo rotulo="Nome">{f.nome}</Campo>
              <Campo rotulo="MASP">{f.masp}</Campo>
              <Campo rotulo="Carreira">{f.carreira}</Campo>
              <Campo rotulo="Categoria profissional">{f.categoria_profissional}</Campo>
              <Campo rotulo="Unidade de lotação">{f.unidade_lotacao ?? "Não informada"}</Campo>
              <Campo rotulo="Formação">{FORMACAO[f.formacao] ?? f.formacao}</Campo>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Vínculo</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Campo rotulo="Tipo de vínculo">{contrato ? "Contrato" : "Efetivo"}</Campo>
              <Campo rotulo="Data de admissão">{dataBr(f.data_admissao)}</Campo>
              <Campo rotulo="Tempo na FHEMIG">{tempoDecorrido(f.data_admissao, hoje)}</Campo>
              {contrato && (
                <Campo rotulo="Término previsto do contrato">
                  {f.data_fim_prevista ? (
                    <>
                      {dataBr(f.data_fim_prevista)}
                      {diasParaFim !== null && diasParaFim >= 0 && (
                        <span className="block text-sm font-normal text-muted-foreground">
                          {diasParaFim === 0 ? "termina hoje" : `faltam ${plural(diasParaFim, "dia", "dias")}`}
                        </span>
                      )}
                    </>
                  ) : (
                    "Não informado"
                  )}
                </Campo>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Link
        href="/extratos"
        className="self-start text-sm font-medium text-brand-strong underline-offset-4 hover:underline"
      >
        Ver extratos de férias, folgas e frequência
      </Link>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          Encontrou algum dado errado? Procure o RH da sua unidade para corrigir. Para
          dúvidas, use as{" "}
          <Link href="/perguntas-frequentes" className="underline underline-offset-4">
            perguntas frequentes
          </Link>{" "}
          ou o{" "}
          <Link href="/chat" className="underline underline-offset-4">
            chat
          </Link>
          .
        </span>
      </p>
    </>
  );
}

export default function PerfilPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
        <Perfil />
      </Suspense>
    </div>
  );
}
