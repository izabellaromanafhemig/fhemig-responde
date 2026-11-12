import { AuthButton } from "@/components/auth-button";
import { FhemigLogo, Mascote } from "@/components/brand";
import { EnvVarWarning } from "@/components/env-var-warning";
import { NavLinks } from "@/components/nav-links";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export function Navbar() {
  return (
    <header className="w-full border-b-[3px] border-b-primary bg-card">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
      >
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label="Fhemigo Responde — página inicial"
        >
          <FhemigLogo className="h-7 sm:h-8" priority />
          <span aria-hidden className="h-8 w-px bg-border" />
          <span className="flex items-center gap-1.5">
            <Mascote size={30} />
            <span className="text-sm leading-tight font-semibold whitespace-nowrap text-brand-strong">
              Fhemigo
              <br className="sm:hidden" />
              <span className="sm:ml-1">Responde</span>
            </span>
          </span>
        </Link>
        <div className="order-3 w-full overflow-x-auto sm:order-none sm:w-auto sm:overflow-visible">
          <NavLinks />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ThemeSwitcher />
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense>
              <AuthButton />
            </Suspense>
          )}
        </div>
      </nav>
    </header>
  );
}
