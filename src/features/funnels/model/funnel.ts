import { z } from "zod";
import { FUNNEL_STAGES } from "@/types/emailSequence";
import type { SiteAnalysis } from "@/features/email-generation/model/schemas";

export const funnelEmailSchema = z.object({
  position: z.number().int().min(1).max(20),
  name: z.string().min(1).max(160),
  subject: z.string().min(1).max(300),
  preheader: z.string().max(500).catch(""),
  content: z.string().min(1).max(100_000),
  delay_days: z.number().int().min(0).max(3650),
  trigger_type: z.literal("time_delay").default("time_delay"),
});

export const generatedFunnelSchema = z.object({
  emails: z.array(funnelEmailSchema).length(FUNNEL_STAGES.length),
  tips: z.array(z.string()).catch([]),
});

export type FunnelEmailDraft = z.infer<typeof funnelEmailSchema>;
export type GeneratedFunnel = z.infer<typeof generatedFunnelSchema>;

export interface FunnelGenerationInput {
  niche: string;
  tone: string;
  productDescription: string;
  siteUrl?: string;
  siteAnalysis?: SiteAnalysis;
}

export interface SaveFunnelInput {
  name: string;
  description: string;
  niche: string;
  tone: string;
  emails: FunnelEmailDraft[];
}

export function createEmptyFunnel(): FunnelEmailDraft[] {
  return FUNNEL_STAGES.map((stage) => ({
    position: stage.id,
    name: stage.name,
    subject: "",
    preheader: "",
    content: "",
    delay_days: stage.delay,
    trigger_type: "time_delay",
  }));
}

export function campaignTypeForStage(stageId: number): string {
  const campaignTypes: Record<number, string> = {
    1: "welcome",
    2: "newsletter",
    3: "feedback",
    4: "promotional",
    5: "promotional",
  };
  return campaignTypes[stageId] ?? "newsletter";
}
