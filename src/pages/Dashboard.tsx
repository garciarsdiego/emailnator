import { useEffect } from "react";
import { ArrowRight, FileClock, LayoutTemplate, Mail, PanelsTopLeft, WandSparkles } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton, EmptyState, InlineNotice } from "@/components/v2/PageStates";
import { ProductToolCard } from "@/components/v2/ProductToolCard";
import { useAuth } from "@/contexts/AuthContext";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { useProfile } from "@/hooks/useProfile";
import { CAMPAIGN_TYPES } from "@/lib/constants";
import { toast } from "sonner";

const planLabels = {
  free: "Gratuito",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
} as const;

const campaignTypeLabels = Object.fromEntries(
  CAMPAIGN_TYPES.map((campaignType) => [campaignType.value, campaignType.label]),
);

export default function Dashboard() {
  const { user, loading, checkSubscription, subscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { campaigns, isLoading: campaignsLoading, error: campaignsError } = useCampaigns();
  const { templates, isLoading: templatesLoading } = useEmailTemplates();
  const { profile, isLoading: profileLoading } = useProfile();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (searchParams.get("payment") !== "success") return;

    toast.success("Pagamento confirmado. Estamos sincronizando seu acesso.");
    void checkSubscription();
    navigate("/dashboard", { replace: true });
  }, [searchParams, checkSubscription, navigate]);

  if (loading) return <DashboardSkeleton />;
  if (!user) return null;

  const firstName = profile?.full_name?.trim().split(" ")[0];
  const currentPlan = profile?.plan ?? subscription.plan;
  const recentCampaigns = campaigns.slice(0, 4);

  const metrics = [
    {
      label: "Campanhas salvas",
      value: campaignsLoading ? "—" : campaigns.length.toLocaleString("pt-BR"),
      icon: Mail,
    },
    {
      label: "Templates salvos",
      value: templatesLoading ? "—" : templates.length.toLocaleString("pt-BR"),
      icon: LayoutTemplate,
    },
    {
      label: "Plano atual",
      value: profileLoading ? "—" : planLabels[currentPlan],
      icon: FileClock,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" tabIndex={-1} className="container pb-20 pt-10 lg:pt-14">
        <section className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Área de trabalho</p>
            <h1 className="mt-4 max-w-3xl text-4xl leading-[1.02] sm:text-5xl lg:text-6xl">
              {firstName ? `${firstName}, qual mensagem vamos construir hoje?` : "Qual mensagem vamos construir hoje?"}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Comece pela geração orientada ou abra o editor para montar uma campanha por blocos.
            </p>
          </div>
          <Button size="lg" onClick={() => navigate("/email-ai")}>
            Nova campanha
            <ArrowRight className="h-4 w-4" />
          </Button>
        </section>

        <section className="mt-12 grid border-y border-foreground/20 py-6 sm:grid-cols-3" aria-label="Resumo do workspace">
          {metrics.map(({ label, value, icon: Icon }, index) => (
            <div
              key={label}
              className="flex items-center gap-4 py-4 sm:border-r sm:px-6 sm:py-1 sm:first:pl-0 sm:last:border-r-0"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-primary">
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-lg font-semibold font-tabular" aria-live={index < 2 ? "polite" : undefined}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </section>

        {campaignsError && (
          <div className="mt-8">
            <InlineNotice
              title="Não foi possível carregar as campanhas"
              description="O restante do workspace continua disponível. Atualize a página para tentar novamente."
            />
          </div>
        )}

        <section className="mt-14" aria-labelledby="creation-tools-title">
          <div className="mb-7 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Ferramentas</p>
              <h2 id="creation-tools-title" className="mt-3 text-3xl">Escolha seu ponto de partida</h2>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <ProductToolCard
              index="01 / gerar"
              title="Gerador orientado"
              description="Combine contexto do site, objetivo, nicho e tom para criar um rascunho completo de campanha."
              detail="Assunto · pré-header · conteúdo · CTA"
              icon={WandSparkles}
              onOpen={() => navigate("/email-ai")}
            />
            <ProductToolCard
              index="02 / editar"
              title="Editor visual"
              description="Monte a campanha em blocos, revise a composição em diferentes larguras e exporte o HTML."
              detail="Blocos · preview responsivo · exportação"
              icon={PanelsTopLeft}
              onOpen={() => navigate("/email-builder")}
            />
          </div>
        </section>

        <section className="mt-16" aria-labelledby="recent-campaigns-title">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-foreground/20 pb-5">
            <div>
              <p className="eyebrow">Continuidade</p>
              <h2 id="recent-campaigns-title" className="mt-3 text-3xl">Campanhas recentes</h2>
            </div>
            {campaigns.length > 0 && (
              <Button asChild variant="link" className="px-0 text-foreground">
                <Link to="/history">
                  Ver histórico completo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          {campaignsLoading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Carregando campanhas">
              {[0, 1, 2].map((item) => (
                <div key={item} className="grid gap-3 border-b border-border py-5 sm:grid-cols-[1fr_12rem_7rem]">
                  <div className="h-5 w-2/3 animate-pulse bg-muted" />
                  <div className="h-4 w-28 animate-pulse bg-muted" />
                  <div className="h-4 w-20 animate-pulse bg-muted" />
                </div>
              ))}
            </div>
          ) : recentCampaigns.length === 0 ? (
            <EmptyState
              title="Sua primeira campanha começa aqui"
              description="Defina o objetivo e o tom; o gerador organiza o primeiro rascunho para você revisar."
              actionLabel="Gerar campanha"
              onAction={() => navigate("/email-ai")}
              icon={<WandSparkles className="h-5 w-5" />}
            />
          ) : (
            <div className="border-t border-foreground/20">
              {recentCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  to={`/history?campaign=${campaign.id}`}
                  className="group grid gap-3 border-b border-foreground/15 px-2 py-5 hover:bg-card/80 sm:grid-cols-[1fr_12rem_7rem] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{campaign.subject || "Campanha sem assunto"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{campaign.niche}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {campaignTypeLabels[campaign.campaign_type] ?? campaign.campaign_type.replace(/_/g, " ")}
                  </p>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <time className="font-mono text-[0.65rem] text-muted-foreground" dateTime={campaign.created_at}>
                      {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(campaign.created_at))}
                    </time>
                    <ArrowRight className="h-4 w-4 text-primary transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
