import { Calendar, FilePenLine, Mail, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { EmailDocument } from "@/features/email-editor/api/emailDocumentsApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DocumentHistorySectionProps {
  documents: EmailDocument[];
  onEdit: (documentId: string) => void;
  onDelete: (documentId: string) => void;
}

export function DocumentHistorySection({ documents, onEdit, onDelete }: DocumentHistorySectionProps) {
  return (
    <section className="mt-12" aria-labelledby="documents-title">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-foreground/20 pb-4">
        <div>
          <p className="eyebrow">Editáveis</p>
          <h2 id="documents-title" className="mt-2 text-3xl">Documentos salvos</h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{documents.length.toString().padStart(2, "0")}</span>
      </div>

      {documents.length === 0 ? (
        <Card className="border-dashed bg-transparent py-10 text-center">
          <CardContent><Mail className="mx-auto mb-3 h-9 w-9 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum documento editável salvo.</p></CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {documents.map((document) => (
            <Card key={document.id} className="bg-card/70">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg">{document.name}</CardTitle>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{document.subject || "Sem assunto"}</p>
                  </div>
                  <span className="shrink-0 rounded-full border px-2 py-1 font-mono text-[10px]">v{document.schema_version}</span>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(document.updated_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                </p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(document.id)}><FilePenLine className="mr-2 h-4 w-4" />Editar</Button>
                  <Button variant="ghost" size="icon" aria-label={`Excluir ${document.name}`} onClick={() => onDelete(document.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
