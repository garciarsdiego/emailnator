import { Building2, ExternalLink, Globe, Quote, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SiteAnalysis } from "@/features/email-generation/model/schemas";
import { SiteAudienceSummary } from "@/features/email-generation/ui/SiteAudienceSummary";
import { SiteBrandingSummary } from "@/features/email-generation/ui/SiteBrandingSummary";
import { safeExternalHttpUrl } from "@/shared/security/urls";

const languageLabels: Record<string, string> = {
  "pt-BR": "🇧🇷 Português (Brasil)", "pt-PT": "🇵🇹 Português (Portugal)",
  "en-US": "🇺🇸 English (US)", "en-GB": "🇬🇧 English (UK)",
  es: "🇪🇸 Español", "es-MX": "🇲🇽 Español (México)", fr: "🇫🇷 Français",
  de: "🇩🇪 Deutsch", it: "🇮🇹 Italiano",
};

const offerLabels: Record<string, string> = {
  discount: "Desconto", coupon: "Cupom", freeShipping: "Frete grátis",
  installment: "Parcelamento", seasonal: "Sazonal",
};

export function SiteAnalysisCard({ analysis }: { analysis: SiteAnalysis }) {
  const catalogUrl = safeExternalHttpUrl(analysis.catalogUrl);
  return (
    <Card className="glass-card border-accent/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-accent" />{analysis.brandName}
              {analysis.language && <Badge variant="outline" className="text-xs"><Globe className="mr-1 h-3 w-3" />{languageLabels[analysis.language] || analysis.language}</Badge>}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{analysis.description}</p>
            {analysis.slogan && <p className="mt-1 flex items-center gap-1 text-xs italic text-muted-foreground"><Quote className="h-3 w-3" />{analysis.slogan}</p>}
          </div>
          {catalogUrl && <a href={catalogUrl} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"><ExternalLink className="h-4 w-4" />Catálogo</a>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <SiteBrandingSummary analysis={analysis} />
        {(analysis.activeOffers?.length ?? 0) > 0 && (
          <section className="space-y-2" aria-label="Ofertas ativas">
            <h4 className="flex items-center gap-2 text-sm font-medium"><Tag className="h-4 w-4 text-success" />Ofertas ativas</h4>
            <div className="space-y-2">
              {analysis.activeOffers?.map((offer, index) => (
                <div key={`${offer.type}-${offer.code}-${index}`} className="rounded-lg border border-success/20 bg-success/10 p-2">
                  <div className="flex items-center gap-2">
                    {offer.type && <Badge variant="outline" className="border-success/50 text-xs text-success">{offerLabels[offer.type] || offer.type}</Badge>}
                    {offer.code && <code className="rounded bg-success/20 px-2 py-0.5 font-mono text-xs">{offer.code}</code>}
                  </div>
                  {offer.description && <p className="mt-1 text-xs text-muted-foreground">{offer.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
        <SiteAudienceSummary analysis={analysis} />
      </CardContent>
    </Card>
  );
}
