import { cn } from "@/lib/utils";
import { TONES } from "@/lib/constants";

interface ToneSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-foreground">
        Tom da mensagem
      </span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {TONES.map((tone) => (
          <button
            key={tone.value}
            type="button"
            onClick={() => onChange(tone.value)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all hover:border-primary/50",
              value === tone.value
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:bg-accent/50"
            )}
          >
            <p className="text-sm font-medium">{tone.label}</p>
            <p className="text-xs text-muted-foreground">{tone.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
