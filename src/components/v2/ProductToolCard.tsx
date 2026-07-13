import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductToolCardProps {
  index: string;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
  onOpen: () => void;
}

export function ProductToolCard({
  index,
  title,
  description,
  detail,
  icon: Icon,
  onOpen,
}: ProductToolCardProps) {
  return (
    <article className="group relative min-h-[18rem] overflow-hidden border border-foreground/20 bg-card p-6 shadow-paper transition hover:-translate-y-1 hover:shadow-lift sm:p-8">
      <div className="flex items-start justify-between">
        <span className="font-mono text-xs font-semibold text-primary">{index}</span>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-primary transition group-hover:rotate-3">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <h3 className="mt-10 text-3xl">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      <p className="mt-5 border-l border-primary pl-3 text-xs font-medium text-foreground/75">{detail}</p>
      <Button variant="ghost" className="mt-7 -ml-3 text-primary hover:bg-accent hover:text-primary" onClick={onOpen}>
        Abrir ferramenta
        <ArrowUpRight className="h-4 w-4" />
      </Button>
    </article>
  );
}
