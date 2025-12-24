import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Lightbulb, Package } from "lucide-react";

interface SiteAnalysis {
  brandName: string;
  description: string;
  niche: string;
  products: string[];
  targetAudience: string;
  strengths: string[];
  emailOpportunities: string[];
}

interface SiteAnalysisCardProps {
  analysis: SiteAnalysis;
}

export function SiteAnalysisCard({ analysis }: SiteAnalysisCardProps) {
  return (
    <Card className="glass-card border-accent/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-accent" />
          {analysis.brandName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{analysis.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-primary" />
              Produtos
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.products.slice(0, 5).map((product, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {product}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />
              Público-alvo
            </div>
            <p className="text-sm text-muted-foreground">{analysis.targetAudience}</p>
          </div>
        </div>

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
