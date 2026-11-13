"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/chat", label: "Chat" },
  { href: "/historico", label: "Histórico" },
  { href: "/perguntas-frequentes", label: "Perguntas frequentes" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-1">
      {LINKS.map(({ href, label }) => {
        const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors hover:bg-accent hover:text-accent-foreground",
                ativo
                  ? "bg-accent font-semibold text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
