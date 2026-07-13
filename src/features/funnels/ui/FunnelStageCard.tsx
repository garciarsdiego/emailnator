import { ChevronDown, ChevronUp, Clock, Loader2, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FunnelEmailDraft } from "@/features/funnels/model/funnel";
import { cn } from "@/lib/utils";
import type { FunnelStage } from "@/types/emailSequence";

interface FunnelStageCardProps {
  stage: FunnelStage;
  email: FunnelEmailDraft;
  index: number;
  expanded: boolean;
  generating: boolean;
  showConnector: boolean;
  onToggle: () => void;
  onGenerate: () => void;
  onUpdate: <Key extends keyof FunnelEmailDraft>(field: Key, value: FunnelEmailDraft[Key]) => void;
}

export function FunnelStageCard({
  stage, email, index, expanded, generating, showConnector, onToggle, onGenerate, onUpdate,
}: FunnelStageCardProps) {
  const panelId = `funnel-stage-${stage.id}`;
  return (
    <div className="relative">
      {showConnector && <div aria-hidden="true" className="absolute left-6 top-full z-0 h-8 w-0.5 bg-primary/30" />}
      <Card className={cn("glass-card mb-4 transition-all", expanded && "ring-2 ring-primary")}>
        <CardHeader className="pb-2">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={panelId}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{stage.id}</span>
              <span>
                <CardTitle className="flex items-center gap-2 text-base">
                  {stage.name}
                  {email.subject && <Badge variant="secondary">Configurado</Badge>}
                </CardTitle>
                <CardDescription className="text-xs">{stage.emailType}</CardDescription>
                <span className="mt-0.5 block text-[10px] text-muted-foreground/70">Ex.: {stage.example}</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{stage.delay === 0 ? "Imediato" : `+${stage.delay} dias`}</Badge>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>
        </CardHeader>

        {expanded && (
          <CardContent id={panelId} className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">{stage.description}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`subject-${index}`}>Assunto do email</Label>
                <Input id={`subject-${index}`} value={email.subject} onChange={(event) => onUpdate("subject", event.target.value)} placeholder="Digite o assunto..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`preheader-${index}`}>Pré-header</Label>
                <Input id={`preheader-${index}`} value={email.preheader} onChange={(event) => onUpdate("preheader", event.target.value)} placeholder="Texto de pré-visualização..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`content-${index}`}>Conteúdo do email</Label>
              <Textarea id={`content-${index}`} value={email.content} onChange={(event) => onUpdate("content", event.target.value)} placeholder="Digite o conteúdo do email..." rows={8} />
            </div>
            <Button variant="outline" size="sm" onClick={onGenerate} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              {generating ? "Gerando..." : "Regenerar com IA"}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
