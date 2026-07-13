import { Header } from "@/components/Header";
import { EmailGenerator } from "@/components/EmailGenerator";

export default function EmailAI() {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 overflow-hidden flex flex-col">
        <div className="container px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex flex-col flex-1 min-h-0">
          <div className="mb-3 sm:mb-4 flex-shrink-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Gerador de Emails com IA</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Crie emails de marketing profissionais com inteligência artificial
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <EmailGenerator />
          </div>
        </div>
      </main>
    </div>
  );
}
