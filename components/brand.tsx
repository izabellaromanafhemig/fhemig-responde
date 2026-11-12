import { cn } from "@/lib/utils";
import Image from "next/image";

/** Logo da FHEMIG: versão colorida no tema claro e branca no tema escuro. */
export function FhemigLogo({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <Image
        src="/fhemig-logo.png"
        alt="FHEMIG — Fundação Hospitalar do Estado de Minas Gerais"
        width={1054}
        height={387}
        priority={priority}
        className="h-full w-auto dark:hidden"
      />
      <Image
        src="/fhemig-logo-branco.png"
        alt="FHEMIG — Fundação Hospitalar do Estado de Minas Gerais"
        width={418}
        height={154}
        priority={priority}
        className="hidden h-full w-auto dark:block"
      />
    </span>
  );
}

/** Fhemigo, o mascote do assistente. Decorativo por padrão. */
export function Mascote({
  size = 40,
  className,
  alt = "",
  priority,
}: {
  size?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/fhemigo-mascote.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 select-none", className)}
    />
  );
}
