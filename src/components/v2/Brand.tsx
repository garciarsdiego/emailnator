import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  to?: string;
  compact?: boolean;
}

export function Brand({ className, to = "/", compact = false }: BrandProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex w-fit items-center gap-2.5 rounded-sm focus-visible:outline-none",
        className,
      )}
      aria-label="Emailnator — página inicial"
    >
      <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[0.4rem] bg-foreground font-display text-xl text-background shadow-paper">
        E
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-primary" aria-hidden="true" />
      </span>
      <span className="leading-none">
        <span className="block text-[1.05rem] font-bold tracking-[-0.035em]">Emailnator</span>
        {!compact && (
          <span className="mt-1 hidden font-mono text-[0.55rem] uppercase tracking-[0.16em] text-muted-foreground sm:block">
            Campaign studio
          </span>
        )}
      </span>
    </Link>
  );
}
