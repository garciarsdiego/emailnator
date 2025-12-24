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
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format URL
    let formattedUrl = siteUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Starting analysis for:", formattedUrl);

    let siteContent = "";
    let brandingData: any = null;

    // Try Firecrawl first for better results
    if (FIRECRAWL_API_KEY) {
      console.log("Using Firecrawl to scrape site...");
      
      try {
        // First, scrape with branding to get visual identity
        const brandingResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ["markdown", "branding"],
            onlyMainContent: false,
            waitFor: 3000, // Wait for JS to load
          }),
        });

        if (brandingResponse.ok) {
          const firecrawlData = await brandingResponse.json();
          console.log("Firecrawl scrape successful");
          
          siteContent = firecrawlData.data?.markdown || firecrawlData.markdown || "";
          brandingData = firecrawlData.data?.branding || firecrawlData.branding || null;
          
          // Limit content size
          if (siteContent.length > 30000) {
            siteContent = siteContent.substring(0, 30000);
          }
          
          console.log("Got branding data:", brandingData ? "yes" : "no");
          console.log("Got content length:", siteContent.length);
        } else {
          const errorText = await brandingResponse.text();
          console.error("Firecrawl error:", brandingResponse.status, errorText);
        }
      } catch (firecrawlError) {
        console.error("Firecrawl fetch error:", firecrawlError);
      }
    } else {
      console.log("Firecrawl not configured, trying direct fetch...");
    }

    // Fallback to direct fetch if Firecrawl didn't work
    if (!siteContent) {
      console.log("Trying direct fetch...");
      try {
        const siteResponse = await fetch(formattedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          },
        });
        if (siteResponse.ok) {
          siteContent = await siteResponse.text();
          siteContent = siteContent.substring(0, 25000);
          console.log("Direct fetch successful, content length:", siteContent.length);
        }
      } catch (fetchError) {
        console.log("Direct fetch failed:", fetchError);
      }
    }

    // Build branding context from Firecrawl data
    let brandingContext = "";
    if (brandingData) {
      brandingContext = `
=== DADOS DE BRANDING EXTRAÍDOS DO SITE (FIRECRAWL) ===
${brandingData.logo ? `Logo URL: ${brandingData.logo}` : ""}
${brandingData.colorScheme ? `Esquema de cores: ${brandingData.colorScheme}` : ""}

CORES IDENTIFICADAS:
${brandingData.colors ? Object.entries(brandingData.colors).map(([k, v]) => `- ${k}: ${v}`).join("\n") : "Não identificadas"}

FONTES:
${brandingData.fonts ? brandingData.fonts.map((f: any) => `- ${f.family}`).join("\n") : "Não identificadas"}

TIPOGRAFIA:
${brandingData.typography ? JSON.stringify(brandingData.typography, null, 2) : "Não identificada"}

IMAGENS DA MARCA:
${brandingData.images ? Object.entries(brandingData.images).map(([k, v]) => `- ${k}: ${v}`).join("\n") : "Não identificadas"}
`;
    }

    const systemPrompt = `Você é um especialista em análise de e-commerce e branding digital. Sua função é analisar sites de lojas online e extrair informações detalhadas sobre a identidade visual, tom de comunicação e oportunidades de marketing.

VOCÊ DEVE ANALISAR E EXTRAIR:

1. **Idioma do Site** (MUITO IMPORTANTE):
   - Detecte o idioma principal usado no site (pt-BR, en-US, es, fr, de, it, etc)
   - Baseie-se no conteúdo textual, meta tags, e estrutura do site

2. **Identidade Visual**:
   - Cores principais (primária, secundária, de destaque, de fundo) - USE OS DADOS DE BRANDING SE DISPONÍVEIS
   - Fontes utilizadas (títulos, corpo do texto)
   - Estilo visual geral (minimalista, vibrante, elegante, moderno, etc)

3. **Tom de Voz e Comunicação**:
   - Tom predominante (formal, casual, divertido, sofisticado, urgente)
   - Estilo de copy (direto, storytelling, emocional, técnico)
   - Palavras-chave e expressões frequentes

4. **Ofertas e Promoções Ativas**:
   - Descontos em vigor
   - Cupons ou códigos promocionais visíveis
   - Campanhas sazonais (Black Friday, Natal, etc)
   - Condições especiais (frete grátis, parcelamento)

5. **Elementos de Marca**:
   - Nome da marca/loja
   - URL do logo (se identificável)
   - Slogan ou tagline

6. **Catálogo e Produtos**:
   - Categorias principais de produtos
   - Produtos em destaque
   - Link do catálogo/loja (se identificável)
   - Faixa de preços aparente

7. **Público-Alvo**:
   - Perfil demográfico aparente
   - Interesses e valores

8. **Oportunidades de Email Marketing**:
   - Sugestões baseadas na análise

IMPORTANTE: Se dados de branding (cores, fontes, logo) foram extraídos automaticamente, USE-OS na sua resposta.

FORMATO DE RESPOSTA (JSON):
{
  "language": "pt-BR ou en-US ou es ou outro código de idioma detectado",
  "brandName": "Nome da marca",
  "description": "Descrição da loja em 1-2 frases",
  "slogan": "Slogan ou tagline (se houver)",
  "logoDescription": "URL do logo ou descrição",
  "niche": "fashion|electronics|beauty|home|food|health|sports|pets|kids|jewelry|auto|books|services|other",
  "branding": {
    "colors": {
      "primary": "#hexcode",
      "secondary": "#hexcode",
      "accent": "#hexcode",
      "background": "#hexcode"
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
  "catalogUrl": "URL do catálogo",
  "priceRange": "Faixa de preços (ex: R$50 - R$500)",
  "targetAudience": "Descrição do público-alvo",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "emailOpportunities": ["Oportunidade 1", "Oportunidade 2", "Oportunidade 3"]
}`;

    const userPrompt = `Analise o seguinte site de e-commerce e extraia todas as informações solicitadas:

URL: ${formattedUrl}
${brandingContext}
${siteContent ? `\n=== CONTEÚDO DO SITE ===\n${siteContent}` : "\n(Conteúdo não disponível, analise com base na URL e dados de branding)"}

Extraia o máximo de informações possível para personalizar campanhas de email marketing. USE os dados de branding extraídos quando disponíveis.`;

    console.log("Sending to AI for analysis...");

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
      // Fallback with branding data if available
      analysisData = {
        language: "pt-BR",
        brandName: "Loja Online",
        description: "E-commerce",
        slogan: null,
        logoDescription: brandingData?.logo || null,
        niche: "other",
        branding: {
          colors: brandingData?.colors || { primary: null, secondary: null, accent: null, background: null },
          fonts: { 
            heading: brandingData?.fonts?.[0]?.family || null, 
            body: brandingData?.fonts?.[1]?.family || null 
          },
          visualStyle: "Não identificado"
        },
        communication: {
          tone: "casual",
          copyStyle: "Não identificado",
          keyPhrases: []
        },
        activeOffers: [],
        products: [],
        catalogUrl: formattedUrl,
        priceRange: null,
        targetAudience: "Consumers",
        strengths: [],
        emailOpportunities: ["Welcome email", "Cart recovery", "Seasonal promotions"],
      };
    }

    // Enrich with Firecrawl branding data if AI didn't capture it
    if (brandingData) {
      if (!analysisData.branding?.colors?.primary && brandingData.colors?.primary) {
        analysisData.branding = analysisData.branding || {};
        analysisData.branding.colors = {
          primary: brandingData.colors.primary || analysisData.branding?.colors?.primary,
          secondary: brandingData.colors.secondary || analysisData.branding?.colors?.secondary,
          accent: brandingData.colors.accent || analysisData.branding?.colors?.accent,
          background: brandingData.colors.background || analysisData.branding?.colors?.background,
        };
      }
      if (!analysisData.logoDescription && brandingData.logo) {
        analysisData.logoDescription = brandingData.logo;
      }
      if (!analysisData.branding?.fonts?.heading && brandingData.fonts?.length > 0) {
        analysisData.branding = analysisData.branding || {};
        analysisData.branding.fonts = {
          heading: brandingData.fonts[0]?.family,
          body: brandingData.fonts[1]?.family || brandingData.fonts[0]?.family,
        };
      }
    }

    console.log("Analysis complete for:", formattedUrl, "- Language:", analysisData.language);

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
