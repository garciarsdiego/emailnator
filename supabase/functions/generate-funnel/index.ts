import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SiteAnalysis {
  language?: string;
  brandName?: string;
  description?: string;
  slogan?: string;
  products?: string[];
  branding?: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
    };
    fonts?: {
      heading?: string;
      body?: string;
    };
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
  priceRange?: string;
  targetAudience?: string;
}

interface FunnelRequest {
  niche: string;
  tone: string;
  productDescription: string;
  siteUrl?: string;
  siteAnalysis?: SiteAnalysis;
}

const FUNNEL_STAGES = [
  {
    id: 1,
    name: "Boas-vindas",
    description: "Email de boas-vindas após o lead se cadastrar. Apresente a marca, crie conexão emocional e defina expectativas.",
    emailType: "Welcome Email",
    delay: 0,
  },
  {
    id: 2,
    name: "Entrega de Valor",
    description: "Entregue conteúdo educativo, dicas úteis ou insights valiosos relacionados ao problema que você resolve.",
    emailType: "Value Email",
    delay: 2,
  },
  {
    id: 3,
    name: "Prova Social",
    description: "Compartilhe depoimentos, casos de sucesso, números e resultados de clientes satisfeitos.",
    emailType: "Social Proof Email",
    delay: 4,
  },
  {
    id: 4,
    name: "Oferta",
    description: "Apresente sua oferta principal com benefícios claros, bônus e garantias. Crie desejo.",
    emailType: "Offer Email",
    delay: 6,
  },
  {
    id: 5,
    name: "Urgência",
    description: "Último email com escassez e urgência. Deadline, vagas limitadas ou bônus expirando.",
    emailType: "Urgency Email",
    delay: 7,
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError || !user) {
      console.log("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: " + (authError || "No user found") }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { niche, tone, productDescription, siteUrl, siteAnalysis } = await req.json() as FunnelRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating funnel for:", niche, "with tone:", tone, "by user:", user.id);

    // Detect language from site analysis or default to Portuguese
    const detectedLanguage = siteAnalysis?.language || "pt-BR";

    const nicheDescriptions: Record<string, string> = {
      fashion: "moda e vestuário",
      electronics: "eletrônicos e tecnologia",
      beauty: "beleza e cosméticos",
      home: "casa e decoração",
      food: "alimentação e bebidas",
      health: "saúde e bem-estar",
      sports: "esportes e fitness",
      pets: "pets e animais",
      kids: "infantil e bebês",
      jewelry: "joias e acessórios",
      auto: "automotivo",
      books: "livros e educação",
      services: "serviços",
      other: "diversos",
    };

    const toneDescriptions: Record<string, string> = {
      formal: "formal e profissional",
      casual: "casual e amigável",
      urgent: "urgente e persuasivo",
      playful: "divertido e criativo",
      luxury: "sofisticado e premium",
      emotional: "emocional e inspirador",
    };

    // Build rich context from site analysis
    let brandContext = "";
    if (siteAnalysis) {
      brandContext = `
=== INFORMAÇÕES DA MARCA (USE PARA PERSONALIZAR TODOS OS EMAILS) ===

IDENTIDADE DA MARCA:
- Nome: ${siteAnalysis.brandName || "Não identificado"}
- Descrição: ${siteAnalysis.description || "Não disponível"}
- Slogan: ${siteAnalysis.slogan || "Não identificado"}

IDENTIDADE VISUAL:
- Cor primária: ${siteAnalysis.branding?.colors?.primary || "Não identificada"}
- Cor secundária: ${siteAnalysis.branding?.colors?.secondary || "Não identificada"}
- Estilo visual: ${siteAnalysis.branding?.visualStyle || "Não identificado"}

TOM DE COMUNICAÇÃO DA MARCA:
- Tom atual: ${siteAnalysis.communication?.tone || "Não identificado"}
- Estilo de copy: ${siteAnalysis.communication?.copyStyle || "Não identificado"}
- Expressões frequentes: ${siteAnalysis.communication?.keyPhrases?.join(", ") || "Não identificadas"}

OFERTAS ATIVAS (INCORPORE QUANDO RELEVANTE):
${siteAnalysis.activeOffers?.map(o => `- ${o.type}: ${o.description}${o.code ? ` (Código: ${o.code})` : ""}`).join("\n") || "- Nenhuma oferta identificada"}

PÚBLICO-ALVO: ${siteAnalysis.targetAudience || "Não identificado"}
${siteUrl ? `URL: ${siteUrl}` : ""}

IMPORTANTE: Mantenha consistência de tom e estilo em TODOS os 5 emails. Use as expressões da marca.
`;
    }

    const funnelStagesDescription = FUNNEL_STAGES.map(stage => 
      `EMAIL ${stage.id} - ${stage.name} (Envio: ${stage.delay === 0 ? "Imediato" : `+${stage.delay} dias`}):
${stage.description}
Tipo: ${stage.emailType}`
    ).join("\n\n");

    const systemPrompt = `Você é um especialista em email marketing e funis de vendas. Sua função é criar uma sequência completa de 5 emails de funil altamente persuasivos, personalizados e otimizados para conversão.

IDIOMA: Escreva TUDO em Português Brasileiro.

REGRAS OBRIGATÓRIAS PARA TODOS OS EMAILS:
1. Linhas de assunto devem ter no máximo 50 caracteres
2. Inclua emojis estratégicos no assunto e corpo
3. Use técnicas de copywriting: urgência, escassez, prova social
4. Personalize com {{nome}} onde apropriado
5. Use bullet points para benefícios
6. Parágrafos curtos (2-3 linhas)
7. Cada email deve ter um CTA claro e único
8. Mantenha uma narrativa contínua entre os emails - eles devem se conectar

ESTRUTURA DO FUNIL DE 5 EMAILS:
${funnelStagesDescription}

IMPORTANTE SOBRE A JORNADA:
- Email 1 (Boas-vindas): Crie conexão emocional, não venda ainda
- Email 2 (Valor): Eduque e demonstre expertise, crie autoridade
- Email 3 (Prova Social): Use histórias e resultados concretos
- Email 4 (Oferta): Apresente a solução de forma irresistível
- Email 5 (Urgência): Crie FOMO e senso de urgência real

FORMATO DE RESPOSTA:
Retorne um JSON válido com a seguinte estrutura:
{
  "emails": [
    {
      "position": 1,
      "name": "Boas-vindas",
      "subject": "Assunto do email 1 (max 50 chars)",
      "preheader": "Pré-header do email 1 (max 100 chars)",
      "content": "Corpo do email em HTML simples",
      "cta": "Texto do botão CTA",
      "delay_days": 0
    },
    // ... mais 4 emails
  ],
  "tips": ["Dica de otimização 1", "Dica 2", "Dica 3"]
}`;

    const userPrompt = `Crie uma sequência completa de funil de 5 emails com as seguintes especificações:

NICHO: ${nicheDescriptions[niche] || niche}
TOM: ${toneDescriptions[tone] || tone}
PRODUTO/OFERTA: ${productDescription}
${brandContext}

Gere os 5 emails completos do funil, cada um otimizado para sua etapa específica na jornada do cliente. A sequência deve contar uma história coesa e guiar o lead naturalmente até a conversão.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione mais créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao gerar funil");
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Parse JSON from response
    let funnelData;
    try {
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        generatedContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, generatedContent];
      funnelData = JSON.parse(jsonMatch[1] || generatedContent);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error("Erro ao processar resposta da IA");
    }

    // Ensure structure is correct
    if (!funnelData.emails || !Array.isArray(funnelData.emails)) {
      throw new Error("Estrutura de resposta inválida");
    }

    // Add brand info for styling
    if (siteAnalysis) {
      funnelData.brandName = siteAnalysis.brandName;
      funnelData.brandColors = siteAnalysis.branding?.colors;
    }

    console.log("Funnel generated successfully with", funnelData.emails.length, "emails");

    return new Response(JSON.stringify(funnelData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-funnel function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
