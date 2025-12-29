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

interface ContentReference {
  type: "product" | "category" | "blog";
  url: string;
  description?: string;
}

interface EmailRequest {
  niche: string;
  campaignType: string;
  tone: string;
  targetAudience: string;
  siteUrl?: string;
  siteAnalysis?: SiteAnalysis;
  contentReference?: ContentReference;
  customOffer?: string;
  language?: string;
}

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

    const { niche, campaignType, tone, targetAudience, siteUrl, siteAnalysis, contentReference, customOffer } = await req.json() as EmailRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Detect language from site analysis or default to Portuguese
    const detectedLanguage = siteAnalysis?.language || "pt-BR";
    const isEnglish = detectedLanguage.startsWith("en");
    const isSpanish = detectedLanguage.startsWith("es");
    const isFrench = detectedLanguage.startsWith("fr");
    const isGerman = detectedLanguage.startsWith("de");
    const isItalian = detectedLanguage.startsWith("it");

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
${customOffer ? `\nOFERTA PERSONALIZADA (PRIORIDADE ALTA - USE ESTA):
- ${customOffer}` : ""}

PRODUTOS:
- Categorias: ${siteAnalysis.products?.join(", ") || "Não identificados"}
- Faixa de preço: ${siteAnalysis.priceRange || "Não identificada"}

PÚBLICO-ALVO DA MARCA: ${siteAnalysis.targetAudience || targetAudience}
${siteUrl ? `- URL: ${siteUrl}` : ""}

IMPORTANTE: Use as expressões, tom e estilo de comunicação da marca para criar um email que pareça ter sido escrito pela própria empresa. Incorpore ofertas ativas quando relevante.
`;
    }

    // Build custom offer context (when no site analysis)
    let customOfferContext = "";
    if (customOffer && !siteAnalysis) {
      customOfferContext = `
=== OFERTA PERSONALIZADA (USE NO EMAIL) ===
${customOffer}

IMPORTANTE: Incorpore esta oferta de forma natural e persuasiva no email.
`;
    }

    // Build content reference context
    let contentReferenceContext = "";
    if (contentReference) {
      const typeLabels = {
        product: "PRODUTO ESPECÍFICO",
        category: "CATEGORIA/COLEÇÃO",
        blog: "POST DO BLOG",
      };
      contentReferenceContext = `
=== CONTEÚDO DE REFERÊNCIA ===
TIPO: ${typeLabels[contentReference.type]}
URL: ${contentReference.url}
${contentReference.description ? `DESCRIÇÃO ADICIONAL: ${contentReference.description}` : ""}

IMPORTANTE: O email deve focar neste conteúdo específico. Mencione-o de forma natural e persuasiva.
`;
    }

    // Determine the effective tone - prioritize brand's own tone if available
    const effectiveTone = siteAnalysis?.communication?.tone || tone;
    const toneInstruction = siteAnalysis?.communication?.tone 
      ? `Use o tom "${toneDescriptions[effectiveTone] || effectiveTone}" que é o estilo natural da marca.`
      : `Use o tom ${toneDescriptions[tone] || tone} conforme solicitado.`;

    // Build language-specific instructions
    const languageInstructions = isEnglish 
      ? `LANGUAGE: Write ALL content in English (US).
Use American English spelling and idioms.
Currency format: $XX.XX`
      : isSpanish
      ? `LANGUAGE: Write ALL content in Spanish.
Use Latin American Spanish for broader reach.
Currency format: depends on the country`
      : isFrench
      ? `LANGUAGE: Write ALL content in French.
Use standard French.
Currency format: XX,XX €`
      : isGerman
      ? `LANGUAGE: Write ALL content in German.
Use standard German.
Currency format: XX,XX €`
      : isItalian
      ? `LANGUAGE: Write ALL content in Italian.
Use standard Italian.
Currency format: XX,XX €`
      : `LANGUAGE: Write ALL content in Brazilian Portuguese.
Use Brazilian Portuguese spelling and idioms.
Currency format: R$ XX,XX`;

    const systemPrompt = `You are an expert in e-commerce email marketing. Your function is to create highly persuasive, personalized, and conversion-optimized marketing emails.

