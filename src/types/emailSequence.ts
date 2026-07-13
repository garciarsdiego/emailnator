export const FUNNEL_STAGES = [
  {
    id: 1,
    name: "Consciência",
    description: "Apresentar sua marca e criar conexão inicial",
    emailType: "Boas-vindas / Apresentação",
    delay: 0,
    example: "Inscrição no Newsletter, Download de e-book",
  },
  {
    id: 2,
    name: "Interesse",
    description: "Educar sobre o problema e sua solução",
    emailType: "Educacional / Valor",
    delay: 2,
    example: "Usuários que acessaram o blog, Visualizou página de produto",
  },
  {
    id: 3,
    name: "Consideração",
    description: "Mostrar provas sociais e cases de sucesso",
    emailType: "Prova Social / Testemunhos",
    delay: 4,
    example: "Adicionou produto ao carrinho, Favoritou um item",
  },
  {
    id: 4,
    name: "Intenção",
    description: "Apresentar oferta com urgência",
    emailType: "Oferta Principal",
    delay: 6,
    example: "Checkout iniciado, Carrinho abandonado há 1 dia",
  },
  {
    id: 5,
    name: "Decisão",
    description: "Último empurrão com escassez",
    emailType: "Última Chance / Escassez",
    delay: 7,
    example: "Carrinho abandonado há 3 dias, Cupom prestes a expirar",
  },
] as const;

export type FunnelStage = typeof FUNNEL_STAGES[number];
