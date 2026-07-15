import { Header } from "@/components/Header";
import { FunnelFlowBuilder } from "@/components/funnel/FunnelFlowBuilder";

export default function FunnelBuilder() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="container pb-20 pt-8">
        <div className="mb-8 border-b border-foreground/15 pb-6">
          <p className="v3-kicker">Sequência de emails</p>
          <h1 className="mt-3 text-4xl leading-[1.02] sm:text-5xl">Transforme uma campanha em funil.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
            Organize etapas, timing e mensagens para guiar seu publico com mais continuidade.
          </p>
        </div>
        <FunnelFlowBuilder />
      </main>
    </div>
  );
}
