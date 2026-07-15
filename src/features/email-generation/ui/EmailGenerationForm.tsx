import { AlertCircle, Loader2, Palette, Search, Sparkles } from "lucide-react";
import { BrandManualEditor } from "@/components/BrandManualEditor";
import { CampaignTypeSelector } from "@/components/CampaignTypeSelector";
import {
  ContentReferenceInput,
  type ContentReference,
} from "@/components/ContentReferenceInput";
import { NicheSelector } from "@/components/NicheSelector";
import { SiteAnalysisCard } from "@/components/SiteAnalysisCard";
import { ToneSelector } from "@/components/ToneSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SiteAnalysis } from "@/features/email-generation/model/schemas";
import type { BrandManual } from "@/hooks/useBrandManual";

interface EmailGenerationFormProps {
  brandManual: BrandManual | null | undefined;
  siteUrl: string;
  siteAnalysis: SiteAnalysis | null;
  isAnalyzing: boolean;
  hasAnalysisCredits: boolean;
  totalAnalyses: number;
  niche: string;
  campaignType: string;
  tone: string;
  targetAudience: string;
  contentReference: ContentReference;
  customOffer: string;
  isGenerating: boolean;
  hasEmailCredits: boolean;
  totalEmails: number;
  onBrandSaved: () => void;
  onSiteUrlChange: (value: string) => void;
  onAnalyze: () => void;
  onNicheChange: (value: string) => void;
  onCampaignTypeChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onTargetAudienceChange: (value: string) => void;
  onContentReferenceChange: (value: ContentReference) => void;
  onCustomOfferChange: (value: string) => void;
  onGenerate: () => void;
}

export function EmailGenerationForm({
  brandManual,
  siteUrl,
  siteAnalysis,
  isAnalyzing,
  hasAnalysisCredits,
  totalAnalyses,
  niche,
  campaignType,
  tone,
  targetAudience,
  contentReference,
  customOffer,
  isGenerating,
  hasEmailCredits,
  totalEmails,
  onBrandSaved,
  onSiteUrlChange,
  onAnalyze,
  onNicheChange,
  onCampaignTypeChange,
  onToneChange,
  onTargetAudienceChange,
  onContentReferenceChange,
  onCustomOfferChange,
  onGenerate,
}: EmailGenerationFormProps) {
  return (
    <div className="space-y-4 overflow-y-auto pb-4 pr-1">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {brandManual?.brand_name ? (
            <>
              Direção de marca: <strong className="text-foreground">{brandManual.brand_name}</strong>
            </>
          ) : (
            "Adicione sua marca para manter contexto e consistência entre campanhas."
          )}
        </p>
        <BrandManualEditor
          trigger={
            <Button variant="outline" size="sm">
              <Palette className="mr-2 h-4 w-4" />
              {brandManual ? "Editar marca" : "Configurar marca"}
            </Button>
          }
          onSave={onBrandSaved}
        />
      </div>

      <Card className="rounded-lg shadow-[var(--shadow-v3-paper)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4 text-primary" />
            Referência e contexto
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use uma URL como fonte de posicionamento antes de gastar um crédito de análise.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              inputMode="url"
              placeholder="https://sua-loja.com.br"
              value={siteUrl}
              onChange={(event) => onSiteUrlChange(event.target.value)}
              aria-label="URL do site"
            />
            <Button
              onClick={onAnalyze}
              disabled={isAnalyzing || !hasAnalysisCredits || !siteUrl}
              variant={siteAnalysis ? "outline" : "default"}
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              {isAnalyzing
                ? "Analisando"
                : siteAnalysis
                  ? "Reanalisar"
                  : `Analisar (${totalAnalyses})`}
            </Button>
          </div>

          {!hasAnalysisCredits && (
            <InlineNotice>
              Seu saldo de análises terminou. Consulte os planos para continuar.
            </InlineNotice>
          )}
          {siteAnalysis && <SiteAnalysisCard analysis={siteAnalysis} />}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-[var(--shadow-v3-paper)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Direção da campanha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <NicheSelector value={niche} onChange={onNicheChange} />
          <CampaignTypeSelector value={campaignType} onChange={onCampaignTypeChange} />
          <ToneSelector value={tone} onChange={onToneChange} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="target-audience">
              Público e objeções
            </label>
            <Textarea
              id="target-audience"
              placeholder="Descreva contexto, necessidades e objeções do público."
              value={targetAudience}
              onChange={(event) => onTargetAudienceChange(event.target.value)}
              rows={3}
            />
          </div>

          <ContentReferenceInput value={contentReference} onChange={onContentReferenceChange} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="custom-offer">
              Oferta principal <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Input
              id="custom-offer"
              placeholder="Ex.: 20% de desconto até sexta-feira"
              value={customOffer}
              onChange={(event) => onCustomOfferChange(event.target.value)}
            />
          </div>

          <Button
            onClick={onGenerate}
            disabled={isGenerating || !hasEmailCredits}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            {isGenerating ? "Gerando campanha" : `Gerar campanha (${totalEmails} restantes)`}
          </Button>

          {!hasEmailCredits && (
            <InlineNotice>
              Seu saldo de emails terminou. Consulte os planos para continuar.
            </InlineNotice>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InlineNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-warning/10 p-3 text-sm text-warning">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
