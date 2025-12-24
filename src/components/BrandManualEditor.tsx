import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useBrandManual } from "@/hooks/useBrandManual";
import { toast } from "sonner";
import { Loader2, Palette, Save, X } from "lucide-react";
import { ToneSelector } from "./ToneSelector";

interface BrandManualEditorProps {
  trigger?: React.ReactNode;
  onSave?: () => void;
}

export function BrandManualEditor({ trigger, onSave }: BrandManualEditorProps) {
  const { brandManual, isLoading, saveBrandManual } = useBrandManual();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    brand_name: "",
    primary_color: "#6366f1",
    secondary_color: "",
    accent_color: "",
    background_color: "#ffffff",
    heading_font: "Arial",
    body_font: "Arial",
    tone: "casual",
    language_style: "",
    key_phrases: [] as string[],
  });
  const [keyPhrasesText, setKeyPhrasesText] = useState("");

  useEffect(() => {
    if (brandManual) {
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
    }
  }, [brandManual]);

  const handleSave = async () => {
    try {
      const phrases = keyPhrasesText
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      await saveBrandManual.mutateAsync({
        ...formData,
        key_phrases: phrases,
      });
      toast.success("Manual de marca salvo!");
      onSave?.();
      setOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar manual de marca");
    }
  };

  const fonts = [
    "Arial",
    "Helvetica",
    "Georgia",
    "Times New Roman",
    "Verdana",
    "Trebuchet MS",
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Poppins",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Palette className="h-4 w-4 mr-2" />
            Manual de Marca
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Manual de Marca
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 mt-4 pr-2">
            {/* Brand Name */}
            <div className="space-y-2">
              <Label>Nome da Marca</Label>
              <Input
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                placeholder="Nome da sua empresa/marca"
              />
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <Label>Cores da Marca</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.secondary_color || "#000000"}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      placeholder="#000000"
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Destaque</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.accent_color || "#000000"}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      placeholder="#000000"
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fonts */}
            <div className="space-y-3">
              <Label>Fontes</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Títulos</Label>
                  <select
                    value={formData.heading_font}
                    onChange={(e) => setFormData({ ...formData, heading_font: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {fonts.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Corpo</Label>
                  <select
                    value={formData.body_font}
                    onChange={(e) => setFormData({ ...formData, body_font: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {fonts.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label>Tom de Comunicação</Label>
              <ToneSelector value={formData.tone} onChange={(tone) => setFormData({ ...formData, tone })} />
            </div>

            {/* Language Style */}
            <div className="space-y-2">
              <Label>Estilo de Linguagem</Label>
              <Textarea
                value={formData.language_style}
                onChange={(e) => setFormData({ ...formData, language_style: e.target.value })}
                placeholder="Ex: Linguagem jovem e descontraída, uso de emojis moderado, foco em benefícios práticos..."
                rows={3}
              />
            </div>

            {/* Key Phrases */}
            <div className="space-y-2">
              <Label>Frases-Chave da Marca</Label>
              <Textarea
                value={keyPhrasesText}
                onChange={(e) => setKeyPhrasesText(e.target.value)}
                placeholder="Ex: Qualidade que você merece, Feito para você, Transforme seu dia... (separe por vírgula)"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Separe as frases por vírgula</p>
            </div>

            {/* Preview */}
            {formData.brand_name && (
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: formData.background_color }}
                  >
                    <h3
                      style={{
                        color: formData.primary_color,
                        fontFamily: formData.heading_font,
                        fontSize: "1.25rem",
                        fontWeight: "bold",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {formData.brand_name}
                    </h3>
                    <p
                      style={{
                        fontFamily: formData.body_font,
                        fontSize: "0.875rem",
                        color: formData.primary_color === "#ffffff" ? "#333" : formData.primary_color + "99",
                      }}
                    >
                      Exemplo de texto com a fonte e cores da sua marca.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveBrandManual.isPending}>
            {saveBrandManual.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
