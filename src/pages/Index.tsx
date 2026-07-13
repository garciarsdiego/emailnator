import type { LucideIcon } from "lucide-react";
import { ArrowRight, Blocks, FileClock, ScanSearch, SplitSquareVertical } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/v2/Brand";
import { CampaignSpecimen } from "@/components/v2/CampaignSpecimen";
import { useAuth } from "@/contexts/AuthContext";

const workflow = [
  {
    number: "01",
    title: "Traga o contexto",
    description: "Informe o nicho e, se quiser, use seu site como referência para a análise de marca.",
  },
  {
    number: "02",
    title: "Defina a intenção",
    description: "Escolha o objetivo da campanha, o público, o tom e as orientações que não podem ser ignoradas.",
  },
  {
    number: "03",
    title: "Gere o primeiro rascunho",
    description: "Receba opções de assunto, pré-header, CTA e um corpo de email pronto para revisão.",
  },
  {
    number: "04",
    title: "Edite e leve com você",
    description: "Ajuste o conteúdo no editor, confira o preview e exporte o HTML para a sua plataforma de envio.",
  },
];

const capabilities: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: ScanSearch,
    title: "Contexto antes da geração",
    description: "A análise do site ajuda a orientar posicionamento, público e linguagem antes de escrever.",
  },
  {
    icon: SplitSquareVertical,
    title: "Opções para decidir",
    description: "Compare variações de assunto, pré-header e CTA sem perder o fio da campanha.",
  },
  {
    icon: Blocks,
    title: "Edição visual por blocos",
    description: "Organize texto, imagens e chamadas, alterne o preview e exporte o resultado em HTML.",
  },
  {
    icon: FileClock,
    title: "Campanhas organizadas",
    description: "Consulte gerações anteriores e transforme bons rascunhos em ponto de partida para a próxima ação.",
  },
];

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const workspaceRoute = user ? "/dashboard" : "/auth?mode=signup";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/15 bg-background">
        <nav className="container flex h-20 items-center justify-between" aria-label="Navegação principal">
          <Brand />
          <div className="flex items-center gap-1 sm:gap-3">
            <a className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground md:block" href="#workflow">
              Como funciona
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
        <section className="container grid items-center gap-14 pb-24 pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:pb-32 lg:pt-24">
          <div className="max-w-3xl animate-fade-in-up">
            <p className="eyebrow">Campanhas com contexto de marca</p>
            <h1 className="mt-7 text-[clamp(3.3rem,7vw,6.7rem)] leading-[0.9] tracking-[-0.05em]">
              O primeiro rascunho já começa com direção.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Analise uma referência, defina a intenção e gere assunto, pré-header, corpo e CTA em um só fluxo. Depois, refine no editor e exporte o HTML.
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Button size="lg" className="px-6" onClick={() => navigate(workspaceRoute)}>
                {user ? "Continuar criando" : "Criar primeira campanha"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button asChild variant="link" className="px-0 text-foreground">
                <a href="#workflow">Conhecer o fluxo</a>
              </Button>
            </div>
            <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
              Plano gratuito disponível · sem cartão para começar
            </p>
          </div>

          <div className="animate-fade-in [animation-delay:120ms]">
            <CampaignSpecimen />
          </div>
        </section>

        <section id="workflow" className="border-y border-foreground/15 bg-card/55 scroll-mt-24">
          <div className="container grid gap-14 py-24 lg:grid-cols-[0.72fr_1.28fr] lg:py-32">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="eyebrow">Um fluxo, quatro decisões</p>
              <h2 className="mt-5 max-w-md text-4xl leading-[1.02] sm:text-5xl">
                Menos prompt solto. Mais processo de criação.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
                O Emailnator ajuda a estruturar a mensagem. A revisão e o envio continuam sob o seu controle.
              </p>
            </div>

            <ol className="border-t border-foreground/20">
              {workflow.map((step) => (
                <li key={step.number} className="grid gap-4 border-b border-foreground/20 py-8 sm:grid-cols-[4rem_0.7fr_1fr] sm:items-start">
                  <span className="font-mono text-xs font-semibold text-primary">{step.number}</span>
                  <h3 className="text-2xl leading-tight">{step.title}</h3>
                  <p className="max-w-lg text-sm leading-6 text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="container py-24 lg:py-32">
          <div className="grid gap-8 border-b border-foreground/15 pb-10 lg:grid-cols-[1fr_1.1fr] lg:items-end">
            <div>
              <p className="eyebrow">Ferramentas que se conectam</p>
              <h2 className="mt-5 text-4xl leading-none sm:text-5xl">Do contexto ao arquivo final.</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end">
              Cada etapa alimenta a próxima. Você não precisa reconstruir o briefing sempre que muda um assunto ou reorganiza um bloco.
            </p>
          </div>

          <div className="mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2">
            {capabilities.map(({ icon: Icon, title, description }, index) => (
              <article key={title} className={index % 2 === 1 ? "md:translate-y-12" : undefined}>
                <div className="flex items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-primary">
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Recurso {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 text-3xl">{title}</h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container pb-24 pt-8 lg:pb-32 lg:pt-20">
          <div className="relative overflow-hidden border border-foreground/20 bg-secondary px-6 py-14 sm:px-12 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:px-16 lg:py-16">
            <span className="absolute -right-4 -top-16 font-display text-[12rem] leading-none text-primary/10" aria-hidden="true">
              @
            </span>
            <div className="relative max-w-3xl">
              <p className="eyebrow">Próxima campanha</p>
              <h2 className="mt-5 text-4xl leading-[1.02] sm:text-6xl">Comece com contexto. Termine com uma mensagem sua.</h2>
            </div>
            <Button className="relative mt-9 lg:ml-10 lg:mt-0" size="lg" onClick={() => navigate(workspaceRoute)}>
              {user ? "Abrir workspace" : "Começar gratuitamente"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-foreground/15">
        <div className="container flex flex-col gap-6 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Brand compact />
            <p className="mt-4 max-w-sm text-xs leading-5 text-muted-foreground">
              Criação e exportação de campanhas de email. O disparo é feito na plataforma escolhida por você.
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
