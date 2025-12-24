import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import { Loader2, FileText, Trash2, Eye, History, Star, ChevronDown, ChevronUp, Paintbrush } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { replaceVariablesWithDummy } from "@/lib/emailVariables";

interface TemplatesPanelProps {
  onUseTemplate?: (template: EmailTemplate) => void;
  onUseCampaign?: (campaign: Campaign) => void;
  onEditVisual?: (content: { subject: string; preheader?: string; content: string; cta?: string; brandName?: string }) => void;
}

export function TemplatesPanel({ onUseTemplate, onUseCampaign, onEditVisual }: TemplatesPanelProps) {
  const { templates, isLoading: templatesLoading, deleteTemplate } = useEmailTemplates();
  const { campaigns, isLoading: campaignsLoading } = useCampaigns();
  const [showTemplates, setShowTemplates] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [previewItem, setPreviewItem] = useState<EmailTemplate | Campaign | null>(null);
  const [previewType, setPreviewType] = useState<"template" | "campaign">("template");

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success("Template excluído!");
    } catch (error) {
      toast.error("Erro ao excluir template");
    }
  };

  const handlePreview = (item: EmailTemplate | Campaign, type: "template" | "campaign") => {
    setPreviewItem(item);
    setPreviewType(type);
  };

  // Get preview content with dummy values for variables
  const getPreviewContent = () => {
    if (!previewItem) return null;
    
    const subject = replaceVariablesWithDummy(previewItem.subject);
    const content = replaceVariablesWithDummy(previewItem.content);
    const preheader = 'preheader' in previewItem && previewItem.preheader 
      ? replaceVariablesWithDummy(previewItem.preheader) 
      : null;
    const cta = 'cta' in previewItem && previewItem.cta 
      ? replaceVariablesWithDummy(previewItem.cta) 
      : null;
    
    return { subject, content, preheader, cta };
  };

  return (
    <div className="space-y-3">
      {/* Templates Section */}
      <Card className="glass-card">
        <CardHeader 
          className="pb-2 pt-3 px-4 cursor-pointer"
          onClick={() => setShowTemplates(!showTemplates)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Templates Favoritos
              <span className="text-xs text-muted-foreground font-normal">
                ({templates.length})
              </span>
            </CardTitle>
            {showTemplates ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {showTemplates && (
          <CardContent className="px-4 pb-4">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                Nenhum template salvo ainda. Salve emails como templates para reutilizar.
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-medium truncate">{template.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{template.subject}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handlePreview(template, "template")}
                        title="Visualizar"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {onEditVisual && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-primary hover:text-primary"
                          onClick={() => onEditVisual({
                            subject: template.subject,
                            preheader: template.preheader || undefined,
                            content: template.content,
                            cta: template.cta || undefined,
                          })}
                          title="Editar no Visual Builder"
                        >
                          <Paintbrush className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onUseTemplate?.(template)}
                        title="Usar template"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* History Section */}
      <Card className="glass-card">
        <CardHeader 
          className="pb-2 pt-3 px-4 cursor-pointer"
          onClick={() => setShowHistory(!showHistory)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Emails Gerados
              <span className="text-xs text-muted-foreground font-normal">
                ({campaigns?.length || 0})
              </span>
            </CardTitle>
            {showHistory ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent className="px-4 pb-4">
            {campaignsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !campaigns || campaigns.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                Nenhum email gerado ainda.
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {campaigns.slice(0, 10).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-medium truncate">{campaign.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(campaign.created_at), "dd MMM yyyy", { locale: ptBR })} • {campaign.campaign_type}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handlePreview(campaign, "campaign")}
                        title="Visualizar"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {onEditVisual && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-primary hover:text-primary"
                          onClick={() => onEditVisual({
                            subject: campaign.subject,
                            content: campaign.content,
                          })}
                          title="Editar no Visual Builder"
                        >
                          <Paintbrush className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onUseCampaign?.(campaign)}
                        title="Reutilizar"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Preview Modal */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {previewType === "template" && previewItem && 'name' in previewItem 
                ? previewItem.name 
                : getPreviewContent()?.subject}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            {previewItem && (() => {
              const preview = getPreviewContent();
              if (!preview) return null;
              
              return (
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Assunto (com valores de exemplo)</p>
                    <p className="text-sm font-medium">{preview.subject}</p>
                  </div>
                  {preview.preheader && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Pré-header</p>
                      <p className="text-sm">{preview.preheader}</p>
                    </div>
                  )}
                  <div className="p-4 border rounded-lg bg-background">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: preview.content }}
                    />
                  </div>
                  {preview.cta && (
                    <div className="text-center">
                      <span className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium">
                        {preview.cta}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
