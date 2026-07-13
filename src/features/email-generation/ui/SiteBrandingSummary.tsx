import { MessageSquare, Palette, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SiteAnalysis } from "@/features/email-generation/model/schemas";

const toneLabels: Record<string, string> = {
  formal: "Formal", casual: "Casual", playful: "Divertido",
  luxury: "Premium", urgent: "Urgente", emotional: "Emocional",
};

export function SiteBrandingSummary({ analysis }: { analysis: SiteAnalysis }) {
  const colors = Object.entries(analysis.branding?.colors ?? {}).filter(([, value]) => value && value !== "null");
  const fonts = analysis.branding?.fonts;
  const communication = analysis.communication;

  return <>
    {colors.length > 0 && (
      <section className="space-y-2" aria-label="Cores da marca">
        <h4 className="flex items-center gap-2 text-sm font-medium"><Palette className="h-4 w-4 text-primary" />Cores da marca</h4>
        <div className="flex flex-wrap gap-2">
          {colors.map(([name, value]) => (
            <div key={name} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
              {value?.startsWith("#") && <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: value }} />}
              <span className="text-xs"><span className="capitalize text-muted-foreground">{name}:</span> <span className="font-mono">{value}</span></span>
            </div>
          ))}
        </div>
      </section>
    )}

    {(fonts?.heading || fonts?.body || analysis.branding?.visualStyle) && (
      <section className="space-y-2" aria-label="Tipografia">
        <h4 className="flex items-center gap-2 text-sm font-medium"><Type className="h-4 w-4 text-primary" />Tipografia</h4>
        <div className="flex flex-wrap gap-2">
          {fonts?.heading && <Badge variant="secondary">Títulos: {fonts.heading}</Badge>}
          {fonts?.body && <Badge variant="secondary">Corpo: {fonts.body}</Badge>}
        </div>
        {analysis.branding?.visualStyle && <p className="text-xs text-muted-foreground">Estilo: {analysis.branding.visualStyle}</p>}
      </section>
    )}

    {(communication?.tone || communication?.copyStyle || communication?.keyPhrases?.length) && (
      <section className="space-y-2" aria-label="Tom de comunicação">
        <h4 className="flex items-center gap-2 text-sm font-medium"><MessageSquare className="h-4 w-4 text-primary" />Tom de comunicação</h4>
        <div className="flex flex-wrap gap-2">
          {communication.tone && <Badge className="border-primary/20 bg-primary/10 text-primary">{toneLabels[communication.tone] || communication.tone}</Badge>}
          {communication.copyStyle && <span className="text-xs text-muted-foreground">{communication.copyStyle}</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {communication.keyPhrases?.map((phrase) => <Badge key={phrase} variant="outline" className="text-xs">“{phrase}”</Badge>)}
        </div>
      </section>
    )}
  </>;
}
