import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToneSelector } from "@/components/ToneSelector";
import type { BrandManualFormData } from "@/features/brand/model/brandManual";

const fonts = ["Arial", "Helvetica", "Georgia", "Times New Roman", "Verdana", "Trebuchet MS", "Roboto", "Open Sans", "Montserrat", "Poppins"];

interface BrandManualFormProps {
  data: BrandManualFormData;
  keyPhrasesText: string;
  onFieldChange: <Key extends keyof BrandManualFormData>(field: Key, value: BrandManualFormData[Key]) => void;
  onKeyPhrasesChange: (value: string) => void;
}

function ColorField({ label, value, fallback, onChange }: { label: string; value: string; fallback: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Input aria-label={`${label}: seletor`} type="color" value={value || fallback} onChange={(event) => onChange(event.target.value)} className="h-10 w-12 cursor-pointer p-1" />
        <Input aria-label={`${label}: hexadecimal`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={fallback} className="flex-1 font-mono text-xs" />
      </div>
    </div>
  );
}

export function BrandManualForm({ data, keyPhrasesText, onFieldChange, onKeyPhrasesChange }: BrandManualFormProps) {
  return (
    <div className="mt-4 flex-1 space-y-6 overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label htmlFor="brand-name">Nome da marca</Label>
        <Input id="brand-name" value={data.brand_name} onChange={(event) => onFieldChange("brand_name", event.target.value)} placeholder="Nome da sua empresa ou marca" />
      </div>

      <section className="space-y-3" aria-labelledby="brand-colors-title">
        <Label id="brand-colors-title">Cores da marca</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ColorField label="Primária" value={data.primary_color} fallback="#6366f1" onChange={(value) => onFieldChange("primary_color", value)} />
          <ColorField label="Secundária" value={data.secondary_color} fallback="#000000" onChange={(value) => onFieldChange("secondary_color", value)} />
          <ColorField label="Destaque" value={data.accent_color} fallback="#000000" onChange={(value) => onFieldChange("accent_color", value)} />
          <ColorField label="Fundo" value={data.background_color} fallback="#ffffff" onChange={(value) => onFieldChange("background_color", value)} />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="brand-fonts-title">
        <Label id="brand-fonts-title">Fontes</Label>
        <div className="grid grid-cols-2 gap-3">
          {(["heading_font", "body_font"] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={field} className="text-xs text-muted-foreground">{field === "heading_font" ? "Títulos" : "Corpo"}</Label>
              <select id={field} value={data[field]} onChange={(event) => onFieldChange(field, event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {fonts.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-2"><Label>Tom de comunicação</Label><ToneSelector value={data.tone} onChange={(tone) => onFieldChange("tone", tone)} /></div>
      <div className="space-y-2"><Label htmlFor="language-style">Estilo de linguagem</Label><Textarea id="language-style" value={data.language_style} onChange={(event) => onFieldChange("language_style", event.target.value)} placeholder="Linguagem, uso de emojis e foco da comunicação..." rows={3} /></div>
      <div className="space-y-2"><Label htmlFor="key-phrases">Frases-chave da marca</Label><Textarea id="key-phrases" value={keyPhrasesText} onChange={(event) => onKeyPhrasesChange(event.target.value)} placeholder="Separe as frases por vírgula" rows={2} /><p className="text-xs text-muted-foreground">Separe as frases por vírgula.</p></div>

      {data.brand_name && (
        <Card className="border-dashed">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg p-4" style={{ backgroundColor: data.background_color }}>
              <h3 style={{ color: data.primary_color, fontFamily: data.heading_font, fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem" }}>{data.brand_name}</h3>
              <p style={{ fontFamily: data.body_font, fontSize: "0.875rem", color: data.primary_color === "#ffffff" ? "#333" : `${data.primary_color}99` }}>Exemplo de texto com a fonte e as cores da sua marca.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
