import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AITextGeneratorProps {
  onGenerated: (text: string) => void;
  currentText?: string;
  blockType: "text" | "button" | "header" | "footer";
}

const TEXT_TYPES = [
  { value: "headline", label: "Headline / Título" },
  { value: "paragraph", label: "Parágrafo / Corpo" },
  { value: "cta", label: "CTA / Chamada para ação" },
  { value: "benefits", label: "Lista de benefícios" },
  { value: "urgency", label: "Urgência / Escassez" },
  { value: "social_proof", label: "Prova social" },
];

export function AITextGenerator({ onGenerated, currentText, blockType }: AITextGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [textType, setTextType] = useState("headline");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("casual");

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-block-text", {
        body: {
          textType,
          context,
          tone,
          blockType,
          currentText,
        },
      });

      if (error) throw error;

      if (data?.text) {
        onGenerated(data.text);
        setIsOpen(false);
        setContext("");
        toast.success("Texto gerado com sucesso!");
      }
    } catch (error: any) {
      console.error("Error generating text:", error);
      toast.error(error.message || "Erro ao gerar texto");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full gap-2"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Gerar com IA
      </Button>
    );
  }

  return (
    <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Gerar Texto com IA
        </Label>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => setIsOpen(false)}
        >
          Cancelar
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Tipo de texto</Label>
        <Select value={textType} onValueChange={setTextType}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEXT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value} className="text-xs">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Tom</Label>
        <Select value={tone} onValueChange={setTone}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="casual" className="text-xs">Casual e amigável</SelectItem>
            <SelectItem value="formal" className="text-xs">Formal e profissional</SelectItem>
            <SelectItem value="urgent" className="text-xs">Urgente e persuasivo</SelectItem>
            <SelectItem value="playful" className="text-xs">Divertido e criativo</SelectItem>
            <SelectItem value="luxury" className="text-xs">Sofisticado e premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Contexto (opcional)</Label>
        <Textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Descreva seu produto, oferta ou objetivo do email..."
          rows={2}
          className="text-xs resize-none"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        size="sm"
        className="w-full gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            Gerar Texto
          </>
        )}
      </Button>
    </div>
  );
}
