import type { SiteAnalysis } from "@/features/email-generation/model/schemas";
import { NICHES, TONES } from "@/lib/constants";
import { AlertCircle, CheckCircle2, Globe, Loader2, Search, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FunnelSetupCardProps {
  sequenceName: string;
  niche: string;
  tone: string;
  productDescription: string;
  siteUrl: string;
  siteAnalysis: SiteAnalysis | null;
  isAnalyzing: boolean;
  isGenerating: boolean;
  onSequenceNameChange: (value: string) => void;
  onNicheChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onProductDescriptionChange: (value: string) => void;
  onSiteUrlChange: (value: string) => void;
  onAnalyze: () => void;
  onGenerate: () => void;
}

export function FunnelSetupCard(props: FunnelSetupCardProps) {
  const {
    sequenceName, niche, tone, productDescription, siteUrl, siteAnalysis,
    isAnalyzing, isGenerating, onSequenceNameChange, onNicheChange,
    onToneChange, onProductDescriptionChange, onSiteUrlChange, onAnalyze, onGenerate,
  } = props;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Criar fluxo de funil
        </CardTitle>
        <CardDescription>
          Configure uma sequência de cinco emails para conduzir o lead até a decisão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4 rounded-lg border bg-muted/30 p-4" aria-labelledby="site-analysis-title">
          <div id="site-analysis-title" className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4 text-primary" />
            Análise de site <span className="font-normal text-muted-foreground">(opcional)</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={siteUrl}
              onChange={(event) => onSiteUrlChange(event.target.value)}
              placeholder="https://seusite.com.br"
              disabled={isAnalyzing}
              inputMode="url"
              aria-label="URL do site"
            />
            <Button onClick={onAnalyze} disabled={isAnalyzing || !siteUrl} variant="secondary">
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {isAnalyzing ? "Analisando..." : "Analisar"}
            </Button>
          </div>

          {siteAnalysis && (
            <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Site analisado: {siteAnalysis.brandName}
              </div>
              {siteAnalysis.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{siteAnalysis.description}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {siteAnalysis.communication?.tone && <Badge variant="secondary">Tom: {siteAnalysis.communication.tone}</Badge>}
                {siteAnalysis.products.length > 0 && <Badge variant="secondary">{siteAnalysis.products.length} produtos</Badge>}
                {(siteAnalysis.activeOffers?.length ?? 0) > 0 && <Badge variant="secondary">{siteAnalysis.activeOffers?.length} ofertas</Badge>}
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="funnel-name">Nome do fluxo</Label>
            <Input id="funnel-name" value={sequenceName} onChange={(event) => onSequenceNameChange(event.target.value)} placeholder="Ex.: Lançamento Produto X" />
          </div>
          <div className="space-y-2">
            <Label>Nicho</Label>
            <Select value={niche} onValueChange={onNicheChange}>
              <SelectTrigger><SelectValue placeholder="Selecione o nicho" /></SelectTrigger>
              <SelectContent>
                {NICHES.map((item) => <SelectItem key={item.value} value={item.value}>{item.icon} {item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tom</Label>
            <Select value={tone} onValueChange={onToneChange}>
              <SelectTrigger><SelectValue placeholder="Selecione o tom" /></SelectTrigger>
              <SelectContent>
                {TONES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-description">Produto ou oferta</Label>
            <Input id="product-description" value={productDescription} onChange={(event) => onProductDescriptionChange(event.target.value)} placeholder="Descreva brevemente seu produto..." />
          </div>
        </div>

        <Button onClick={onGenerate} disabled={isGenerating || !niche || !tone} className="w-full" size="lg">
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          {isGenerating ? "Gerando funil completo..." : "Gerar funil completo com IA"}
        </Button>

        {!siteAnalysis && !productDescription && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            Analise um site ou descreva seu produto para melhorar o resultado.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
