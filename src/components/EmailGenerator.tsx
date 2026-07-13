import { useState } from "react";
import type { ContentReference } from "@/components/ContentReferenceInput";
import { TemplatesPanel } from "@/components/TemplatesPanel";
import { VisualEmailBuilder } from "@/components/email-builder/VisualEmailBuilder";
import type { EmailContent } from "@/features/email-editor/model/emailDocument";
import type { EmailBlock } from "@/types/emailBuilder";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import { useBrandManual } from "@/hooks/useBrandManual";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { toast } from "sonner";
import {
  analyzeSite,
  generateEmail,
} from "@/features/email-generation/api/emailGenerationApi";
import type {
  SiteAnalysis,
} from "@/features/email-generation/model/schemas";
import { EmailGenerationForm } from "@/features/email-generation/ui/EmailGenerationForm";
import { saveEmailDocument } from "@/features/email-editor/api/emailDocumentsApi";
import { useAuth } from "@/contexts/AuthContext";
import { useIdempotencyKey } from "@/shared/hooks/useIdempotencyKey";

export function EmailGenerator() {
  const { user } = useAuth();
  const analysisAttempt = useIdempotencyKey();
  const emailAttempt = useIdempotencyKey();
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visualEditorContent, setVisualEditorContent] = useState<EmailContent | null>(null);
  
  const { hasEmailCredits, hasAnalysisCredits, refreshCredits, totalEmails, totalAnalyses } =
    useUserCredits();
  const { createCampaign } = useCampaigns();
  const { brandManual } = useBrandManual();
  const { saveTemplate } = useEmailTemplates();

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
    setVisualEditorContent({
      subject: template.subject,
      subjectResend: template.subject,
      preheader: template.preheader || "",
      cta: template.cta || "Saiba mais",
      content: template.content,
      brandName: brandManual?.brand_name || undefined,
      subjectVariations: [template.subject],
      subjectResendVariations: [template.subject],
      preheaderVariations: [template.preheader || ""],
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
    setVisualEditorContent({
      subject: variations?.subjects?.[0] || campaign.subject,
      subjectResend: variations?.subjectsResend?.[0] || campaign.subject,
      preheader: variations?.preheaders?.[0] || "",
      cta: variations?.ctas?.[0] || "Saiba mais",
      content: campaign.content,
      brandName: brandManual?.brand_name || undefined,
      subjectVariations: variations?.subjects?.length ? variations.subjects : [campaign.subject],
      subjectResendVariations: variations?.subjectsResend?.length ? variations.subjectsResend : [campaign.subject],
      preheaderVariations: variations?.preheaders?.length ? variations.preheaders : [""],
    });
    toast.success("Email anterior carregado com todas as variações!");
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
      const payload = { siteUrl };
      const analysis = await analyzeSite(siteUrl, analysisAttempt.getKey(payload));
      setSiteAnalysis(analysis);
      setNiche(analysis.niche);
      setTargetAudience(analysis.targetAudience);
      
      await refreshCredits();
      analysisAttempt.complete();
      
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
      const payload = {
        niche,
        campaignType,
        tone,
        targetAudience,
        siteUrl: siteUrl || undefined,
        siteAnalysis: siteAnalysis || undefined,
        contentReference: contentReference.type !== "none" ? contentReference : undefined,
        customOffer: customOffer || undefined,
      };
      const email = await generateEmail(payload, emailAttempt.getKey(payload));
      setVisualEditorContent({
        subject: email.subjects[0] || "",
        subjectResend: email.subjectsResend[0] || "",
        preheader: email.preheaders[0] || "",
        content: email.content,
        cta: email.ctas[0],
        brandName: email.brandName,
        subjectVariations: email.subjects,
        subjectResendVariations: email.subjectsResend,
        preheaderVariations: email.preheaders,
      });

      await refreshCredits();
      
      await createCampaign.mutateAsync({
        niche,
        campaign_type: campaignType,
        subject: email.subjects[0],
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
      emailAttempt.complete();

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
  const handleVisualSave = async (blocks: EmailBlock[], html: string, metadata?: { subject: string; preheader: string; templateName?: string }) => {
    if (!user) throw new Error("Sua sessão expirou. Entre novamente para salvar.");

    await saveEmailDocument({
      userId: user.id,
      name: metadata?.templateName || metadata?.subject || "Email gerado",
      subject: metadata?.subject || "",
      preheader: metadata?.preheader || "",
      blocks,
      renderedHtml: html,
    });

    if (metadata?.templateName) {
        await saveTemplate.mutateAsync({
          name: metadata.templateName,
          subject: metadata.subject,
          preheader: metadata.preheader,
          content: html,
          cta: null,
          campaign_type: campaignType || null,
          niche: niche || null,
          tone: tone || null,
        });
    }

    toast.success(metadata?.templateName ? "Email e template salvos!" : "Email salvo!");
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-4 h-full overflow-hidden">
      <EmailGenerationForm
        brandManual={brandManual}
        siteUrl={siteUrl}
        siteAnalysis={siteAnalysis}
        isAnalyzing={isAnalyzing}
        hasAnalysisCredits={hasAnalysisCredits}
        totalAnalyses={totalAnalyses}
        niche={niche}
        campaignType={campaignType}
        tone={tone}
        targetAudience={targetAudience}
        contentReference={contentReference}
        customOffer={customOffer}
        isGenerating={isGenerating}
        hasEmailCredits={hasEmailCredits}
        totalEmails={totalEmails}
        onBrandSaved={applyBrandSettings}
        onSiteUrlChange={(value) => {
          setSiteUrl(value);
          setSiteAnalysis(null);
        }}
        onAnalyze={handleAnalyzeSite}
        onNicheChange={setNiche}
        onCampaignTypeChange={setCampaignType}
        onToneChange={setTone}
        onTargetAudienceChange={setTargetAudience}
        onContentReferenceChange={setContentReference}
        onCustomOfferChange={setCustomOffer}
        onGenerate={handleGenerateEmail}
      />

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
