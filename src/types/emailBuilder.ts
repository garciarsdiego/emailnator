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
  | "footer"
  | "video"
  | "countdown"
  | "product";

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

  // Video
  videoUrl?: string;
  videoThumbnail?: string;
  videoTitle?: string;

  // Countdown
  countdownDate?: string;
  countdownTitle?: string;
  countdownBgColor?: string;
  countdownTextColor?: string;

  // Product
  productName?: string;
  productImage?: string;
  productPrice?: string;
  productOldPrice?: string;
  productDescription?: string;
  productUrl?: string;
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
  video: {
    videoUrl: "",
    videoThumbnail: "",
    videoTitle: "Assista ao vídeo",
  },
  countdown: {
    countdownDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    countdownTitle: "Oferta termina em:",
    countdownBgColor: "#6366f1",
    countdownTextColor: "#ffffff",
  },
  product: {
    productName: "Nome do Produto",
    productImage: "",
    productPrice: "R$ 99,90",
    productOldPrice: "R$ 149,90",
    productDescription: "Descrição do produto aqui...",
    productUrl: "#",
  },
};
