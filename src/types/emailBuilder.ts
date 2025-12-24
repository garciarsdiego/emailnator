import { ReactNode } from "react";

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: BlockContent;
  position: number;
}

export type BlockType = 
  | "header"
  | "text"
  | "image"
  | "button"
  | "divider"
  | "spacer"
  | "social"
  | "footer";

export interface BlockContent {
  // Header
  logoUrl?: string;
  brandName?: string;
  
  // Text
  text?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  color?: string;
  
  // Image
  imageUrl?: string;
  altText?: string;
  imageWidth?: string;
  
  // Button
  buttonText?: string;
  buttonUrl?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonRadius?: string;
  
  // Divider
  dividerColor?: string;
  dividerWidth?: string;
  
  // Spacer
  spacerHeight?: string;
  
  // Social
  socialLinks?: {
    platform: string;
    url: string;
  }[];
  
  // Footer
  companyName?: string;
  address?: string;
  unsubscribeText?: string;
}

export interface EmailBlockDefinition {
  type: BlockType;
  label: string;
  icon: ReactNode;
  defaultContent: BlockContent;
}

export const DEFAULT_BLOCKS: Record<BlockType, BlockContent> = {
  header: {
    brandName: "Sua Marca",
    logoUrl: "",
  },
  text: {
    text: "Digite seu texto aqui...",
    fontSize: "16px",
    fontWeight: "normal",
    textAlign: "left",
    color: "#333333",
  },
  image: {
    imageUrl: "",
    altText: "Imagem do email",
    imageWidth: "100%",
  },
  button: {
    buttonText: "Clique Aqui",
    buttonUrl: "#",
    buttonColor: "#6366f1",
    buttonTextColor: "#ffffff",
    buttonRadius: "8px",
  },
  divider: {
    dividerColor: "#e5e7eb",
    dividerWidth: "100%",
  },
  spacer: {
    spacerHeight: "24px",
  },
  social: {
    socialLinks: [
      { platform: "instagram", url: "#" },
      { platform: "facebook", url: "#" },
    ],
  },
  footer: {
    companyName: "Sua Empresa",
    address: "Seu endereço aqui",
    unsubscribeText: "Clique aqui para cancelar inscrição",
  },
};
