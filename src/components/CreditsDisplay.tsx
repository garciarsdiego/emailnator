import { Mail, Search, AlertCircle } from "lucide-react";
import { useUserCredits } from "@/hooks/useUserCredits";
import { cn } from "@/lib/utils";

export function CreditsDisplay() {
  const { totalEmails, totalAnalyses, isLoading } = useUserCredits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  const emailsLow = totalEmails <= 2;
  const analysesLow = totalAnalyses === 0;

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
          emailsLow
            ? "border-warning/50 bg-warning/10 text-warning"
            : "border-border bg-card text-card-foreground"
        )}
      >
        <Mail className="h-4 w-4" />
        <span>{totalEmails} emails</span>
        {emailsLow && <AlertCircle className="h-3.5 w-3.5" />}
      </div>

      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
          analysesLow
            ? "border-warning/50 bg-warning/10 text-warning"
            : "border-border bg-card text-card-foreground"
        )}
      >
        <Search className="h-4 w-4" />
        <span>{totalAnalyses} análises</span>
        {analysesLow && <AlertCircle className="h-3.5 w-3.5" />}
      </div>
    </div>
  );
}
