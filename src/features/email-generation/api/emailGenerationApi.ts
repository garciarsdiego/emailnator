import type { ContentReference } from "@/components/ContentReferenceInput";
import { z } from "zod";
import { invokeEdgeFunction } from "@/shared/api/edgeFunctions";
import {
  emailOptionsSchema,
  siteAnalysisSchema,
  type EmailOptions,
  type SiteAnalysis,
} from "@/features/email-generation/model/schemas";

export interface GenerateEmailInput {
  niche: string;
  campaignType: string;
  tone: string;
  targetAudience: string;
  siteUrl?: string;
  siteAnalysis?: SiteAnalysis;
  contentReference?: ContentReference;
  customOffer?: string;
  additionalContext?: string;
}

export async function analyzeSite(siteUrl: string, idempotencyKey?: string): Promise<SiteAnalysis> {
  const data = await invokeEdgeFunction<{ siteUrl: string }, unknown>("analyze-site", {
    siteUrl,
  }, idempotencyKey);
  return siteAnalysisSchema.parse(data) as SiteAnalysis;
}

export async function generateEmail(input: GenerateEmailInput, idempotencyKey?: string): Promise<EmailOptions> {
  const data = await invokeEdgeFunction<GenerateEmailInput, unknown>("generate-email", input, idempotencyKey);
  return emailOptionsSchema.parse(data) as EmailOptions;
}

const blockTextSchema = z.object({ text: z.string().min(1) });

export async function generateBlockText(input: {
  textType: string;
  context: string;
  tone: string;
  blockType: "text" | "button" | "header" | "footer";
  currentText?: string;
}, idempotencyKey?: string): Promise<string> {
  const data = await invokeEdgeFunction<typeof input, unknown>("generate-block-text", input, idempotencyKey);
  return blockTextSchema.parse(data).text;
}
