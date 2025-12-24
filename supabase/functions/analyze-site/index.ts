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
    try {
      const siteResponse = await fetch(siteUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Emailnator/1.0; +https://emailnator.com)",
        },
      });
      if (siteResponse.ok) {
        siteContent = await siteResponse.text();
        // Limit content to avoid token limits
        siteContent = siteContent.substring(0, 15000);
      }
    } catch (fetchError) {
      console.log("Could not fetch site directly, using URL analysis only");
    }

    const systemPrompt = `Você é um especialista em análise de e-commerce. Sua função é analisar sites de lojas online e extrair informações relevantes para marketing.

REGRAS:
1. Identifique o nome da marca/loja
2. Descreva o tipo de produtos vendidos
3. Identifique o público-alvo aparente
4. Liste produtos ou categorias principais
5. Identifique pontos fortes do posicionamento
6. Sugira oportunidades de email marketing

FORMATO DE RESPOSTA (JSON):
{
  "brandName": "Nome da marca",
  "description": "Descrição da loja em 1-2 frases",
  "niche": "fashion|electronics|beauty|home|food|health|sports|pets|kids|jewelry|auto|books|services|other",
  "products": ["Produto 1", "Produto 2", "Produto 3"],
  "targetAudience": "Descrição do público-alvo",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "emailOpportunities": ["Oportunidade 1", "Oportunidade 2", "Oportunidade 3"]
}`;

    const userPrompt = `Analise o seguinte site de e-commerce e extraia informações relevantes para campanhas de email marketing:

URL: ${siteUrl}
${siteContent ? `\nConteúdo do site:\n${siteContent}` : "\n(Não foi possível acessar o conteúdo, analise apenas pela URL)"}`;

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

    // Parse JSON from response
    let analysisData;
    try {
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        generatedContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, generatedContent];
      analysisData = JSON.parse(jsonMatch[1] || generatedContent);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fallback
      analysisData = {
        brandName: "Loja Online",
        description: "E-commerce brasileiro",
        niche: "other",
        products: [],
        targetAudience: "Consumidores brasileiros",
        strengths: [],
        emailOpportunities: ["E-mail de boas-vindas", "Recuperação de carrinho", "Promoções sazonais"],
      };
    }

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
