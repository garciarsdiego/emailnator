import { useEffect, useState } from "react";
import { ArrowLeft, CircleDollarSign, Settings } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { CreditPackCard, PricingCard } from "@/components/v2/PricingCard";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { PLANS } from "@/lib/constants";
import { STRIPE_CREDIT_PACKS, STRIPE_PLANS } from "@/lib/stripe";
import { toast } from "sonner";
import { createCheckout, createCustomerPortal } from "@/features/billing/api/checkoutApi";
import { useIdempotencyKey } from "@/shared/hooks/useIdempotencyKey";

type PaidPlan = keyof typeof STRIPE_PLANS;
type CreditPack = keyof typeof STRIPE_CREDIT_PACKS;

const planFeatures = {
  free: [
    `${PLANS.free.emails} gerações de email por ciclo`,
    `${PLANS.free.analyses} análise de site por ciclo`,
    "Gerador orientado e editor visual",
    "Histórico de campanhas",
  ],
  starter: [
    `${PLANS.starter.emails} gerações de email por mês`,
    `${PLANS.starter.analyses} análises de site por mês`,
    "Gerador orientado e editor visual",
    "Histórico de campanhas",
  ],
  pro: [
    `${PLANS.pro.emails} gerações de email por mês`,
    `${PLANS.pro.analyses} análises de site por mês`,
    "Gerador orientado e editor visual",
    "Histórico de campanhas",
  ],
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível iniciar o checkout.";
}

export default function Pricing() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);
  const [loadingPack, setLoadingPack] = useState<CreditPack | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const checkoutAttempt = useIdempotencyKey();

  useEffect(() => {
    if (searchParams.get("payment") === "canceled") {
      toast.info("Checkout cancelado. Nenhuma cobrança foi realizada.");
    }
  }, [searchParams]);

  const openCheckout = (url: string) => {
    const checkoutWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!checkoutWindow) window.location.assign(url);
  };

  const handleSelectPlan = async (planKey: PaidPlan) => {
    if (!user) {
      navigate("/auth?mode=signup");
      return;
    }

    setLoadingPlan(planKey);
    try {
      const payload = { productKey: planKey };
      const url = await createCheckout(planKey, checkoutAttempt.getKey(payload));
      checkoutAttempt.complete();
      openCheckout(url);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleBuyCredits = async (packKey: CreditPack) => {
    if (!user) {
      navigate("/auth?mode=signup");
      return;
    }

    setLoadingPack(packKey);
    try {
      const payload = { productKey: packKey };
      const url = await createCheckout(packKey, checkoutAttempt.getKey(payload));
      checkoutAttempt.complete();
      openCheckout(url);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingPack(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      openCheckout(await createCustomerPortal());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setPortalLoading(false);
    }
  };

  const currentPlan = user ? profile?.plan ?? "free" : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="container pb-24 pt-12 lg:pt-16">
        <Button variant="link" className="-ml-1 px-0 text-muted-foreground hover:text-foreground" onClick={() => navigate(user ? "/dashboard" : "/")}>
          <ArrowLeft className="h-4 w-4" />
          {user ? "Voltar ao workspace" : "Voltar ao início"}
        </Button>

        <header className="mt-10 grid gap-7 border-b border-foreground/20 pb-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <p className="eyebrow">Planos e créditos</p>
            <h1 className="mt-5 max-w-4xl text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
              Escolha pelo volume que você realmente cria.
            </h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-muted-foreground lg:justify-self-end">
            Todos os planos incluem o gerador orientado, o editor visual e o histórico. O que muda é a quantidade mensal de gerações e análises.
          </p>
        </header>

        <section className="mt-12 grid gap-5 lg:grid-cols-12 lg:items-stretch" aria-label="Planos disponíveis">
          <div className="lg:col-span-3">
            <PricingCard
              name="Gratuito"
              description="Para conhecer o fluxo e criar as primeiras campanhas."
              price={PLANS.free.price}
              features={planFeatures.free}
              actionLabel={currentPlan === "free" ? "Plano atual" : "Começar grátis"}
              onAction={() => navigate(user ? "/dashboard" : "/auth?mode=signup")}
              current={currentPlan === "free"}
              disabled={currentPlan === "free"}
            />
          </div>

          <div className="lg:col-span-4 lg:translate-y-7">
            <PricingCard
              name="Starter"
              description="Para uma rotina de campanhas enxuta e frequente."
              price={PLANS.starter.price}
              features={planFeatures.starter}
              actionLabel={currentPlan === "starter" ? "Plano atual" : "Testar por 7 dias"}
              onAction={() => void handleSelectPlan("starter")}
              current={currentPlan === "starter"}
              loading={loadingPlan === "starter"}
              disabled={currentPlan === "starter"}
              note="7 dias de teste antes da primeira cobrança"
            />
          </div>

          <div className="lg:col-span-5">
            <PricingCard
              name="Pro"
              description="Para quem produz mais campanhas e usa referências de site com frequência."
              price={PLANS.pro.price}
              features={planFeatures.pro}
              actionLabel={currentPlan === "pro" ? "Plano atual" : "Testar por 7 dias"}
              onAction={() => void handleSelectPlan("pro")}
              current={currentPlan === "pro"}
              recommended
              loading={loadingPlan === "pro"}
              disabled={currentPlan === "pro"}
              note="7 dias de teste antes da primeira cobrança"
            />
          </div>
        </section>

        {currentPlan && currentPlan !== "free" && (
          <div className="mt-12 flex justify-center">
            <Button variant="outline" onClick={() => void handleManageSubscription()} disabled={portalLoading}>
              <Settings className="mr-2 h-4 w-4" />
              {portalLoading ? "Abrindo portal..." : "Gerenciar assinatura"}
            </Button>
          </div>
        )}

        <section className="mt-24 border-y border-foreground/20 py-9 lg:mt-32" aria-labelledby="credit-packs-title">
          <div className="grid gap-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-primary">
                <CircleDollarSign className="h-4 w-4" />
              </span>
              <h2 id="credit-packs-title" className="mt-5 text-3xl">Precisa de fôlego extra?</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                Adicione gerações de email sem trocar o seu plano.
              </p>
            </div>

            <div className="md:grid md:grid-cols-3">
              <CreditPackCard
                emails={STRIPE_CREDIT_PACKS.pack10.emails}
                price={STRIPE_CREDIT_PACKS.pack10.price}
                loading={loadingPack === "pack10"}
                onBuy={() => void handleBuyCredits("pack10")}
              />
              <CreditPackCard
                emails={STRIPE_CREDIT_PACKS.pack50.emails}
                price={STRIPE_CREDIT_PACKS.pack50.price}
                annotation="R$ 1,58 cada"
                loading={loadingPack === "pack50"}
                onBuy={() => void handleBuyCredits("pack50")}
              />
              <CreditPackCard
                emails={STRIPE_CREDIT_PACKS.pack150.emails}
                price={STRIPE_CREDIT_PACKS.pack150.price}
                annotation="R$ 1,33 cada"
                loading={loadingPack === "pack150"}
                onBuy={() => void handleBuyCredits("pack150")}
              />
            </div>
          </div>
        </section>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs leading-5 text-muted-foreground">
          O Emailnator cria, organiza e exporta o conteúdo das campanhas. O disparo é realizado na plataforma de email escolhida por você.
        </p>
      </main>
    </div>
  );
}
