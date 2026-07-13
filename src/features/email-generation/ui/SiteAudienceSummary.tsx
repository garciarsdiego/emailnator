import { Lightbulb, Package, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SiteAnalysis } from "@/features/email-generation/model/schemas";

export function SiteAudienceSummary({ analysis }: { analysis: SiteAnalysis }) {
  return <>
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="space-y-2" aria-label="Produtos">
        <h4 className="flex items-center gap-2 text-sm font-medium"><Package className="h-4 w-4 text-primary" />Produtos</h4>
        <div className="flex flex-wrap gap-1">{analysis.products.slice(0, 6).map((product) => <Badge key={product} variant="secondary" className="text-xs">{product}</Badge>)}</div>
        {analysis.priceRange && <p className="text-xs text-muted-foreground">Faixa de preço: {analysis.priceRange}</p>}
      </section>
      <section className="space-y-2" aria-label="Público-alvo">
        <h4 className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4 text-primary" />Público-alvo</h4>
        <p className="text-sm text-muted-foreground">{analysis.targetAudience}</p>
      </section>
    </div>
    <section className="space-y-2" aria-label="Oportunidades de email marketing">
      <h4 className="flex items-center gap-2 text-sm font-medium"><Lightbulb className="h-4 w-4 text-warning" />Oportunidades de email marketing</h4>
      <div className="flex flex-wrap gap-1">{analysis.emailOpportunities.map((opportunity) => <Badge key={opportunity} variant="outline" className="border-warning/50 text-xs text-warning">{opportunity}</Badge>)}</div>
    </section>
  </>;
}
