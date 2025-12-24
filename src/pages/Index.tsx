import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Mail, Sparkles, BarChart3, Zap, Shield, Users } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-20 -left-40 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <nav className="container flex items-center justify-between py-6 relative">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
              E
            </div>
            <span className="text-2xl font-bold">Emailnator</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate("/dashboard")}>
                Ir para Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Entrar
                </Button>
                <Button onClick={() => navigate("/auth?mode=signup")}>
                  Começar Grátis
                </Button>
              </>
            )}
          </div>
        </nav>

        <div className="container py-20 lg:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Powered by AI</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Emails que{" "}
              <span className="gradient-text">convertem</span>
              {" "}para seu e-commerce
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Crie campanhas de email marketing profissionais em segundos. 
              IA treinada para o mercado brasileiro que entende seu negócio.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="text-lg px-8"
                onClick={() => navigate(user ? "/dashboard" : "/auth?mode=signup")}
              >
                Começar Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8"
                onClick={() => navigate("/pricing")}
              >
                Ver Planos
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              ✓ 5 emails grátis &nbsp; ✓ 1 análise de site &nbsp; ✓ Sem cartão de crédito
            </p>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="container py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Tudo que você precisa</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ferramentas poderosas para criar campanhas de email que geram resultados
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="Geração com IA"
            description="Emails personalizados criados por inteligência artificial treinada especificamente para e-commerce brasileiro"
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="Análise de Site"
            description="Nossa IA analisa seu site e extrai informações para criar emails ultra-personalizados"
          />
          <FeatureCard
            icon={<Mail className="h-6 w-6" />}
            title="14 Tipos de Campanha"
            description="De boas-vindas a recuperação de carrinho, temos templates para todas as situações"
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Resultado Instantâneo"
            description="Gere emails prontos para usar em segundos, com assunto, preview e HTML otimizado"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Múltiplos Nichos"
            description="Suporte especializado para moda, eletrônicos, beleza, pets e mais 10 segmentos"
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Times"
            description="Colabore com sua equipe, compartilhe campanhas e gerencie créditos"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="rounded-3xl bg-primary/5 border border-primary/20 p-8 lg:p-16 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Pronto para turbinar seu email marketing?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Comece grátis hoje e veja como a IA pode transformar suas campanhas de email
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8"
            onClick={() => navigate(user ? "/dashboard" : "/auth?mode=signup")}
          >
            Criar conta grátis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              E
            </div>
            <span className="font-semibold">Emailnator</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Emailnator. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
      <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
