import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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

export default function History() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { campaigns, isLoading, deleteCampaign } = useCampaigns();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCampaign.mutateAsync(id);
      toast.success("Campanha excluída");
    } catch (error) {
      toast.error("Erro ao excluir campanha");
    }
  };

  const getNicheLabel = (value: string) => 
    NICHES.find(n => n.value === value)?.label || value;

  const getCampaignTypeLabel = (value: string) => 
    CAMPAIGN_TYPES.find(t => t.value === value)?.label || value;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Histórico</h1>
            <p className="text-muted-foreground mt-1">
              Veja todas as campanhas de email que você criou
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard")}>
            <Mail className="h-4 w-4 mr-2" />
            Novo Email
          </Button>
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
                  {campaign.site_url && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="h-4 w-4" />
                      <a 
                        href={campaign.site_url} 
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
                    dangerouslySetInnerHTML={{ __html: campaign.content.substring(0, 300) + "..." }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
