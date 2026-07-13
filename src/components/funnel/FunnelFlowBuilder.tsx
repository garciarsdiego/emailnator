import { Link } from "react-router-dom";
import { Loader2, Lock, Mail, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFunnelWorkflow } from "@/features/funnels/hooks/useFunnelWorkflow";
import { FunnelSetupCard } from "@/features/funnels/ui/FunnelSetupCard";
import { FunnelStageCard } from "@/features/funnels/ui/FunnelStageCard";
import { FUNNEL_STAGES } from "@/types/emailSequence";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FunnelFlowBuilderProps {
  onSaved?: (sequenceId: string) => void;
}

export function FunnelFlowBuilder({ onSaved }: FunnelFlowBuilderProps) {
  const { subscription } = useAuth();
  const workflow = useFunnelWorkflow(onSaved);
  const isPremium = subscription.plan === "pro" || subscription.plan === "enterprise";

  if (!isPremium) {
    return (
      <Card className="glass-card">
        <CardContent className="py-12 text-center">
          <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Recurso do plano Pro</h2>
          <p className="mb-6 text-muted-foreground">Fluxos de funil estão disponíveis nos planos Pro e Enterprise.</p>
          <Button asChild><Link to="/pricing"><Sparkles className="mr-2 h-4 w-4" />Ver planos</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FunnelSetupCard
        sequenceName={workflow.sequenceName}
        niche={workflow.niche}
        tone={workflow.tone}
        productDescription={workflow.productDescription}
        siteUrl={workflow.siteUrl}
        siteAnalysis={workflow.siteAnalysis}
        isAnalyzing={workflow.isAnalyzing}
        isGenerating={workflow.isGenerating}
        onSequenceNameChange={workflow.setSequenceName}
        onNicheChange={workflow.setNiche}
        onToneChange={workflow.setTone}
        onProductDescriptionChange={workflow.setProductDescription}
        onSiteUrlChange={workflow.setSiteUrl}
        onAnalyze={workflow.analyze}
        onGenerate={workflow.generateAll}
      />

      <section aria-label="Emails do fluxo">
        {FUNNEL_STAGES.map((stage, index) => (
          <FunnelStageCard
            key={stage.id}
            stage={stage}
            email={workflow.emails[index]}
            index={index}
            expanded={workflow.expandedEmail === index}
            generating={workflow.generatingIndex === index}
            showConnector={index < FUNNEL_STAGES.length - 1}
            onToggle={() => workflow.setExpandedEmail(workflow.expandedEmail === index ? null : index)}
            onGenerate={() => workflow.generateStage(index)}
            onUpdate={(field, value) => workflow.updateEmail(index, field, value)}
          />
        ))}
      </section>

      <div className="flex justify-end">
        <Button onClick={workflow.save} disabled={workflow.isSaving}>
          {workflow.isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          {workflow.isSaving ? "Salvando..." : "Salvar fluxo"}
        </Button>
      </div>
    </div>
  );
}
