import { Header } from "@/components/Header";
import { FunnelFlowBuilder } from "@/components/funnel/FunnelFlowBuilder";

export default function FunnelBuilder() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="container py-6">
        <FunnelFlowBuilder />
      </main>
    </div>
  );
}
