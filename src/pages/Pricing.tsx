import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { PLANS } from "@/lib/constants";
import { STRIPE_PLANS, STRIPE_CREDIT_PACKS } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Pricing() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "canceled") {
      toast.error("Pagamento cancelado");
    }
  }, [searchParams]);

  const handleSelectPlan = async (planKey: "starter" | "pro") => {
    if (!user) {
      navigate("/auth?mode=signup");
      return;
    }

    setLoadingPlan(planKey);
    try {
      const plan = STRIPE_PLANS[planKey];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: plan.priceId, mode: "subscription" },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Erro ao iniciar checkout: " + error.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleBuyCredits = async (packKey: "pack10" | "pack50" | "pack150") => {
    if (!user) {
      navigate("/auth?mode=signup");
      return;
    }

    setLoadingPack(packKey);
    try {
      const pack = STRIPE_CREDIT_PACKS[packKey];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: pack.priceId, mode: "payment" },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Erro ao iniciar checkout: " + error.message);
    } finally {
      setLoadingPack(null);
    }
  };

  const currentPlan = profile?.plan || "free";

  const getPlanButtonContent = (planKey: string, label: string) => {
    if (loadingPlan === planKey) {
      return <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>;
    }
    if (currentPlan === planKey) {
      return "Plano Atual";
    }
    return label;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Planos e Preços</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Cancele quando quiser.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Free */}
          <Card className={`glass-card relative ${currentPlan === "free" ? "border-primary" : ""}`}>
            {currentPlan === "free" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Seu Plano</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Para experimentar</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">R$0</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <PlanFeature>{PLANS.free.emails} emails/mês</PlanFeature>
                <PlanFeature>{PLANS.free.analyses} análise de site</PlanFeature>
                <PlanFeature>{PLANS.free.users} usuário</PlanFeature>
                <PlanFeature>Histórico de {PLANS.free.history}</PlanFeature>
                <PlanFeature>Créditos expiram no ciclo</PlanFeature>
              </ul>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={currentPlan === "free"}
                onClick={() => navigate("/dashboard")}
              >
                {currentPlan === "free" ? "Plano Atual" : "Continuar Grátis"}
              </Button>
            </CardContent>
          </Card>

          {/* Starter */}
          <Card className={`glass-card relative ${currentPlan === "starter" ? "border-primary" : ""}`}>
            {currentPlan === "starter" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Seu Plano</Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Starter</CardTitle>
                <Badge variant="secondary">7 dias grátis</Badge>
              </div>
              <CardDescription>Para pequenos negócios</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">R${PLANS.starter.price}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <PlanFeature>{PLANS.starter.emails} emails/mês</PlanFeature>
                <PlanFeature>{PLANS.starter.analyses} análises de site</PlanFeature>
                <PlanFeature>{PLANS.starter.users} usuários</PlanFeature>
                <PlanFeature>Histórico de {PLANS.starter.history}</PlanFeature>
                <PlanFeature>Créditos expiram no ciclo</PlanFeature>
              </ul>
              <Button 
                className="w-full"
                onClick={() => handleSelectPlan("starter")}
                disabled={loadingPlan === "starter" || currentPlan === "starter"}
              >
                {getPlanButtonContent("starter", "Começar Trial")}
              </Button>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className={`glass-card relative ${currentPlan === "pro" ? "border-primary shadow-lg" : "border-primary/50 shadow-lg"}`}>
            {currentPlan === "pro" ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Seu Plano</Badge>
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Mais Popular
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pro</CardTitle>
                <Badge variant="secondary">7 dias grátis</Badge>
              </div>
              <CardDescription>Para negócios em crescimento</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">R${PLANS.pro.price}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <PlanFeature>{PLANS.pro.emails} emails/mês</PlanFeature>
                <PlanFeature>{PLANS.pro.analyses} análises de site</PlanFeature>
                <PlanFeature>{PLANS.pro.users} usuários</PlanFeature>
                <PlanFeature>Histórico {PLANS.pro.history}</PlanFeature>
                <PlanFeature>Créditos válidos por 12 meses</PlanFeature>
                <PlanFeature>Fluxo de Funil de Emails</PlanFeature>
              </ul>
              <Button 
                className="w-full"
                onClick={() => handleSelectPlan("pro")}
                disabled={loadingPlan === "pro" || currentPlan === "pro"}
              >
                {getPlanButtonContent("pro", "Começar Trial")}
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card className={`glass-card relative ${currentPlan === "enterprise" ? "border-primary" : ""}`}>
            {currentPlan === "enterprise" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Seu Plano</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>Para grandes operações</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">Sob consulta</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <PlanFeature>Emails ilimitados</PlanFeature>
                <PlanFeature>Análises ilimitadas</PlanFeature>
                <PlanFeature>Usuários ilimitados</PlanFeature>
                <PlanFeature>Histórico ilimitado</PlanFeature>
                <PlanFeature>Créditos nunca expiram</PlanFeature>
                <PlanFeature>Suporte prioritário</PlanFeature>
                <PlanFeature>Fluxo de Funil de Emails</PlanFeature>
              </ul>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => window.open("mailto:contato@emailnator.com", "_blank")}
              >
                Falar com Vendas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Credit Packages */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Pacotes de Créditos Avulsos</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">10 Emails</CardTitle>
                <div className="text-2xl font-bold">R$19</div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleBuyCredits("pack10")}
                  disabled={loadingPack === "pack10"}
                >
                  {loadingPack === "pack10" ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
                  ) : (
                    "Comprar"
                  )}
                </Button>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">50 Emails</CardTitle>
                <div className="text-2xl font-bold">R$79</div>
                <Badge variant="secondary" className="mt-2">Economia de 17%</Badge>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleBuyCredits("pack50")}
                  disabled={loadingPack === "pack50"}
                >
                  {loadingPack === "pack50" ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
                  ) : (
                    "Comprar"
                  )}
                </Button>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">150 Emails</CardTitle>
                <div className="text-2xl font-bold">R$199</div>
                <Badge variant="secondary" className="mt-2">Economia de 30%</Badge>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleBuyCredits("pack150")}
                  disabled={loadingPack === "pack150"}
                >
                  {loadingPack === "pack150" ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
                  ) : (
                    "Comprar"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <Check className="h-4 w-4 text-primary shrink-0" />
      <span>{children}</span>
    </li>
  );
}
