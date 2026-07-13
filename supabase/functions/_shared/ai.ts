import { AppError } from "./errors.ts";

const AI_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

interface AiJsonOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  timeoutMs?: number;
}

function apiKey(): string {
  const value = Deno.env.get("LOVABLE_API_KEY")?.trim();
  if (!value) throw new AppError("AI_NOT_CONFIGURED", 503, "AI service is not configured", false);
  return value;
}

function extractJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? content;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        // Fall through to the typed failure below.
      }
    }
    throw new AppError("AI_INVALID_RESPONSE", 502, "The AI service returned an invalid response");
  }
}

export async function callAiJson(options: AiJsonOptions): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 55_000);
  try {
    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("AI_MODEL")?.trim() || DEFAULT_MODEL,
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.userPrompt },
        ],
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (response.status === 429) {
      throw new AppError("AI_RATE_LIMITED", 429, "Limite temporário de geração atingido. Tente novamente em instantes.");
    }
    if (response.status === 402) {
      throw new AppError("AI_PROVIDER_CREDITS_EXHAUSTED", 503, "O serviço de IA está temporariamente indisponível", false);
    }
    if (!response.ok) {
      throw new AppError("AI_PROVIDER_ERROR", 502, "The AI service could not complete the request", false, {
        providerStatus: response.status,
      });
    }

    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > 2_000_000) {
      throw new AppError("AI_RESPONSE_TOO_LARGE", 502, "The AI service returned an oversized response");
    }
    const rawPayload = await response.text();
    if (new TextEncoder().encode(rawPayload).byteLength > 2_000_000) {
      throw new AppError("AI_RESPONSE_TOO_LARGE", 502, "The AI service returned an oversized response");
    }
    let payload: {
      choices?: Array<{ message?: { content?: string } }>;
    };
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      throw new AppError("AI_INVALID_RESPONSE", 502, "The AI service returned invalid JSON");
    }
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new AppError("AI_INVALID_RESPONSE", 502, "The AI service returned an empty response");
    }
    return extractJson(content);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AppError("AI_TIMEOUT", 504, "A geração excedeu o tempo limite. Tente novamente.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
