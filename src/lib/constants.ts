export const NICHES = [
  { value: "fashion", label: "Moda e Vestuário", icon: "👗" },
  { value: "electronics", label: "Eletrônicos e Tecnologia", icon: "📱" },
  { value: "beauty", label: "Beleza e Cosméticos", icon: "💄" },
  { value: "home", label: "Casa e Decoração", icon: "🏠" },
  { value: "food", label: "Alimentação e Bebidas", icon: "🍕" },
  { value: "health", label: "Saúde e Bem-estar", icon: "💊" },
  { value: "sports", label: "Esportes e Fitness", icon: "⚽" },
  { value: "pets", label: "Pets e Animais", icon: "🐕" },
  { value: "kids", label: "Infantil e Bebês", icon: "👶" },
  { value: "jewelry", label: "Joias e Acessórios", icon: "💎" },
  { value: "auto", label: "Automotivo", icon: "🚗" },
  { value: "books", label: "Livros e Educação", icon: "📚" },
  { value: "services", label: "Serviços", icon: "🛠️" },
  { value: "other", label: "Outros", icon: "📦" },
] as const;

export const CAMPAIGN_TYPES = [
  { value: "welcome", label: "Boas-vindas", description: "E-mail de boas-vindas para novos clientes" },
  { value: "abandoned_cart", label: "Carrinho Abandonado", description: "Recuperação de carrinho abandonado" },
  { value: "promotional", label: "Promoção", description: "Oferta especial ou desconto" },
  { value: "new_product", label: "Lançamento", description: "Novo produto ou coleção" },
  { value: "seasonal", label: "Sazonal", description: "Black Friday, Natal, Dia das Mães, etc" },
  { value: "reengagement", label: "Reengajamento", description: "Reativar clientes inativos" },
  { value: "loyalty", label: "Fidelidade", description: "Programa de pontos ou benefícios" },
  { value: "newsletter", label: "Newsletter", description: "Conteúdo informativo regular" },
  { value: "feedback", label: "Feedback", description: "Solicitar avaliação ou opinião" },
  { value: "upsell", label: "Upsell", description: "Oferecer produtos complementares" },
] as const;

export const TONES = [
  { value: "formal", label: "Formal", description: "Profissional e corporativo" },
  { value: "casual", label: "Casual", description: "Amigável e descontraído" },
  { value: "urgent", label: "Urgente", description: "Persuasivo e escasso" },
  { value: "playful", label: "Divertido", description: "Criativo e bem-humorado" },
  { value: "luxury", label: "Premium", description: "Sofisticado e exclusivo" },
  { value: "emotional", label: "Emocional", description: "Inspirador e conectivo" },
] as const;

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    emails: 5,
    analyses: 1,
    users: 1,
    history: "7 dias",
    creditsExpiry: "Ciclo",
  },
  starter: {
    name: "Starter",
    price: 49,
    emails: 50,
    analyses: 10,
    users: 3,
    history: "30 dias",
    creditsExpiry: "Ciclo",
    trial: 7,
  },
  pro: {
    name: "Pro",
    price: 149,
    emails: 200,
    analyses: 50,
    users: 10,
    history: "Ilimitado",
    creditsExpiry: "12 meses",
    trial: 7,
  },
  enterprise: {
    name: "Enterprise",
    price: null,
    emails: "Ilimitado",
    analyses: "Ilimitado",
    users: "Ilimitado",
    history: "Ilimitado",
    creditsExpiry: "Nunca",
  },
} as const;
