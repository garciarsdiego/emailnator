import { AppError } from "../errors.ts";
import { trimmed } from "../validation.ts";
import { aiObject } from "./parse.ts";

export interface BlockTextInput {
  textType: string;
  context?: string;
  tone: string;
  blockType: string;
  currentText?: string;
  language: string;
}

export function blockPrompts(input: BlockTextInput): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: `You write concise marketing-email copy in ${input.language}. Return only JSON as {"text":"..."}.
Do not output HTML, Markdown, fabricated facts, unsupported discounts, or fake urgency.`,
    userPrompt: `Text type: ${input.textType}
Editor block: ${input.blockType}
Tone: ${input.tone}
Context: ${input.context ?? "not provided"}
Current text to improve: ${input.currentText ?? "not provided"}`,
  };
}

export function parseBlockText(value: unknown): { text: string } {
  const object = aiObject(value);
  const text = trimmed(object.text, 3000);
  if (!text) throw new AppError("AI_INVALID_RESPONSE", 502, "AI response is missing generated text");
  return { text: text.replace(/<[^>]+>/g, "") };
}
