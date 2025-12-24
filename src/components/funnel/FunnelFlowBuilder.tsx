import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FUNNEL_STAGES, SequenceEmail } from "@/types/emailSequence";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ArrowRight, 
  Clock, 
  Mail, 
  Sparkles, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  Edit,
  Eye,
  Loader2,
  Wand2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { NICHES, TONES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FunnelFlowBuilderProps {
  onSave?: (sequence: { name: string; emails: Partial<SequenceEmail>[] }) => void;
}

export function FunnelFlowBuilder({ onSave }: FunnelFlowBuilderProps) {
  const { subscription } = useAuth();
  const isPremium = subscription.plan === "pro" || subscription.plan === "enterprise";

  const [sequenceName, setSequenceName] = useState("");
  const [niche, setNiche] = useState("");
  const [tone, setTone] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [emails, setEmails] = useState<Partial<SequenceEmail>[]>(
    FUNNEL_STAGES.map((stage) => ({
      position: stage.id,
      name: stage.name,
      subject: "",
      content: "",
      delay_days: stage.delay,
      trigger_type: "time_delay" as const,
    }))
  );
  const [expandedEmail, setExpandedEmail] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  const handleGenerateAll = async () => {
    if (!niche || !tone || !productDescription) {
      toast.error("Preencha o nicho, tom e descrição do produto");
      return;
    }

    setIsGenerating(true);
    try {
      const generatedEmails = await Promise.all(
        FUNNEL_STAGES.map(async (stage, index) => {
          const { data, error } = await supabase.functions.invoke("generate-email", {
            body: {
              niche,
              campaignType: getFunnelCampaignType(stage.id),
              tone,
              targetAudience: productDescription,
              additionalContext: `Este é o email ${stage.id} de 5 em um fluxo de funil. Etapa: ${stage.name}. Objetivo: ${stage.description}. Tipo de email: ${stage.emailType}.`,
            },
          });

          if (error) throw error;

          return {
            ...emails[index],
            subject: data.subject,
            content: data.content,
          };
        })
      );

      setEmails(generatedEmails);
      toast.success("Todos os emails do funil foram gerados!");
    } catch (error: any) {
      console.error("Error generating funnel:", error);
      toast.error("Erro ao gerar funil: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSingle = async (index: number) => {
    if (!niche || !tone) {
      toast.error("Preencha o nicho e tom primeiro");
      return;
    }

    const stage = FUNNEL_STAGES[index];
    setGeneratingIndex(index);

    try {
      const { data, error } = await supabase.functions.invoke("generate-email", {
        body: {
          niche,
          campaignType: getFunnelCampaignType(stage.id),
          tone,
          targetAudience: productDescription,
          additionalContext: `Este é o email ${stage.id} de 5 em um fluxo de funil. Etapa: ${stage.name}. Objetivo: ${stage.description}. Tipo de email: ${stage.emailType}.`,
        },
      });

      if (error) throw error;

      setEmails((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          subject: data.subject,
          content: data.content,
        };
        return updated;
      });

      toast.success(`Email "${stage.name}" gerado!`);
    } catch (error: any) {
      toast.error("Erro ao gerar email: " + error.message);
    } finally {
      setGeneratingIndex(null);
    }
  };

  const getFunnelCampaignType = (stageId: number): string => {
    const types: Record<number, string> = {
      1: "welcome",
      2: "newsletter",
      3: "feedback",
      4: "promotional",
      5: "promotional",
    };
    return types[stageId] || "newsletter";
  };

  const updateEmail = (index: number, field: string, value: string | number) => {
    setEmails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = () => {
    if (!sequenceName) {
      toast.error("Digite um nome para o fluxo");
      return;
    }
    if (emails.some((e) => !e.subject || !e.content)) {
      toast.error("Todos os emails precisam ter assunto e conteúdo");
      return;
    }

    onSave?.({ name: sequenceName, emails });
    toast.success("Fluxo salvo com sucesso!");
  };

  if (!isPremium) {
    return (
      <Card className="glass-card">
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Recurso Premium</h3>
          <p className="text-muted-foreground mb-6">
            O Fluxo de Funil está disponível apenas para planos Pro e Enterprise.
          </p>
          <Button onClick={() => window.location.href = "/pricing"}>
            <Sparkles className="h-4 w-4 mr-2" />
            Ver Planos
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Criar Fluxo de Funil
          </CardTitle>
          <CardDescription>
            Configure uma sequência de 5 emails que guiam o lead através do funil de vendas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do Fluxo</Label>
              <Input
                value={sequenceName}
                onChange={(e) => setSequenceName(e.target.value)}
                placeholder="Ex: Lançamento Produto X"
              />
            </div>
            <div className="space-y-2">
              <Label>Nicho</Label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nicho" />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>
                      {n.icon} {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tom</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tom" />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição do Produto/Oferta</Label>
              <Input
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Descreva brevemente seu produto..."
              />
            </div>
          </div>

          <Button
            onClick={handleGenerateAll}
            disabled={isGenerating || !niche || !tone}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando todos os emails...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Gerar Funil Completo com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Funnel visualization */}
      <div className="relative">
        {FUNNEL_STAGES.map((stage, index) => (
          <div key={stage.id} className="relative">
            {/* Connector line */}
            {index < FUNNEL_STAGES.length - 1 && (
              <div className="absolute left-6 top-full h-8 w-0.5 bg-primary/30 z-0" />
            )}

            <Card
              className={cn(
                "glass-card mb-4 transition-all cursor-pointer",
                expandedEmail === index && "ring-2 ring-primary"
              )}
              onClick={() => setExpandedEmail(expandedEmail === index ? null : index)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{stage.id}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {stage.name}
                        {emails[index]?.subject && (
                          <Badge variant="secondary" className="text-xs">
                            Configurado
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {stage.emailType}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {stage.delay === 0 ? "Imediato" : `+${stage.delay} dias`}
                    </Badge>
                    {expandedEmail === index ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedEmail === index && (
                <CardContent className="pt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm text-muted-foreground">{stage.description}</p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Assunto do Email</Label>
                      <Input
                        value={emails[index]?.subject || ""}
                        onChange={(e) => updateEmail(index, "subject", e.target.value)}
                        placeholder="Digite o assunto..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Conteúdo do Email</Label>
                      <Textarea
                        value={emails[index]?.content || ""}
                        onChange={(e) => updateEmail(index, "content", e.target.value)}
                        placeholder="Digite o conteúdo do email..."
                        rows={6}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSingle(index)}
                        disabled={generatingIndex === index}
                      >
                        {generatingIndex === index ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Gerar com IA
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Salvar como Rascunho</Button>
        <Button onClick={handleSave}>
          <Mail className="h-4 w-4 mr-2" />
          Salvar Fluxo
        </Button>
      </div>
    </div>
  );
}
