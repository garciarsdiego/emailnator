import { ArrowLeft, Compass } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/v2/Brand";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-background">
      <header className="container flex h-20 items-center border-b border-foreground/15 bg-background">
        <Brand />
      </header>

      <main id="main-content" tabIndex={-1} className="container grid min-h-[calc(100dvh-5rem)] items-center gap-12 py-16 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="relative">
          <p className="font-display text-[clamp(9rem,26vw,21rem)] leading-[0.7] tracking-[-0.08em] text-primary/15" aria-hidden="true">
            404
          </p>
          <span className="absolute left-[18%] top-[28%] grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift">
            <Compass className="h-6 w-6" />
          </span>
        </div>

        <section className="max-w-2xl lg:border-l lg:border-foreground/20 lg:pl-14">
          <p className="eyebrow">Página não encontrada</p>
          <h1 className="mt-5 text-5xl leading-[1.02] sm:text-6xl">Este caminho não leva a uma campanha.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            A rota <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{location.pathname}</code> não existe ou foi movida.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao início
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">Abrir workspace</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
