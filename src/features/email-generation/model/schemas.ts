import { z } from "zod";

export interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
}

export interface SiteAnalysis {
  language?: string;
  brandName: string;
  description: string;
  slogan?: string;
  logoDescription?: string;
  niche: string;
  products: string[];
  catalogUrl?: string;
  priceRange?: string;
  targetAudience: string;
  strengths: string[];
  emailOpportunities: string[];
  branding?: {
    colors?: BrandColors;
    fonts?: { heading?: string; body?: string };
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

export interface EmailOptions {
  subjects: string[];
  subjectsResend: string[];
  preheaders: string[];
  ctas: string[];
  content: string;
  tips: string[];
  brandName?: string;
  brandColors?: BrandColors;
}

const optionalText = z.string().nullish().transform((value) => value ?? undefined);

export const brandColorsSchema = z.object({
  primary: optionalText,
  secondary: optionalText,
  accent: optionalText,
  background: optionalText,
});

export const siteAnalysisSchema = z.object({
  language: optionalText,
  brandName: z.string().min(1).catch("Marca analisada"),
  description: z.string().catch(""),
  slogan: optionalText,
  logoDescription: optionalText,
  niche: z.string().catch("other"),
  products: z.array(z.string()).catch([]),
  catalogUrl: optionalText,
  priceRange: optionalText,
  targetAudience: z.string().catch(""),
  strengths: z.array(z.string()).catch([]),
  emailOpportunities: z.array(z.string()).catch([]),
  branding: z
    .object({
      colors: brandColorsSchema.optional(),
      fonts: z
        .object({ heading: optionalText, body: optionalText })
        .optional(),
      visualStyle: optionalText,
    })
    .optional(),
  communication: z
    .object({
      tone: optionalText,
      copyStyle: optionalText,
      keyPhrases: z.array(z.string()).catch([]),
    })
    .optional(),
  activeOffers: z
    .array(
      z.object({
        type: optionalText,
        description: optionalText,
        code: optionalText,
      }),
    )
    .catch([]),
});

export const emailOptionsSchema = z.object({
  subjects: z.array(z.string().min(1)).min(1),
  subjectsResend: z.array(z.string().min(1)).catch([]),
  preheaders: z.array(z.string()).min(1),
  ctas: z.array(z.string().min(1)).min(1),
  content: z.string().min(1),
  tips: z.array(z.string()).catch([]),
  brandName: optionalText,
  brandColors: brandColorsSchema.optional(),
});
