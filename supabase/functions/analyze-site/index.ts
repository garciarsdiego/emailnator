import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { siteUrl } = await req.json();
    
    if (!siteUrl) {
      throw new Error("URL do site é obrigatória");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Try to fetch site content
    let siteContent = "";
    let stylesheetContent = "";
    
    try {
      const siteResponse = await fetch(siteUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Emailnator/1.0; +https://emailnator.com)",
        },
      });
      if (siteResponse.ok) {
        siteContent = await siteResponse.text();
        // Limit content to avoid token limits
        siteContent = siteContent.substring(0, 25000);
        
        // Try to extract inline styles and meta info
        const styleMatches = siteContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
        if (styleMatches) {
          stylesheetContent = styleMatches.join("\n").substring(0, 5000);
        }
      }
    } catch (fetchError) {
      console.log("Could not fetch site directly, using URL analysis only");
    }

    const systemPrompt = `Você é um especialista em análise de e-commerce e branding digital. Sua função é analisar sites de lojas online e extrair informações detalhadas sobre a identidade visual, tom de comunicação e oportunidades de marketing.

VOCÊ DEVE ANALISAR E EXTRAIR:

1. **Identidade Visual**:
   - Cores principais (primária, secundária, de destaque, de fundo)
   - Fontes utilizadas (títulos, corpo do texto)
   - Estilo visual geral (minimalista, vibrante, elegante, moderno, etc)

2. **Tom de Voz e Comunicação**:
   - Tom predominante (formal, casual, divertido, sofisticado, urgente)
   - Estilo de copy (direto, storytelling, emocional, técnico)
   - Palavras-chave e expressões frequentes

3. **Ofertas e Promoções Ativas**:
   - Descontos em vigor
   - Cupons ou códigos promocionais visíveis
   - Campanhas sazonais (Black Friday, Natal, etc)
   - Condições especiais (frete grátis, parcelamento)

4. **Elementos de Marca**:
   - Nome da marca/loja
   - URL ou descrição do logo (se identificável)
   - Slogan ou tagline

5. **Catálogo e Produtos**:
   - Categorias principais de produtos
   - Produtos em destaque
   - Link do catálogo/loja (se identificável)
   - Faixa de preços aparente

6. **Público-Alvo**:
   - Perfil demográfico aparente
   - Interesses e valores

7. **Oportunidades de Email Marketing**:
   - Sugestões baseadas na análise

FORMATO DE RESPOSTA (JSON):
{
  "brandName": "Nome da marca",
  "description": "Descrição da loja em 1-2 frases",
  "slogan": "Slogan ou tagline (se houver)",
  "logoDescription": "Descrição do logo ou URL se encontrada",
  "niche": "fashion|electronics|beauty|home|food|health|sports|pets|kids|jewelry|auto|books|services|other",
  "branding": {
    "colors": {
      "primary": "#hexcode ou nome da cor",
      "secondary": "#hexcode ou nome da cor",
      "accent": "#hexcode ou nome da cor",
      "background": "#hexcode ou nome da cor"
    },
    "fonts": {
      "heading": "Nome da fonte de títulos",
      "body": "Nome da fonte do corpo"
    },
    "visualStyle": "Descrição do estilo visual em 1 frase"
  },
  "communication": {
    "tone": "formal|casual|playful|luxury|urgent|emotional",
    "copyStyle": "Descrição do estilo de copy",
    "keyPhrases": ["Frase 1", "Frase 2", "Frase 3"]
  },
  "activeOffers": [
    {
      "type": "discount|coupon|freeShipping|installment|seasonal",
      "description": "Descrição da oferta",
      "code": "Código do cupom (se houver)"
    }
  ],
  "products": ["Produto/categoria 1", "Produto/categoria 2", "Produto/categoria 3"],
  "catalogUrl": "URL do catálogo (se identificável)",
  "priceRange": "Faixa de preços (ex: R$50 - R$500)",
  "targetAudience": "Descrição do público-alvo",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "emailOpportunities": ["Oportunidade 1", "Oportunidade 2", "Oportunidade 3"]
}`;

    const userPrompt = `Analise o seguinte site de e-commerce e extraia todas as informações solicitadas sobre identidade visual, comunicação, ofertas e produtos:

URL: ${siteUrl}
${siteContent ? `\nConteúdo HTML do site:\n${siteContent}` : "\n(Não foi possível acessar o conteúdo, analise apenas pela URL)"}
${stylesheetContent ? `\nEstilos CSS encontrados:\n${stylesheetContent}` : ""}

Extraia o máximo de informações possível para personalizar campanhas de email marketing.`;

    console.log("Analyzing site:", siteUrl);

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
        temperature: 0.3,
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
      throw new Error("Erro ao analisar site");
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log("AI response received, parsing JSON...");

    // Parse JSON from response
    let analysisData;
    try {
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        generatedContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, generatedContent];
      analysisData = JSON.parse(jsonMatch[1] || generatedContent);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback with empty structure
      analysisData = {
        brandName: "Loja Online",
        description: "E-commerce brasileiro",
        slogan: null,
        logoDescription: null,
        niche: "other",
        branding: {
          colors: { primary: null, secondary: null, accent: null, background: null },
          fonts: { heading: null, body: null },
          visualStyle: "Não identificado"
        },
        communication: {
          tone: "casual",
          copyStyle: "Não identificado",
          keyPhrases: []
        },
        activeOffers: [],
        products: [],
        catalogUrl: null,
        priceRange: null,
        targetAudience: "Consumidores brasileiros",
        strengths: [],
        emailOpportunities: ["E-mail de boas-vindas", "Recuperação de carrinho", "Promoções sazonais"],
      };
    }

    console.log("Analysis complete for:", siteUrl);

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-site function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
