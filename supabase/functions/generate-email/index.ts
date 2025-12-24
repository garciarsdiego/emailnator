import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SiteAnalysis {
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

interface EmailRequest {
  niche: string;
  campaignType: string;
  tone: string;
  targetAudience: string;
  siteUrl?: string;
  siteAnalysis?: SiteAnalysis;
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

    // Build rich context from site analysis
    let brandContext = "";
    if (siteAnalysis) {
      brandContext = `
=== INFORMAÇÕES DA MARCA (USE PARA PERSONALIZAR) ===

IDENTIDADE DA MARCA:
- Nome: ${siteAnalysis.brandName || "Não identificado"}
- Descrição: ${siteAnalysis.description || "Não disponível"}
- Slogan: ${siteAnalysis.slogan || "Não identificado"}

IDENTIDADE VISUAL:
- Cor primária: ${siteAnalysis.branding?.colors?.primary || "Não identificada"}
- Cor secundária: ${siteAnalysis.branding?.colors?.secondary || "Não identificada"}
- Cor de destaque: ${siteAnalysis.branding?.colors?.accent || "Não identificada"}
- Estilo visual: ${siteAnalysis.branding?.visualStyle || "Não identificado"}
- Fontes: ${siteAnalysis.branding?.fonts?.heading || "Não identificadas"} / ${siteAnalysis.branding?.fonts?.body || ""}

TOM DE COMUNICAÇÃO DA MARCA:
- Tom atual da marca: ${siteAnalysis.communication?.tone || "Não identificado"}
- Estilo de copy: ${siteAnalysis.communication?.copyStyle || "Não identificado"}
- Expressões frequentes: ${siteAnalysis.communication?.keyPhrases?.join(", ") || "Não identificadas"}

OFERTAS ATIVAS (INCORPORE NO EMAIL):
${siteAnalysis.activeOffers?.map(o => `- ${o.type}: ${o.description}${o.code ? ` (Código: ${o.code})` : ""}`).join("\n") || "- Nenhuma oferta identificada"}

PRODUTOS:
- Categorias: ${siteAnalysis.products?.join(", ") || "Não identificados"}
- Faixa de preço: ${siteAnalysis.priceRange || "Não identificada"}

PÚBLICO-ALVO DA MARCA: ${siteAnalysis.targetAudience || targetAudience}
${siteUrl ? `- URL: ${siteUrl}` : ""}

IMPORTANTE: Use as expressões, tom e estilo de comunicação da marca para criar um email que pareça ter sido escrito pela própria empresa. Incorpore ofertas ativas quando relevante.
`;
    }

    // Determine the effective tone - prioritize brand's own tone if available
    const effectiveTone = siteAnalysis?.communication?.tone || tone;
    const toneInstruction = siteAnalysis?.communication?.tone 
      ? `Use o tom "${toneDescriptions[effectiveTone] || effectiveTone}" que é o estilo natural da marca.`
      : `Use o tom ${toneDescriptions[tone] || tone} conforme solicitado.`;

    const systemPrompt = `Você é um especialista em email marketing para e-commerce brasileiro. Sua função é criar emails de marketing altamente persuasivos, personalizados e otimizados para conversão.

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

PERSONALIZAÇÃO COM BASE NA ANÁLISE:
- Se houver informações da marca, USE o tom e estilo de comunicação dela
- Se houver ofertas ativas, INCORPORE-AS naturalmente no email
- Se houver expressões frequentes da marca, USE-AS no copy
- Mantenha consistência com a identidade visual e verbal da marca
- ${toneInstruction}

FORMATO DE RESPOSTA:
Retorne um JSON válido com a seguinte estrutura:
{
  "subject": "Assunto do email (max 50 chars)",
  "preheader": "Texto de pré-visualização (max 100 chars)",
  "content": "Corpo do email em HTML simples",
  "cta_text": "Texto do botão CTA",
  "tips": ["Dica 1 de otimização", "Dica 2 de otimização"],
  "personalization_notes": "Notas sobre como o email foi personalizado para esta marca"
}`;

    const userPrompt = `Crie um email de marketing com as seguintes especificações:

NICHO: ${nicheDescriptions[niche] || niche}
TIPO DE CAMPANHA: ${campaignTypeDescriptions[campaignType] || campaignType}
TOM SOLICITADO: ${toneDescriptions[tone] || tone}
PÚBLICO-ALVO: ${targetAudience}
${brandContext}

Gere um email completo, ALTAMENTE PERSONALIZADO para esta marca, persuasivo e otimizado para conversão.`;

    console.log("Generating email for:", siteAnalysis?.brandName || niche);

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

    // Include brand info in response for preview styling
    if (siteAnalysis) {
      emailData.brandName = siteAnalysis.brandName;
      emailData.brandColors = siteAnalysis.branding?.colors;
    }

    console.log("Email generated successfully for:", siteAnalysis?.brandName || "generic");

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
