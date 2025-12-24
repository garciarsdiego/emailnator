import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NicheSelector } from "@/components/NicheSelector";
import { CampaignTypeSelector } from "@/components/CampaignTypeSelector";
import { ToneSelector } from "@/components/ToneSelector";
import { EmailPreview } from "@/components/EmailPreview";
import { SiteAnalysisCard } from "@/components/SiteAnalysisCard";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useCampaigns } from "@/hooks/useCampaigns";
import { toast } from "sonner";
import { Loader2, Sparkles, Search, AlertCircle } from "lucide-react";

interface SiteAnalysis {
  brandName: string;
  description: string;
  niche: string;
  products: string[];
  targetAudience: string;
  strengths: string[];
  emailOpportunities: string[];
}

interface GeneratedEmail {
  subject: string;
  preheader: string;
  content: string;
  cta_text: string;
  tips: string[];
}

export function EmailGenerator() {
  const [niche, setNiche] = useState("");
  const [campaignType, setCampaignType] = useState("");
  const [tone, setTone] = useState("casual");
  const [targetAudience, setTargetAudience] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysis | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { hasEmailCredits, hasAnalysisCredits, consumeEmailCredit, consumeAnalysisCredit, totalEmails, totalAnalyses } =
    useUserCredits();
  const { createCampaign } = useCampaigns();

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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-site`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
      
      // Consume credit after successful analysis
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          niche,
          campaignType,
          tone,
          targetAudience,
          siteUrl: siteUrl || undefined,
          siteAnalysis: siteAnalysis || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar email");
      }

      const email = await response.json();
      setGeneratedEmail(email);

      // Consume credit and save campaign
      await consumeEmailCredit.mutateAsync();
      
      await createCampaign.mutateAsync({
        niche,
        campaign_type: campaignType,
        subject: email.subject,
        content: email.content,
        tone,
        target_audience: targetAudience,
        site_url: siteUrl || undefined,
        site_analysis: siteAnalysis ? JSON.parse(JSON.stringify(siteAnalysis)) : undefined,
      });

      toast.success("Email gerado e salvo com sucesso!");
    } catch (error) {
      console.error("Error generating email:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar email");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Site Analysis Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Análise de Site (Opcional)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Cole a URL do seu e-commerce para personalizar o email automaticamente
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://sua-loja.com.br"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAnalyzeSite}
              disabled={isAnalyzing || !hasAnalysisCredits}
              variant="secondary"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configurar Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <Button
            onClick={handleGenerateEmail}
            disabled={isGenerating || !hasEmailCredits}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Gerando email com IA...
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

      {/* Generated Email Preview */}
      {generatedEmail && (
        <EmailPreview
          subject={generatedEmail.subject}
          preheader={generatedEmail.preheader}
          content={generatedEmail.content}
          ctaText={generatedEmail.cta_text}
          tips={generatedEmail.tips}
        />
      )}
    </div>
  );
}
