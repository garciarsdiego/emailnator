import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import type { EmailBlock } from "@/types/emailBuilder";

const blockTypes = new Set<EmailBlock["type"]>([
  "header", "text", "image", "button", "divider", "spacer",
  "social", "footer", "video", "countdown", "product",
]);

export type EmailDocument = Tables<"email_documents">;

export interface SaveEmailDocumentInput {
  userId: string;
  name: string;
  subject: string;
  preheader: string;
  blocks: EmailBlock[];
  renderedHtml: string;
}

type UpdateEmailDocumentInput = Omit<SaveEmailDocumentInput, "userId">;

export async function saveEmailDocument(input: SaveEmailDocumentInput): Promise<EmailDocument> {
  const name = input.name.trim().slice(0, 160) || "Email sem título";
  const { data, error } = await supabase
    .from("email_documents")
    .insert({
      user_id: input.userId,
      name,
      subject: input.subject.trim().slice(0, 300),
      preheader: input.preheader.trim().slice(0, 500),
      blocks: input.blocks as unknown as Json,
      rendered_html: input.renderedHtml,
      schema_version: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listEmailDocuments(): Promise<EmailDocument[]> {
  const { data, error } = await supabase
    .from("email_documents")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getEmailDocument(documentId: string): Promise<EmailDocument> {
  const { data, error } = await supabase
    .from("email_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateEmailDocument(
  documentId: string,
  input: UpdateEmailDocumentInput,
): Promise<EmailDocument> {
  const { data, error } = await supabase
    .from("email_documents")
    .update({
      name: input.name.trim().slice(0, 160) || "Email sem título",
      subject: input.subject.trim().slice(0, 300),
      preheader: input.preheader.trim().slice(0, 500),
      blocks: input.blocks as unknown as Json,
      rendered_html: input.renderedHtml,
    })
    .eq("id", documentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEmailDocument(documentId: string): Promise<void> {
  const { error } = await supabase.from("email_documents").delete().eq("id", documentId);
  if (error) throw error;
}

export function deserializeEmailBlocks(value: Json): EmailBlock[] {
  if (!Array.isArray(value)) throw new Error("O documento salvo possui um formato inválido.");

  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("O documento salvo possui um bloco inválido.");
    }
    const block = item as Record<string, Json | undefined>;
    if (
      typeof block.id !== "string"
      || typeof block.type !== "string"
      || !blockTypes.has(block.type as EmailBlock["type"])
      || !block.content
      || typeof block.content !== "object"
      || Array.isArray(block.content)
    ) {
      throw new Error("O documento salvo possui um bloco incompleto.");
    }
    return {
      id: block.id,
      type: block.type as EmailBlock["type"],
      content: block.content as EmailBlock["content"],
      position: typeof block.position === "number" ? block.position : index,
    };
  });
}
