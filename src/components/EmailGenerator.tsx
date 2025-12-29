import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NicheSelector } from "@/components/NicheSelector";
import { CampaignTypeSelector } from "@/components/CampaignTypeSelector";
import { ToneSelector } from "@/components/ToneSelector";
import { EmailBuilder } from "@/components/EmailBuilder";
import { SiteAnalysisCard } from "@/components/SiteAnalysisCard";
import { ContentReferenceInput, ContentReference } from "@/components/ContentReferenceInput";
import { TemplatesPanel } from "@/components/TemplatesPanel";
import { BrandManualEditor } from "@/components/BrandManualEditor";
import { VisualEmailBuilder, EmailContent } from "@/components/email-builder/VisualEmailBuilder";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import { useBrandManual } from "@/hooks/useBrandManual";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { toast } from "sonner";
import { Loader2, Sparkles, Search, AlertCircle, Palette, ArrowLeft, Paintbrush } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
}

interface SiteAnalysis {
  brandName: string;
  description: string;
  niche: string;
  products: string[];
  targetAudience: string;
  strengths: string[];
  emailOpportunities: string[];
  branding?: {
    colors?: BrandColors;
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
}

interface EmailOptions {
  subjects: string[];
  subjectsResend: string[];
  preheaders: string[];
  ctas: string[];
  content: string;
  tips: string[];
  brandName?: string;
  brandColors?: BrandColors;
}

export function EmailGenerator() {
  const [niche, setNiche] = useState("");
  const [campaignType, setCampaignType] = useState("");
  const [tone, setTone] = useState("casual");
  const [targetAudience, setTargetAudience] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [customOffer, setCustomOffer] = useState("");
  const [contentReference, setContentReference] = useState<ContentReference>({ 
    type: "none", 
    url: "" 
  });
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysis | null>(null);
  const [emailOptions, setEmailOptions] = useState<EmailOptions | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visualEditorContent, setVisualEditorContent] = useState<EmailContent | null>(null);
  
  // Debounce timer for auto-analysis
  const autoAnalyzeTimer = useRef<NodeJS.Timeout | null>(null);
  const [pendingAutoAnalyze, setPendingAutoAnalyze] = useState(false);

  const { hasEmailCredits, hasAnalysisCredits, consumeEmailCredit, consumeAnalysisCredit, totalEmails, totalAnalyses } =
    useUserCredits();
  const { createCampaign } = useCampaigns();
  const { brandManual } = useBrandManual();
  const { saveTemplate } = useEmailTemplates();

  // Check if URL is valid for auto-analysis
  const isValidUrl = useCallback((url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }, []);

  // Auto-analyze site when URL changes (with debounce)
  useEffect(() => {
    // Clear any pending timer
    if (autoAnalyzeTimer.current) {
      clearTimeout(autoAnalyzeTimer.current);
      autoAnalyzeTimer.current = null;
    }

    // Don't auto-analyze if:
    // - URL is empty or invalid
    // - Already analyzing
    // - No credits
    // - Already have analysis for this URL
    if (!siteUrl || !isValidUrl(siteUrl) || isAnalyzing || !hasAnalysisCredits) {
      setPendingAutoAnalyze(false);
      return;
    }

    // Show pending indicator
    setPendingAutoAnalyze(true);

    // Debounce: wait 1.5s after user stops typing
    autoAnalyzeTimer.current = setTimeout(() => {
      setPendingAutoAnalyze(false);
      // Only analyze if we don't have analysis yet
      if (!siteAnalysis) {
        handleAnalyzeSite();
      }
    }, 1500);

    return () => {
      if (autoAnalyzeTimer.current) {
        clearTimeout(autoAnalyzeTimer.current);
      }
    };
  }, [siteUrl, hasAnalysisCredits]);

  // Reset analysis when URL changes significantly
  useEffect(() => {
    if (siteAnalysis && siteUrl) {
      // If URL changed, clear previous analysis
      const currentDomain = (() => {
        try {
          return new URL(siteUrl).hostname;
        } catch {
          return "";
        }
      })();
      
      // This is a simplified check - in production you might want more sophisticated comparison
      if (currentDomain && !siteUrl.includes(currentDomain.split(".")[0])) {
        setSiteAnalysis(null);
      }
    }
  }, [siteUrl]);

  // Apply brand manual settings if available
  const applyBrandSettings = () => {
    if (brandManual) {
      if (brandManual.tone) setTone(brandManual.tone);
    }
  };

  const handleUseTemplate = (template: EmailTemplate) => {
    setNiche(template.niche || "");
    setCampaignType(template.campaign_type || "");
    setTone(template.tone || "casual");
    setEmailOptions({
      subjects: [template.subject],
      subjectsResend: [template.subject],
      preheaders: [template.preheader || ""],
      ctas: [template.cta || "Saiba mais"],
      content: template.content,
      tips: [],
      brandName: brandManual?.brand_name || undefined,
      brandColors: brandManual ? {
        primary: brandManual.primary_color,
        secondary: brandManual.secondary_color || undefined,
        accent: brandManual.accent_color || undefined,
        background: brandManual.background_color,
      } : undefined,
    });
    toast.success("Template carregado!");
  };

