import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { NavLinks } from "@/components/nav-links";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export function Navbar() {
  return (
    <header className="w-full border-b border-b-foreground/10">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
      >
        <Link href="/" className="font-semibold whitespace-nowrap">
          Fhemigo Responde
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