${languageInstructions}

MANDATORY RULES:
1. Subject lines must have a maximum of 50 characters
2. Include strategic emojis in the subject and email body
3. Use copywriting techniques like urgency, scarcity, social proof
4. The email must be responsive and work well on mobile
5. Personalize with {{nome}} or {{name}} where appropriate
6. Use bullet points for benefits
7. Keep paragraphs short (2-3 lines)

PERSONALIZATION BASED ON ANALYSIS:
- If brand information is available, USE its tone and communication style
- If there are active offers, INCORPORATE them naturally into the email
- If there are frequent brand expressions, USE them in the copy
- Maintain consistency with the visual and verbal identity of the brand
- ${toneInstruction}

RESPONSE FORMAT:
Return a valid JSON with the following structure:
{
  "subjects": ["Subject 1 (max 50 chars)", "Subject 2 (max 50 chars)", "Subject 3 (max 50 chars)"],
  "subjectsResend": ["Resend subject 1", "Resend subject 2", "Resend subject 3"],
  "preheaders": ["Preheader 1 (max 100 chars)", "Preheader 2 (max 100 chars)", "Preheader 3 (max 100 chars)"],
  "ctas": ["CTA 1", "CTA 2", "CTA 3"],
  "content": "Email body in simple HTML",
  "tips": ["Optimization tip 1", "Optimization tip 2"]
}

RULES FOR VARIATIONS:
- The 3 first-send subjects should have different approaches: 1 with urgency, 1 with curiosity, 1 with direct benefit
- The 3 resend/A-B subjects should be creative reformulations of the first ones, for those who didn't open
- The 3 preheaders should complement the subjects, not repeat them
- The 3 CTAs should vary in intensity: 1 direct, 1 soft, 1 with urgency`;

    const userPrompt = `Create a marketing email with the following specifications:

DETECTED LANGUAGE: ${detectedLanguage}
NICHE: ${nicheDescriptions[niche] || niche}
CAMPAIGN TYPE: ${campaignTypeDescriptions[campaignType] || campaignType}
REQUESTED TONE: ${toneDescriptions[tone] || tone}
TARGET AUDIENCE: ${targetAudience}
${brandContext}
${customOfferContext}
${contentReferenceContext}

Generate a complete email with 3 subject options (first send), 3 subject options (resend/A-B), 3 preheader options, and 3 CTA options. The email body should be unique but optimized. WRITE EVERYTHING IN ${detectedLanguage.toUpperCase()}.`;

    console.log("Generating email options for:", siteAnalysis?.brandName || niche, "in language:", detectedLanguage, "by user:", user.id);

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
      // Fallback: create basic structure
      emailData = {
        subjects: ["Confira nossa oferta especial! 🎁", "Você não pode perder isso 🚀", "Novidades esperando por você ✨"],
        subjectsResend: ["Ei, você viu isso? 👀", "Última chance! ⏰", "Separamos algo especial 💫"],
        preheaders: ["Aproveite antes que acabe", "Descubra agora", "Não perca essa oportunidade"],
        ctas: ["Comprar Agora", "Ver Ofertas", "Aproveitar Desconto"],
        content: generatedContent,
        tips: ["Personalize o email com o nome do cliente", "Adicione imagens dos produtos"],
      };
    }

    // Ensure arrays exist
    emailData.subjects = emailData.subjects || [emailData.subject || "Confira nossa oferta!"];
    emailData.subjectsResend = emailData.subjectsResend || emailData.subjects.map((s: string) => `Você viu? ${s}`);
    emailData.preheaders = emailData.preheaders || [emailData.preheader || "Não perca essa oportunidade"];
    emailData.ctas = emailData.ctas || [emailData.cta_text || "Comprar Agora"];

    // Include brand info in response for preview styling
    if (siteAnalysis) {
      emailData.brandName = siteAnalysis.brandName;
      emailData.brandColors = siteAnalysis.branding?.colors;
    }

    console.log("Email options generated successfully for:", siteAnalysis?.brandName || "generic");

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
