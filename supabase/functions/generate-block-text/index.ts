import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BlockTextRequest {
  textType: string;
  context?: string;
  tone: string;
  blockType: string;
  currentText?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textType, context, tone, blockType, currentText } = await req.json() as BlockTextRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const textTypeDescriptions: Record<string, string> = {
      headline: "um título/headline chamativo e impactante para email marketing",
      paragraph: "um parágrafo persuasivo para o corpo do email",
      cta: "um texto curto e persuasivo para botão de call-to-action",
      benefits: "uma lista de 3-4 benefícios em formato de bullet points",
      urgency: "um texto que cria senso de urgência ou escassez",
      social_proof: "um texto de prova social com depoimento ou estatística",
    };

    const toneDescriptions: Record<string, string> = {
      casual: "casual e amigável",
      formal: "formal e profissional",
      urgent: "urgente e persuasivo",
      playful: "divertido e criativo",
      luxury: "sofisticado e premium",
    };

    const systemPrompt = `Você é um especialista em copywriting para email marketing. Gere textos persuasivos, criativos e otimizados para conversão.

REGRAS:
- Escreva em português brasileiro
- Use emojis quando apropriado (mas não exagere)
- Seja conciso e direto
- Foque em benefícios, não características
- Crie conexão emocional com o leitor

FORMATO DE RESPOSTA:
Retorne APENAS o texto gerado, sem explicações ou marcações.`;

    const userPrompt = `Gere ${textTypeDescriptions[textType] || "um texto"} com tom ${toneDescriptions[tone] || tone}.

${context ? `CONTEXTO/PRODUTO: ${context}` : ""}
${currentText ? `TEXTO ATUAL (use como referência): ${currentText}` : ""}

${blockType === "button" ? "O texto deve ser curto (2-4 palavras) e ter call-to-action claro." : ""}
${blockType === "header" ? "O texto deve ser um nome de marca ou título de campanha." : ""}

Gere apenas o texto, sem explicações.`;

    console.log("Generating block text:", textType, tone, blockType);

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
        max_tokens: 500,
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
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      throw new Error("Erro ao gerar texto");
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content.trim();

    console.log("Text generated successfully");

    return new Response(
      JSON.stringify({ text: generatedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-block-text function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
