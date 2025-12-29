import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Sparkles, 
  Paintbrush, 
  GitBranch, 
  ArrowRight,
  Mail,
  Zap,
  Target,
  TrendingUp,
  Clock,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";

export default function Dashboard() {
  const { user, loading, checkSubscription, subscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { campaigns } = useCampaigns();
  const { templates } = useEmailTemplates();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Pagamento realizado com sucesso! Seus créditos foram atualizados.");
      checkSubscription();
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams, checkSubscription]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tools = [
    {
      id: "ai-generator",
      title: "Gerador com IA",
      description: "Crie emails profissionais automaticamente usando inteligência artificial avançada",
      icon: Sparkles,
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-500/10",
      iconColor: "text-violet-500",
      features: ["Análise de site automática", "Múltiplas variações", "Otimizado para conversão"],
      badge: "Popular",
      route: "/email-ai"
    },
    {
      id: "visual-builder",
      title: "Editor Visual",
      description: "Monte emails arrastando e soltando blocos com preview em tempo real",
      icon: Paintbrush,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
      features: ["Drag & drop", "Blocos customizáveis", "Preview responsivo"],
      badge: "Novo",
      route: "/email-builder"
    },
    {
      id: "funnel-builder",
      title: "Fluxo de Funil",
      description: "Crie sequências automatizadas de emails para nutrir seus leads",
      icon: GitBranch,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      features: ["Automação de sequências", "Triggers personalizados", "Visualização de fluxo"],
      badge: null,
      route: "/funnel"
    },
  ];

  const stats = [
    {
      label: "Emails Gerados",
      value: campaigns?.length || 0,
      icon: Mail,
      color: "text-primary",
      clickable: true,
      route: "/history"
    },
    {
      label: "Templates Salvos",
      value: templates?.length || 0,
      icon: FileText,
      color: "text-blue-500",
      clickable: true,
      route: "/email-builder"
    },
    {
      label: "Plano Atual",
      value: subscription?.plan?.charAt(0).toUpperCase() + subscription?.plan?.slice(1) || "Free",
      icon: Zap,
      color: "text-amber-500",
      clickable: false
    }
  ];

  const quickActions = [
    { label: "Gerar Email Rápido", icon: Sparkles, route: "/email-ai" },
    { label: "Novo Template", icon: Paintbrush, route: "/email-builder" },
    { label: "Ver Histórico", icon: Clock, route: "/history" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo ao Emailnator
          </h1>
          <p className="text-muted-foreground">
            Escolha uma ferramenta para começar a criar emails incríveis
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className={`border-border/50 transition-all ${
                stat.clickable
                  ? "cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 group"
                  : ""
              }`}
              onClick={() => stat.clickable && stat.route && navigate(stat.route)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`p-3 rounded-xl bg-muted/50 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                {stat.clickable && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tools Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Ferramentas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Card 
                key={tool.id} 
                className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                onClick={() => navigate(tool.route)}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${tool.bgColor}`}>
                      <tool.icon className={`h-6 w-6 ${tool.iconColor}`} />
                    </div>
                    {tool.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-4">{tool.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-2 mb-4">
                    {tool.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${tool.color}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    Acessar
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Ações Rápidas
          </h2>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                onClick={() => navigate(action.route)}
                className="gap-2"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        {campaigns && campaigns.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Atividade Recente
            </h2>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {campaigns.slice(0, 3).map((campaign) => (
                    <div 
                      key={campaign.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/history?campaign=${campaign.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{campaign.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.campaign_type} • {campaign.niche}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(campaign.created_at).toLocaleDateString("pt-BR")}
                        </p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
                {campaigns.length > 3 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4"
                    onClick={() => navigate("/history")}
                  >
                    Ver todo histórico
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
