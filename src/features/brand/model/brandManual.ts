export interface BrandManualFormData {
  brand_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  heading_font: string;
  body_font: string;
  tone: string;
  language_style: string;
  key_phrases: string[];
}

export const EMPTY_BRAND_MANUAL: BrandManualFormData = {
  brand_name: "",
  primary_color: "#6366f1",
  secondary_color: "",
  accent_color: "",
  background_color: "#ffffff",
  heading_font: "Arial",
  body_font: "Arial",
  tone: "casual",
  language_style: "",
  key_phrases: [],
};
