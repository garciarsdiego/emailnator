import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  niche: string;
  campaignType: string;
  tone: string;
  targetAudience: string;
  siteUrl?: string;
  siteAnalysis?: {
    products?: string[];
    brandName?: string;
    description?: string;
  };
  language?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, campaignType, tone, targetAudience, siteUrl, siteAnalysis, language = "pt-BR" } = await req.json() as EmailRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

    const campaignTypeDescriptions: Record<string, string> = {
      welcome: "e-mail de boas-vindas para novos clientes",
      abandoned_cart: "recuperação de carrinho abandonado",
      promotional: "promoção ou oferta especial",
      new_product: "lançamento de novo produto",
      seasonal: "campanha sazonal (Black Friday, Natal, etc)",
      reengagement: "reengajamento de clientes inativos",
      loyalty: "programa de fidelidade",
      newsletter: "newsletter informativa",
      feedback: "solicitação de feedback ou avaliação",
      upsell: "upsell ou cross-sell",
    };

    const toneDescriptions: Record<string, string> = {
      formal: "formal e profissional",
      casual: "casual e amigável",
      urgent: "urgente e persuasivo",
      playful: "divertido e criativo",
      luxury: "sofisticado e premium",
      emotional: "emocional e inspirador",
    };

    let siteContext = "";
    if (siteAnalysis) {
      siteContext = `
Informações do site analisado:
- Nome da marca: ${siteAnalysis.brandName || "Não identificado"}
- Descrição: ${siteAnalysis.description || "Não disponível"}
- Produtos principais: ${siteAnalysis.products?.join(", ") || "Não identificados"}
${siteUrl ? `- URL: ${siteUrl}` : ""}
`;
    }

    const systemPrompt = `Você é um especialista em email marketing para e-commerce brasileiro. Sua função é criar emails de marketing altamente persuasivos e otimizados para conversão.

REGRAS OBRIGATÓRIAS:
1. Escreva SEMPRE em português brasileiro
2. O assunto deve ter no máximo 50 caracteres
3. Inclua emojis estratégicos no assunto e corpo do email
4. Use técnicas de copywriting como urgência, escassez, prova social
5. Inclua um CTA (Call-to-Action) claro e persuasivo
6. O email deve ser responsivo e funcionar bem em mobile
7. Personalize com {{nome}} onde apropriado
8. Use bullet points para benefícios
9. Mantenha parágrafos curtos (2-3 linhas)

FORMATO DE RESPOSTA:
Retorne um JSON válido com a seguinte estrutura:
{
  "subject": "Assunto do email (max 50 chars)",
  "preheader": "Texto de pré-visualização (max 100 chars)",
  "content": "Corpo do email em HTML simples",
  "cta_text": "Texto do botão CTA",
  "tips": ["Dica 1 de otimização", "Dica 2 de otimização"]
}`;

    const userPrompt = `Crie um email de marketing com as seguintes especificações:

NICHO: ${nicheDescriptions[niche] || niche}
TIPO DE CAMPANHA: ${campaignTypeDescriptions[campaignType] || campaignType}
TOM: ${toneDescriptions[tone] || tone}
PÚBLICO-ALVO: ${targetAudience}
${siteContext}

Gere um email completo, persuasivo e otimizado para conversão.`;

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
        temperature: 0.7,
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
      throw new Error("Erro ao gerar email");
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Parse JSON from response (handle markdown code blocks)
    let emailData;
    try {
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        generatedContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, generatedContent];
      emailData = JSON.parse(jsonMatch[1] || generatedContent);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback: create basic structure from text
      emailData = {
        subject: "Confira nossa oferta especial!",
        preheader: "Você não vai querer perder isso...",
        content: generatedContent,
        cta_text: "Comprar Agora",
        tips: ["Personalize o email com o nome do cliente", "Adicione imagens dos produtos"],
      };
    }

    return new Response(JSON.stringify(emailData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-email function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
