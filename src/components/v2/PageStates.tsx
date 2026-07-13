import type { ReactNode } from "react";
import { ArrowRight, FileText, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = <FileText className="h-5 w-5" />,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "grid min-h-64 place-items-center border border-dashed border-border bg-card/55 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="max-w-md">
        <span className="mx-auto mb-5 grid h-11 w-11 place-items-center rounded-full bg-accent text-primary">
          {icon}
        </span>
        <h3 className="text-2xl">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
        {actionLabel && onAction && (
          <Button className="mt-6" onClick={onAction}>
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </section>
  );
}

interface InlineNoticeProps {
  title: string;
  description: string;
}

export function InlineNotice({ title, description }: InlineNoticeProps) {
  return (
    <div
      className="flex items-start gap-3 border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm"
      role="alert"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-label="Carregando área de trabalho">
      <div className="border-b border-border bg-card/70">
        <div className="container flex h-16 items-center justify-between">
          <div className="h-9 w-36 animate-pulse bg-muted" />
          <div className="h-9 w-24 animate-pulse bg-muted" />
        </div>
      </div>
      <main className="container py-10">
        <div className="h-3 w-28 animate-pulse bg-muted" />
        <div className="mt-5 h-12 w-full max-w-xl animate-pulse bg-muted" />
        <div className="mt-3 h-5 w-full max-w-md animate-pulse bg-muted" />
        <div className="mt-12 grid gap-4 border-y border-border py-6 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="space-y-3 sm:border-r sm:border-border sm:pr-4 last:border-0">
              <div className="h-3 w-20 animate-pulse bg-muted" />
              <div className="h-8 w-24 animate-pulse bg-muted" />
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="h-64 animate-pulse bg-muted" />
          <div className="h-64 animate-pulse bg-muted" />
        </div>
      </main>
    </div>
  );
}
