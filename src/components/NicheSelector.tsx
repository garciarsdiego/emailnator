import { cn } from "@/lib/utils";
import { NICHES } from "@/lib/constants";

interface NicheSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function NicheSelector({ value, onChange }: NicheSelectorProps) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-foreground">
        Selecione o nicho do seu e-commerce
      </span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {NICHES.map((niche) => (
          <button
            key={niche.value}
            type="button"
            onClick={() => onChange(niche.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all hover:border-primary/50",
              value === niche.value
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:bg-accent/50"
            )}
          >
            <span className="text-2xl">{niche.icon}</span>
            <span className="text-xs font-medium text-center leading-tight">
              {niche.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
