import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PLANS } from "@/lib/constants";

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = (plan: string) => {
    if (!user) {
      navigate("/auth?mode=signup");
      return;
    }
    // Future: Stripe integration
    navigate("/dashboard");
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
          <Card className="glass-card relative">
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
                onClick={() => handleSelectPlan("free")}
              >
                {user ? "Plano Atual" : "Começar Grátis"}
              </Button>
            </CardContent>
          </Card>

          {/* Starter */}
          <Card className="glass-card relative">
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
              >
                Começar Trial
              </Button>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="glass-card relative border-primary shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                <Sparkles className="h-3 w-3 mr-1" />
                Mais Popular
              </Badge>
            </div>
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
              </ul>
              <Button 
                className="w-full"
                onClick={() => handleSelectPlan("pro")}
              >
                Começar Trial
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card className="glass-card relative">
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
                <Button variant="outline" className="w-full">Comprar</Button>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">50 Emails</CardTitle>
                <div className="text-2xl font-bold">R$79</div>
                <Badge variant="secondary" className="mt-2">Economia de 17%</Badge>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Comprar</Button>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">150 Emails</CardTitle>
                <div className="text-2xl font-bold">R$199</div>
                <Badge variant="secondary" className="mt-2">Economia de 30%</Badge>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Comprar</Button>
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
