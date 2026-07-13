import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { VisualEmailBuilder } from "@/components/email-builder";
import { toast } from "sonner";
import type { EmailBlock } from "@/types/emailBuilder";
import {
  deserializeEmailBlocks,
  saveEmailDocument,
  updateEmailDocument,
} from "@/features/email-editor/api/emailDocumentsApi";
import { useEmailDocument } from "@/features/email-editor/hooks/useEmailDocuments";
import { Loader2 } from "lucide-react";

export default function EmailBuilderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get("document");
  const documentQuery = useEmailDocument(documentId);

  if (!user) return null;

  const handleSave = async (
    blocks: EmailBlock[],
    html: string,
    metadata?: { subject: string; preheader: string },
  ) => {
    const input = {
      name: metadata?.subject || documentQuery.data?.name || "Novo email",
      subject: metadata?.subject || "",
      preheader: metadata?.preheader || "",
      blocks,
      renderedHtml: html,
    };
    if (documentId) await updateEmailDocument(documentId, input);
    else await saveEmailDocument({ ...input, userId: user.id });
    toast.success("Email salvo com sucesso!");
    navigate("/history");
  };

  if (documentId && documentQuery.isLoading) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  if (documentId && (documentQuery.isError || !documentQuery.data)) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div><h1 className="text-2xl">Documento não encontrado</h1><button className="mt-4 underline" onClick={() => navigate("/history")}>Voltar ao histórico</button></div>
      </div>
    );
  }

  const initialBlocks = documentQuery.data
    ? deserializeEmailBlocks(documentQuery.data.blocks)
    : undefined;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <main id="main-content" className="flex-1 overflow-hidden">
        <VisualEmailBuilder
          key={documentId || "new-document"}
          initialBlocks={initialBlocks}
          initialContent={documentQuery.data ? {
            subject: documentQuery.data.subject,
            preheader: documentQuery.data.preheader,
          } : undefined}
          showMetadataFields
          onSave={handleSave}
          onCancel={() => navigate(documentId ? "/history" : "/dashboard")}
        />
      </main>
    </div>
  );
}
