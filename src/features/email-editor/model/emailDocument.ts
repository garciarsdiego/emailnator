export interface EmailContent {
  subject?: string;
  subjectResend?: string;
  preheader?: string;
  content?: string;
  cta?: string;
  brandName?: string;
  subjectVariations?: string[];
  subjectResendVariations?: string[];
  preheaderVariations?: string[];
}
