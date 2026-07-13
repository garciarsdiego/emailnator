import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Trash2, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { NICHES, CAMPAIGN_TYPES } from "@/lib/constants";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { useEmailDocuments } from "@/features/email-editor/hooks/useEmailDocuments";
import { DocumentHistorySection } from "@/features/email-editor/ui/DocumentHistorySection";
import { safeExternalHttpUrl } from "@/shared/security/urls";

export default function History() {
  const navigate = useNavigate();
  const { campaigns, isLoading, deleteCampaign } = useCampaigns();
  const { documents, isLoading: documentsLoading, remove: removeDocument } = useEmailDocuments();

  const handleDelete = async (id: string) => {
    try {
      await deleteCampaign.mutateAsync(id);
      toast.success("Campanha excluída");
    } catch (error) {
      toast.error("Erro ao excluir campanha");
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await removeDocument.mutateAsync(id);
      toast.success("Documento excluído");
    } catch {
      toast.error("Erro ao excluir documento");
    }
  };

  const getNicheLabel = (value: string) => 
    NICHES.find(n => n.value === value)?.label || value;

  const getCampaignTypeLabel = (value: string) => 
    CAMPAIGN_TYPES.find(t => t.value === value)?.label || value;

  if (isLoading || documentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="container pb-24 pt-12">
        <div className="flex items-end justify-between gap-6 border-b border-foreground/20 pb-9">
          <div>
            <p className="eyebrow">Arquivo de trabalho</p>
            <h1 className="mt-4 text-5xl text-foreground sm:text-6xl">Histórico</h1>
            <p className="mt-3 text-muted-foreground">
              Continue documentos editáveis ou consulte gerações anteriores.
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard")}>
            <Mail className="h-4 w-4 mr-2" />
            Novo Email
          </Button>
        </div>

        <DocumentHistorySection
          documents={documents}
          onEdit={(id) => navigate(`/email-builder?document=${encodeURIComponent(id)}`)}
          onDelete={(id) => void handleDeleteDocument(id)}
        />

        <section className="mt-16" aria-labelledby="campaign-history-title">
        <div className="mb-5 border-b border-foreground/20 pb-4">
          <p className="eyebrow">Originais da IA</p>
          <h2 id="campaign-history-title" className="mt-2 text-3xl">Campanhas geradas</h2>
        </div>
        {campaigns.length === 0 ? (
          <Card className="glass-card text-center py-12">
            <CardContent>
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma campanha ainda</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro email de marketing com IA
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Criar primeiro email
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="glass-card">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{campaign.subject}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(campaign.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(campaign.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{getNicheLabel(campaign.niche)}</Badge>
                    <Badge variant="outline">{getCampaignTypeLabel(campaign.campaign_type)}</Badge>
                    {campaign.tone && (
                      <Badge variant="outline" className="text-muted-foreground">
                        {campaign.tone}
                      </Badge>
                    )}
                  </div>
                  {safeExternalHttpUrl(campaign.site_url) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="h-4 w-4" />
                      <a 
                        href={safeExternalHttpUrl(campaign.site_url) ?? undefined}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        {campaign.site_url}
                      </a>
                    </div>
                  )}
                  <div 
                    className="text-sm text-muted-foreground line-clamp-3 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(campaign.content.substring(0, 300) + "...") }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </section>
      </main>
    </div>
  );
}
