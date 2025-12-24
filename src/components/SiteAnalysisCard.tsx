import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Lightbulb, 
  Package, 
  Palette, 
  Type, 
  MessageSquare, 
  Tag, 
  ExternalLink,
  Quote
} from "lucide-react";

interface SiteAnalysis {
  brandName: string;
  description: string;
  slogan?: string;
  logoDescription?: string;
  niche: string;
  branding?: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
    };
    fonts?: {
      heading?: string;
      body?: string;
    };
    visualStyle?: string;
  };
  communication?: {
    tone?: string;
    copyStyle?: string;
    keyPhrases?: string[];
  };
  activeOffers?: Array<{
    type?: string;
    description?: string;
    code?: string;
  }>;
  products: string[];
  catalogUrl?: string;
  priceRange?: string;
  targetAudience: string;
  strengths: string[];
  emailOpportunities: string[];
}

interface SiteAnalysisCardProps {
  analysis: SiteAnalysis;
}

const TONE_LABELS: Record<string, string> = {
  formal: "Formal",
  casual: "Casual",
  playful: "Divertido",
  luxury: "Premium",
  urgent: "Urgente",
  emotional: "Emocional",
};

const OFFER_LABELS: Record<string, string> = {
  discount: "Desconto",
  coupon: "Cupom",
  freeShipping: "Frete Grátis",
  installment: "Parcelamento",
  seasonal: "Sazonal",
};

export function SiteAnalysisCard({ analysis }: SiteAnalysisCardProps) {
  const hasColors = analysis.branding?.colors && 
    Object.values(analysis.branding.colors).some(c => c && c !== "null");
  
  const hasFonts = analysis.branding?.fonts && 
    (analysis.branding.fonts.heading || analysis.branding.fonts.body);

  const hasOffers = analysis.activeOffers && analysis.activeOffers.length > 0;

  const hasCommunication = analysis.communication && 
    (analysis.communication.tone || analysis.communication.keyPhrases?.length);

  return (
    <Card className="glass-card border-accent/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-accent" />
              {analysis.brandName}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{analysis.description}</p>
            {analysis.slogan && (
              <p className="text-xs text-muted-foreground italic mt-1 flex items-center gap-1">
                <Quote className="h-3 w-3" />
                {analysis.slogan}
              </p>
            )}
          </div>
          {analysis.catalogUrl && (
            <a
              href={analysis.catalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Catálogo
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Branding - Colors */}
        {hasColors && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Palette className="h-4 w-4 text-primary" />
              Cores da Marca
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analysis.branding!.colors!).map(([key, value]) => {
                if (!value || value === "null") return null;
                const isHex = value.startsWith("#");
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5"
                  >
                    {isHex && (
                      <div
                        className="h-4 w-4 rounded-full border border-border"
                        style={{ backgroundColor: value }}
                      />
                    )}
                    <span className="text-xs">
                      <span className="text-muted-foreground capitalize">{key}:</span>{" "}
                      <span className="font-mono">{value}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Branding - Fonts */}
        {hasFonts && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Type className="h-4 w-4 text-primary" />
              Tipografia
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.branding?.fonts?.heading && (
                <Badge variant="secondary">
                  Títulos: {analysis.branding.fonts.heading}
                </Badge>
              )}
              {analysis.branding?.fonts?.body && (
                <Badge variant="secondary">
                  Corpo: {analysis.branding.fonts.body}
                </Badge>
              )}
            </div>
            {analysis.branding?.visualStyle && (
              <p className="text-xs text-muted-foreground">
                Estilo: {analysis.branding.visualStyle}
              </p>
            )}
          </div>
        )}

        {/* Communication */}
        {hasCommunication && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4 text-primary" />
              Tom de Comunicação
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.communication?.tone && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {TONE_LABELS[analysis.communication.tone] || analysis.communication.tone}
                </Badge>
              )}
              {analysis.communication?.copyStyle && (
                <span className="text-xs text-muted-foreground">
                  {analysis.communication.copyStyle}
                </span>
              )}
            </div>
            {analysis.communication?.keyPhrases && analysis.communication.keyPhrases.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {analysis.communication.keyPhrases.map((phrase, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    "{phrase}"
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Offers */}
        {hasOffers && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4 text-success" />
              Ofertas Ativas
            </div>
            <div className="space-y-2">
              {analysis.activeOffers!.map((offer, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-success/10 border border-success/20 p-2"
                >
                  <div className="flex items-center gap-2">
                    {offer.type && (
                      <Badge variant="outline" className="text-xs border-success/50 text-success">
                        {OFFER_LABELS[offer.type] || offer.type}
                      </Badge>
                    )}
                    {offer.code && (
                      <code className="text-xs bg-success/20 px-2 py-0.5 rounded font-mono">
                        {offer.code}
                      </code>
                    )}
                  </div>
                  {offer.description && (
                    <p className="text-xs text-muted-foreground mt-1">{offer.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products & Audience */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-primary" />
              Produtos
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.products.slice(0, 6).map((product, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {product}
                </Badge>
              ))}
            </div>
            {analysis.priceRange && (
              <p className="text-xs text-muted-foreground">
                Faixa de preço: {analysis.priceRange}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />
              Público-alvo
            </div>
            <p className="text-sm text-muted-foreground">{analysis.targetAudience}</p>
          </div>
        </div>

        {/* Email Opportunities */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-warning" />
            Oportunidades de Email Marketing
          </div>
          <div className="flex flex-wrap gap-1">
            {analysis.emailOpportunities.map((opp, i) => (
              <Badge key={i} variant="outline" className="text-xs border-warning/50 text-warning">
                {opp}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
