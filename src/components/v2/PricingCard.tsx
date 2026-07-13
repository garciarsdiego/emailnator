import type { ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  description: string;
  price: number;
  features: string[];
  actionLabel: string;
  onAction: () => void;
  current?: boolean;
  recommended?: boolean;
  loading?: boolean;
  disabled?: boolean;
  note?: ReactNode;
}

export function PricingCard({
  name,
  description,
  price,
  features,
  actionLabel,
  onAction,
  current = false,
  recommended = false,
  loading = false,
  disabled = false,
  note,
}: PricingCardProps) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col border bg-card p-6 shadow-paper sm:p-7",
        recommended ? "border-primary" : "border-foreground/20",
      )}
    >
      <div className="flex min-h-7 items-start justify-between gap-4">
        <p className="eyebrow text-foreground">{name}</p>
        {(current || recommended) && (
          <span className={cn("font-mono text-[0.6rem] uppercase tracking-[0.14em]", current ? "text-success" : "text-primary")}>
            {current ? "Plano atual" : "Recomendado"}
          </span>
        )}
      </div>

      <p className="mt-5 min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-6 flex items-end gap-1 border-b border-foreground/15 pb-6">
        <span className="mb-1 text-sm font-semibold">R$</span>
        <span className="font-display text-5xl leading-none tracking-[-0.04em] font-tabular">{price}</span>
        <span className="mb-1 text-sm text-muted-foreground">/mês</span>
      </div>

      {note && <div className="mt-4 text-xs font-medium text-primary">{note}</div>}

      <ul className="mt-6 flex-1 space-y-3.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm leading-5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-8 w-full"
        variant={recommended ? "default" : "outline"}
        onClick={onAction}
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Abrindo checkout…
          </>
        ) : (
          actionLabel
        )}
      </Button>
    </article>
  );
}

interface CreditPackCardProps {
  emails: number;
  price: number;
  loading: boolean;
  onBuy: () => void;
  annotation?: string;
}

export function CreditPackCard({ emails, price, loading, onBuy, annotation }: CreditPackCardProps) {
  return (
    <article className="flex items-center justify-between gap-5 border-t border-foreground/20 py-5 first:border-t-0 md:border-l md:border-t-0 md:px-6 md:first:border-l-0 md:first:pl-0 md:last:pr-0">
      <div>
        <p className="font-display text-2xl">{emails} emails</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          R$ {price}
          {annotation ? ` · ${annotation}` : ""}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onBuy} disabled={loading} aria-label={`Comprar ${emails} créditos de email`}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comprar"}
      </Button>
    </article>
  );
}
