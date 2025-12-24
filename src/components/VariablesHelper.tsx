import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Variable, Copy, Check } from "lucide-react";
import { EMAIL_VARIABLES } from "@/lib/emailVariables";

interface VariablesHelperProps {
  onInsert?: (variable: string) => void;
}

export function VariablesHelper({ onInsert }: VariablesHelperProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleCopy = async (variable: string) => {
    await navigator.clipboard.writeText(variable);
    setCopiedKey(variable);
    toast.success(`Variável ${variable} copiada!`);
    setTimeout(() => setCopiedKey(null), 2000);
    
    if (onInsert) {
      onInsert(variable);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Variable className="h-4 w-4" />
          Variáveis
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-border">
          <h4 className="font-medium text-sm">Variáveis Disponíveis</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Clique para copiar e cole no seu email
          </p>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-1">
            {EMAIL_VARIABLES.map((v) => (
              <button
                key={v.key}
                onClick={() => handleCopy(v.key)}
                className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {v.key}
                    </code>
                    <span className="text-xs text-muted-foreground">{v.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Ex: {v.example}
                  </p>
                </div>
                <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedKey === v.key ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
