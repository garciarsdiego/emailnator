import { ArrowRight, Check, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/v2/Brand";
import { BriefingMockup, EditorMockup, FunnelMockup } from "@/components/v3/EditorMockup";
import { FeatureBento } from "@/components/v3/FeatureBento";
import { LandingMotion, SectionShell } from "@/components/v3/LandingMotion";
import { useAuth } from "@/contexts/AuthContext";

const honestPromises = [
  "Sem envio nativo obrigatorio",
  "HTML pronto para usar",
  "Emails e funis em um só lugar",
];

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const workspaceRoute = user ? "/dashboard" : "/auth?mode=signup";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="border-b border-foreground/15 bg-background/95 backdrop-blur">
        <nav className="container flex h-20 items-center justify-between" aria-label="Navegação principal">
          <Brand />
          <div className="flex items-center gap-1 sm:gap-3">
            <a className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground md:block" href="#recursos">
              Recursos
            </a>
            <a className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground md:block" href="#fluxo">
              Fluxo
            </a>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/pricing">Planos</Link>
            </Button>
            {user ? (
              <Button size="sm" onClick={() => navigate("/dashboard")}>
                Abrir workspace
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                  Entrar
                </Button>
                <Button size="sm" onClick={() => navigate("/auth?mode=signup")}>
                  Criar conta
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="relative overflow-hidden">
          <div className="absolute right-0 top-0 hidden h-full w-[42%] bg-[hsl(var(--graphite))] lg:block" aria-hidden="true" />
          <div className="container relative grid min-h-[calc(100dvh-5rem)] items-center gap-12 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
            <LandingMotion>
              <p className="v3-kicker">Emailnator Campaign Studio</p>
              <h1 className="mt-8 max-w-5xl v3-display text-[clamp(3.5rem,8vw,7.6rem)] leading-[0.88]">
                Campanhas com contexto, prontas para editar.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Um estúdio com IA para transformar marca, oferta e intenção em emails, funis e HTML pronto para usar.
              </p>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Button size="lg" className="px-6" onClick={() => navigate(workspaceRoute)}>
                  {user ? "Continuar criando" : "Criar campanha"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button asChild variant="link" className="px-0 text-foreground">
                  <a href="#fluxo">Ver como funciona</a>
                </Button>
              </div>
              <p className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Da ideia ao email. Mais contexto, menos retrabalho.
              </p>
            </LandingMotion>

            <LandingMotion delay={0.12} className="relative lg:pl-3">
              <div className="absolute -bottom-8 -right-8 hidden h-44 w-44 rounded-full bg-primary/20 blur-3xl lg:block" aria-hidden="true" />
              <EditorMockup className="relative lg:translate-x-6" />
            </LandingMotion>
          </div>
        </section>

        <SectionShell id="fluxo" className="border-y border-foreground/15 bg-card/40">
          <div className="container grid gap-12 lg:grid-cols-[0.62fr_1.38fr] lg:items-center">
            <div>
              <p className="v3-kicker">Contexto e briefing</p>
              <h2 className="mt-5 max-w-xl v3-display text-5xl leading-[0.95] sm:text-6xl">
                Antes do texto, a direção.
              </h2>
              <p className="mt-6 max-w-sm text-base leading-7 text-muted-foreground">
                Boas campanhas começam com clareza. Oriente a IA com marca, público, oferta, objeções, tom de voz e referência do site.
              </p>
            </div>
            <BriefingMockup />
          </div>
        </SectionShell>

        <SectionShell id="recursos">
          <div className="container">
            <div className="mb-12 max-w-3xl">
              <p className="v3-kicker">Recursos centrais</p>
              <h2 className="mt-5 v3-display text-5xl leading-[0.98] sm:text-6xl">
                Um fluxo para sair do rascunho.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                Do armazenamento da marca a exportação do HTML, cada etapa acontece no mesmo lugar.
              </p>
            </div>
            <FeatureBento />
          </div>
        </SectionShell>

        <SectionShell className="v3-graphite-panel">
          <div className="container">
            <div className="mb-10 max-w-2xl">
              <p className="font-mono text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-primary">Editor visual</p>
              <h2 className="mt-5 v3-display text-5xl leading-[0.98] text-background sm:text-6xl">
                Edite como peça final, não como prompt.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-background/72">
                Revise conteúdo, blocos, preview e HTML sem sair do fluxo de campanha.
              </p>
            </div>
            <EditorMockup />
          </div>
        </SectionShell>

        <SectionShell>
          <div className="container">
            <div className="grid gap-10 lg:grid-cols-[0.58fr_1.42fr] lg:items-start">
              <div>
                <p className="v3-kicker">Funis</p>
                <h2 className="mt-5 v3-display text-5xl leading-[0.98] sm:text-6xl">
                  Transforme uma campanha em sequência.
                </h2>
                <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">
                  Conecte emails com lógica e timing para guiar seu público do primeiro clique até a conversão.
                </p>
              </div>
              <FunnelMockup />
            </div>
          </div>
        </SectionShell>

        <section className="container pb-24 pt-8 lg:pb-32">
          <div className="relative overflow-hidden rounded-lg border border-foreground/15 bg-card px-6 py-14 shadow-[var(--shadow-v3-paper)] sm:px-12 lg:px-16 lg:py-20">
            <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_0.55fr] lg:items-end">
              <div>
                <h2 className="max-w-5xl v3-display text-5xl leading-[0.98] sm:text-7xl">
                  Escreva com direção. Exporte com segurança.
                </h2>
                <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                  <Button size="lg" onClick={() => navigate(workspaceRoute)}>
                    {user ? "Abrir workspace" : "Criar conta"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/pricing">
                      Ver planos
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <ul className="space-y-4">
                {honestPromises.map((promise) => (
                  <li key={promise} className="flex items-center gap-3 border-b border-foreground/10 pb-4 text-sm font-medium">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-primary">
                      <Check className="h-4 w-4" />
                    </span>
                    {promise}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-foreground/15">
        <div className="container flex flex-col gap-6 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Brand compact />
            <p className="mt-4 max-w-sm text-xs leading-5 text-muted-foreground">
              Criação, edição e exportação de campanhas de email. O disparo é feito na plataforma escolhida por você.
            </p>
          </div>
          <div className="flex items-center gap-5 text-xs font-medium text-muted-foreground">
            <Link className="hover:text-foreground" to="/pricing">Planos</Link>
            <Link className="hover:text-foreground" to="/auth">Entrar</Link>
            <span className="font-mono">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
