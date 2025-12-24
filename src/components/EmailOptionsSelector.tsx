import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailOptionsSelectorProps {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (option: string) => void;
}

export function EmailOptionsSelector({ 
  label, 
  options, 
  selected, 
  onSelect 
}: EmailOptionsSelectorProps) {
  if (!options || options.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="grid gap-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(option)}
            className={cn(
              "relative text-left p-3 rounded-lg border transition-all duration-200",
              "hover:border-primary/50 hover:bg-primary/5",
              selected === option
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {selected === option && <Check className="h-3 w-3" />}
              </div>
              <span className="text-sm">{option}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}