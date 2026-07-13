import { useState } from "react";
import { toast } from "sonner";
import { analyzeSite } from "@/features/email-generation/api/emailGenerationApi";
import type { SiteAnalysis } from "@/features/email-generation/model/schemas";
import { generateFunnel, generateFunnelStage, saveFunnel } from "@/features/funnels/api/funnelApi";
import { createEmptyFunnel, type FunnelEmailDraft } from "@/features/funnels/model/funnel";
import { useUserCredits } from "@/hooks/useUserCredits";
import { FUNNEL_STAGES } from "@/types/emailSequence";
import { useIdempotencyKey } from "@/shared/hooks/useIdempotencyKey";

const toneAliases: Record<string, string> = {
  profissional: "formal",
  amigável: "casual",
  casual: "casual",
  sofisticado: "luxury",
  premium: "luxury",
  divertido: "playful",
  inspirador: "emotional",
};

export function useFunnelWorkflow(onSaved?: (sequenceId: string) => void) {
  const analysisAttempt = useIdempotencyKey();
  const funnelAttempt = useIdempotencyKey();
  const stageAttempt = useIdempotencyKey();
  const { totalEmails, hasAnalysisCredits, refreshCredits } = useUserCredits();
  const [sequenceName, setSequenceName] = useState("");
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysis | null>(null);
  const [emails, setEmails] = useState<FunnelEmailDraft[]>(createEmptyFunnel);
  const [expandedEmail, setExpandedEmail] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const analyze = async () => {
    if (!siteUrl) return toast.error("Digite a URL do site");
    if (!hasAnalysisCredits) return toast.error("Você não tem créditos de análise disponíveis.");

    setIsAnalyzing(true);
    try {
      const payload = { siteUrl };
      const analysis = await analyzeSite(siteUrl, analysisAttempt.getKey(payload));
      setSiteAnalysis(analysis);
      setProductDescription((current) => current || analysis.description);
      const detectedTone = Object.entries(toneAliases).find(([alias]) =>
        analysis.communication?.tone?.toLowerCase().includes(alias),
      );
      if (detectedTone) setTone(detectedTone[1]);
      await refreshCredits();
      analysisAttempt.complete();
      toast.success("Site analisado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível analisar o site.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAll = async () => {
    if (!niche || !tone) return toast.error("Preencha o nicho e o tom.");
    if (!productDescription && !siteAnalysis) {
      return toast.error("Descreva o produto ou analise um site.");
    }
    if (totalEmails < FUNNEL_STAGES.length) {
      return toast.error(`Um funil completo requer ${FUNNEL_STAGES.length} créditos de email.`);
    }

    setIsGenerating(true);
    try {
      const payload = {
        niche,
        tone,
        productDescription: productDescription || siteAnalysis?.description || "",
        siteUrl: siteUrl || undefined,
        siteAnalysis: siteAnalysis || undefined,
      };
      const result = await generateFunnel(payload, funnelAttempt.getKey(payload));
      setEmails(result.emails);
      await refreshCredits();
      funnelAttempt.complete();
      toast.success(result.tips[0] || "Funil completo gerado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o funil.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStage = async (index: number) => {
    if (!niche || !tone) return toast.error("Preencha o nicho e o tom primeiro.");
    if (totalEmails < 1) return toast.error("Você não tem créditos de email disponíveis.");

    const stage = FUNNEL_STAGES[index];
    setGeneratingIndex(index);
    try {
      const payload = {
        stage,
        niche,
        tone,
        targetAudience: productDescription || siteAnalysis?.description || "",
        siteAnalysis: siteAnalysis || undefined,
      };
      const generated = await generateFunnelStage(payload, stageAttempt.getKey(payload));
      setEmails((current) => current.map((email, emailIndex) =>
        emailIndex === index ? { ...email, ...generated } : email,
      ));
      await refreshCredits();
      stageAttempt.complete();
      toast.success(`Email “${stage.name}” gerado.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o email.");
    } finally {
      setGeneratingIndex(null);
    }
  };

  const updateEmail = <Key extends keyof FunnelEmailDraft>(
    index: number,
    field: Key,
    value: FunnelEmailDraft[Key],
  ) => {
    setEmails((current) => current.map((email, emailIndex) =>
      emailIndex === index ? { ...email, [field]: value } : email,
    ));
  };

  const save = async () => {
    if (!sequenceName.trim()) return toast.error("Digite um nome para o fluxo.");
    if (emails.some((email) => !email.subject.trim() || !email.content.trim())) {
      return toast.error("Todos os emails precisam ter assunto e conteúdo.");
    }

    setIsSaving(true);
    try {
      const sequenceId = await saveFunnel({
        name: sequenceName.trim(),
        description: productDescription.trim(),
        niche,
        tone,
        emails,
      });
      toast.success("Fluxo salvo com sucesso!");
      onSaved?.(sequenceId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o fluxo.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    sequenceName, setSequenceName,
    niche, setNiche,
    tone, setTone,
    productDescription, setProductDescription,
    siteUrl, setSiteUrl,
    siteAnalysis,
    emails, expandedEmail, setExpandedEmail,
    isAnalyzing, isGenerating, generatingIndex, isSaving,
    analyze, generateAll, generateStage, updateEmail, save,
  };
}
