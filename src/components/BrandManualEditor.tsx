import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Palette, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BrandManualForm } from "@/features/brand/ui/BrandManualForm";
import { EMPTY_BRAND_MANUAL, type BrandManualFormData } from "@/features/brand/model/brandManual";
import { useBrandManual } from "@/hooks/useBrandManual";

interface BrandManualEditorProps {
  trigger?: ReactNode;
  onSave?: () => void;
}

export function BrandManualEditor({ trigger, onSave }: BrandManualEditorProps) {
  const { brandManual, isLoading, saveBrandManual } = useBrandManual();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<BrandManualFormData>({ ...EMPTY_BRAND_MANUAL });
  const [keyPhrasesText, setKeyPhrasesText] = useState("");

  useEffect(() => {
    if (!brandManual) return;
    setFormData({
      brand_name: brandManual.brand_name || "",
      primary_color: brandManual.primary_color || "#6366f1",
      secondary_color: brandManual.secondary_color || "",
      accent_color: brandManual.accent_color || "",
      background_color: brandManual.background_color || "#ffffff",
      heading_font: brandManual.heading_font || "Arial",
      body_font: brandManual.body_font || "Arial",
      tone: brandManual.tone || "casual",
      language_style: brandManual.language_style || "",
      key_phrases: brandManual.key_phrases || [],
    });
    setKeyPhrasesText(brandManual.key_phrases?.join(", ") || "");
  }, [brandManual]);

  const updateField = <Key extends keyof BrandManualFormData>(field: Key, value: BrandManualFormData[Key]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const keyPhrases = keyPhrasesText.split(",").map((phrase) => phrase.trim()).filter(Boolean);
      await saveBrandManual.mutateAsync({ ...formData, key_phrases: keyPhrases });
      toast.success("Manual de marca salvo!");
      onSave?.();
      setOpen(false);
    } catch {
      toast.error("Erro ao salvar manual de marca");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button variant="outline" size="sm"><Palette className="mr-2 h-4 w-4" />Manual de marca</Button>}</DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Manual de marca</DialogTitle></DialogHeader>
        {isLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
          <BrandManualForm data={formData} keyPhrasesText={keyPhrasesText} onFieldChange={updateField} onKeyPhrasesChange={setKeyPhrasesText} />
        )}
        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saveBrandManual.isPending}>Cancelar</Button>
          <Button onClick={() => void handleSave()} disabled={saveBrandManual.isPending}>{saveBrandManual.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
