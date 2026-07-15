import { Header } from "@/components/Header";
import { EmailGenerator } from "@/components/EmailGenerator";

export default function EmailAI() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col overflow-hidden">
        <div className="container flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
          <div className="mb-4 flex-shrink-0 border-b border-foreground/15 pb-4">
            <p className="v3-kicker">Briefing de campanha</p>
            <h1 className="mt-2 text-2xl leading-tight sm:text-3xl">Crie com contexto antes de gerar.</h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm">
              Defina marca, público, oferta, tom e referências para receber um email editável no workspace.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <EmailGenerator />
          </div>
        </div>
      </main>
    </div>
  );
}