  const handleUseCampaign = (campaign: Campaign) => {
    setNiche(campaign.niche || "");
    setCampaignType(campaign.campaign_type || "");
    setTone(campaign.tone || "casual");
    setTargetAudience(campaign.target_audience || "");
    
    // Load variations if available, otherwise fallback to single values
    const variations = campaign.variations;
    setEmailOptions({
      subjects: variations?.subjects?.length ? variations.subjects : [campaign.subject],
      subjectsResend: variations?.subjectsResend?.length ? variations.subjectsResend : [campaign.subject],
      preheaders: variations?.preheaders?.length ? variations.preheaders : [""],
      ctas: variations?.ctas?.length ? variations.ctas : ["Saiba mais"],
      content: campaign.content,
      tips: variations?.tips || [],
      brandName: brandManual?.brand_name || undefined,
      brandColors: brandManual ? {
        primary: brandManual.primary_color,
        secondary: brandManual.secondary_color || undefined,
        accent: brandManual.accent_color || undefined,
        background: brandManual.background_color,
      } : undefined,
    });
    toast.success("Email anterior carregado com todas as variações!");
  };

  const handleSaveAsTemplate = async (name: string, subject: string, preheader: string, content: string, cta: string) => {
    try {
      await saveTemplate.mutateAsync({
        name,
        subject,
        preheader,
        content,
        cta,
        campaign_type: campaignType,
        niche,
        tone,
      });
      toast.success("Template salvo!");
    } catch (error) {
      toast.error("Erro ao salvar template");
    }
  };

  const handleAnalyzeSite = async () => {
    if (!siteUrl) {
      toast.error("Insira a URL do site");
      return;
    }

    if (!hasAnalysisCredits) {
      toast.error("Você não tem créditos de análise. Faça upgrade ou compre créditos.");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Get user session token for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Você precisa estar logado para analisar sites.");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-site`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ siteUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao analisar site");
      }

      const analysis = await response.json();
      setSiteAnalysis(analysis);
      setNiche(analysis.niche);
      setTargetAudience(analysis.targetAudience);
      
      await consumeAnalysisCredit.mutateAsync();
      
