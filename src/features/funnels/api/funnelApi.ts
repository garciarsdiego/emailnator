import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { generateEmail } from "@/features/email-generation/api/emailGenerationApi";
import type { SiteAnalysis } from "@/features/email-generation/model/schemas";
import { invokeEdgeFunction } from "@/shared/api/edgeFunctions";
import {
  campaignTypeForStage,
  generatedFunnelSchema,
  type FunnelEmailDraft,
  type FunnelGenerationInput,
  type GeneratedFunnel,
  type SaveFunnelInput,
} from "@/features/funnels/model/funnel";
import type { FunnelStage } from "@/types/emailSequence";

export async function generateFunnel(input: FunnelGenerationInput, idempotencyKey?: string): Promise<GeneratedFunnel> {
  const data = await invokeEdgeFunction<FunnelGenerationInput, unknown>("generate-funnel", input, idempotencyKey);
  return generatedFunnelSchema.parse(data);
}

export async function generateFunnelStage(input: {
  stage: FunnelStage;
  niche: string;
  tone: string;
  targetAudience: string;
  siteAnalysis?: SiteAnalysis;
}, idempotencyKey?: string): Promise<Pick<FunnelEmailDraft, "subject" | "preheader" | "content">> {
  const email = await generateEmail({
    niche: input.niche,
    campaignType: campaignTypeForStage(input.stage.id),
    tone: input.tone,
    targetAudience: input.targetAudience,
    siteAnalysis: input.siteAnalysis,
    additionalContext: `Email ${input.stage.id} de ${5}. Etapa: ${input.stage.name}. Objetivo: ${input.stage.description}. Tipo: ${input.stage.emailType}.`,
  }, idempotencyKey);

  return {
    subject: email.subjects[0],
    preheader: email.preheaders[0] ?? "",
    content: email.content,
  };
}

export async function saveFunnel(input: SaveFunnelInput): Promise<string> {
  const { data, error } = await supabase.rpc("save_email_sequence", {
    p_name: input.name,
    p_description: input.description,
    p_niche: input.niche,
    p_tone: input.tone,
    p_emails: input.emails as unknown as Json,
  });

  if (error) throw error;
  if (!data) throw new Error("O fluxo foi salvo sem retornar um identificador.");
  return data;
}