      toast.success("Site analisado com sucesso!");
    } catch (error) {
      console.error("Error analyzing site:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao analisar site");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateEmail = async () => {
    if (!niche) {
      toast.error("Selecione um nicho");
      return;
    }
    if (!campaignType) {
      toast.error("Selecione o tipo de campanha");
      return;
    }
    if (!targetAudience) {
      toast.error("Descreva o público-alvo");
      return;
    }

    if (!hasEmailCredits) {
      toast.error("Você não tem créditos de email. Faça upgrade ou compre créditos.");
      return;
    }

    setIsGenerating(true);
    try {
      // Get user session token for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Você precisa estar logado para gerar emails.");
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          niche,
          campaignType,
          tone,
          targetAudience,
          siteUrl: siteUrl || undefined,
          siteAnalysis: siteAnalysis || undefined,
          contentReference: contentReference.type !== "none" ? contentReference : undefined,
          customOffer: customOffer || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar email");
      }

      const email = await response.json();
      setEmailOptions(email);

      await consumeEmailCredit.mutateAsync();
      
      await createCampaign.mutateAsync({
        niche,
        campaign_type: campaignType,
        subject: email.subjects?.[0] || email.subject,
        content: email.content,
        tone,
        target_audience: targetAudience,
        site_url: siteUrl || undefined,
        site_analysis: siteAnalysis ? JSON.parse(JSON.stringify(siteAnalysis)) : undefined,
        variations: {
          subjects: email.subjects || [],
          subjectsResend: email.subjectsResend || [],
          preheaders: email.preheaders || [],
          ctas: email.ctas || [],
          tips: email.tips || [],
        },
      });

      toast.success("Email gerado e salvo com sucesso!");
    } catch (error) {
      console.error("Error generating email:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar email");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle opening visual editor with content
  const handleOpenVisualEditor = (content: EmailContent) => {
    setVisualEditorContent({
      ...content,
      brandName: brandManual?.brand_name || content.brandName,
    });
  };

  // Handle saving from visual editor
  const handleVisualSave = async (blocks: any[], html: string, metadata?: { subject: string; preheader: string; templateName?: string }) => {
    if (metadata) {
      try {
        await saveTemplate.mutateAsync({
          name: metadata.templateName || `Visual - ${metadata.subject.slice(0, 30)}...`,
          subject: metadata.subject,
          preheader: metadata.preheader,
          content: html,
          cta: null,
          campaign_type: campaignType || null,
          niche: niche || null,
          tone: tone || null,
        });
        toast.success("Email salvo como template!");
      } catch (error) {
        toast.error("Erro ao salvar template");
      }
    }
    setVisualEditorContent(null);
  };

  // If visual editor is active, show it
  if (visualEditorContent) {
    return (
      <div className="h-full flex flex-col">
        <VisualEmailBuilder
          initialContent={visualEditorContent}
          showMetadataFields={true}
          onSave={handleVisualSave}
          onCancel={() => setVisualEditorContent(null)}
        />
      </div>
    );
  }

  // If email options exist, show the builder in full height mode
  if (emailOptions) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setEmailOptions(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleOpenVisualEditor({
              subject: emailOptions.subjects?.[0] || "",
              subjectResend: emailOptions.subjectsResend?.[0] || "",
              preheader: emailOptions.preheaders?.[0] || "",
              content: emailOptions.content,
              cta: emailOptions.ctas?.[0],
              brandName: emailOptions.brandName,
              subjectVariations: emailOptions.subjects,
              subjectResendVariations: emailOptions.subjectsResend,
              preheaderVariations: emailOptions.preheaders,
            })}
          >
            <Paintbrush className="h-4 w-4 mr-1" />
            Editor Visual
          </Button>
        </div>
        <EmailBuilder
          options={emailOptions}
          onRegenerate={handleGenerateEmail}
          isRegenerating={isGenerating}
          onSaveTemplate={handleSaveAsTemplate}
          brandManual={brandManual}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-4 h-full overflow-hidden">
      {/* Main Form */}
      <div className="space-y-4 overflow-y-auto pb-4 pr-1">
        {/* Brand Manual Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {brandManual?.brand_name && (
              <span className="text-sm text-muted-foreground">
                Usando: <span className="font-medium text-foreground">{brandManual.brand_name}</span>
              </span>
            )}
          </div>
          <BrandManualEditor
            trigger={
              <Button variant="outline" size="sm">
                <Palette className="h-4 w-4 mr-2" />
                {brandManual ? "Editar Marca" : "Configurar Marca"}
              </Button>
            }
            onSave={applyBrandSettings}
          />
        </div>

        {/* Site Analysis Section */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-primary" />
              Análise de Site
              {pendingAutoAnalyze && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  (analisará automaticamente...)
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Cole a URL do seu e-commerce - a análise iniciará automaticamente
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="https://sua-loja.com.br"
                  value={siteUrl}
                  onChange={(e) => {
                    setSiteUrl(e.target.value);
                    // Clear previous analysis when URL changes
                    if (siteAnalysis) {
                      setSiteAnalysis(null);
                    }
                  }}
                  className={pendingAutoAnalyze ? "pr-8" : ""}
                />
                {pendingAutoAnalyze && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button
                onClick={handleAnalyzeSite}
                disabled={isAnalyzing || !hasAnalysisCredits || !siteUrl}
                variant={siteAnalysis ? "outline" : "default"}
                size="default"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : siteAnalysis ? (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Reanalisar
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analisar ({totalAnalyses})
                  </>
                )}
              </Button>
            </div>
            {!hasAnalysisCredits && (
              <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                <AlertCircle className="h-4 w-4" />
                Você usou sua análise gratuita. Faça upgrade para mais análises.
              </div>
            )}
            {siteAnalysis && <SiteAnalysisCard analysis={siteAnalysis} />}
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Configurar Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <NicheSelector value={niche} onChange={setNiche} />
            <CampaignTypeSelector value={campaignType} onChange={setCampaignType} />
            <ToneSelector value={tone} onChange={setTone} />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Público-alvo
              </label>
              <Textarea
                placeholder="Ex: Mulheres de 25-45 anos, interessadas em moda sustentável, classe B/C, que buscam qualidade e bom custo-benefício..."
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                rows={3}
              />
            </div>

            {/* Content Reference Input */}
            <ContentReferenceInput 
              value={contentReference} 
              onChange={setContentReference} 
            />

            {/* Custom Offer Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                Oferta Personalizada
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Input
                placeholder="Ex: 20% OFF no lançamento, Frete Grátis, Compre 2 Leve 3..."
                value={customOffer}
                onChange={(e) => setCustomOffer(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Adicione uma oferta que não está no site para campanhas futuras ou promoções especiais
              </p>
            </div>

            <Button
              onClick={handleGenerateEmail}
              disabled={isGenerating || !hasEmailCredits}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Gerando opções de email...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Gerar Email ({totalEmails} restantes)
                </>
              )}
            </Button>

            {!hasEmailCredits && (
              <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                <AlertCircle className="h-4 w-4" />
                Você usou todos os seus créditos de email. Faça upgrade para continuar.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar - Templates & History */}
      <div className="hidden lg:block overflow-y-auto">
        <TemplatesPanel
          onUseTemplate={handleUseTemplate}
          onUseCampaign={handleUseCampaign}
          onEditVisual={handleOpenVisualEditor}
        />
      </div>
    </div>
  );
}