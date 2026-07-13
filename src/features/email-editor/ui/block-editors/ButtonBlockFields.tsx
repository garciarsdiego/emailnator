import type { BlockEditorFieldsProps } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AITextGenerator } from "@/components/email-builder/AITextGenerator";

export function ButtonBlockFields({ content, onUpdate }: BlockEditorFieldsProps) {
  return (
        <div className="space-y-4">
          <h4 className="font-medium">Botão</h4>
          <AITextGenerator
            blockType="button"
            currentText={content.buttonText}
            onGenerated={(text) => onUpdate({ buttonText: text })}
          />
          <div className="space-y-2">
            <Label>Texto do botão</Label>
            <Input
              value={content.buttonText || ""}
              onChange={(e) => onUpdate({ buttonText: e.target.value })}
              placeholder="Clique Aqui"
            />
          </div>
          <div className="space-y-2">
            <Label>URL de destino</Label>
            <Input
              value={content.buttonUrl || ""}
              onChange={(e) => onUpdate({ buttonUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Cor do fundo</Label>
              <Input
                type="color"
                value={content.buttonColor || "#22c55e"}
                onChange={(e) => onUpdate({ buttonColor: e.target.value })}
                className="h-9 p-1"
              />
              <p className="text-[10px] text-muted-foreground">Padrão: Verde</p>
            </div>
            <div className="space-y-2">
              <Label>Cor do texto</Label>
              <Input
                type="color"
                value={content.buttonTextColor || "#ffffff"}
                onChange={(e) => onUpdate({ buttonTextColor: e.target.value })}
                className="h-9 p-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Arredondamento</Label>
            <Select
              value={content.buttonRadius || "8px"}
              onValueChange={(v) => onUpdate({ buttonRadius: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0px">Quadrado</SelectItem>
                <SelectItem value="4px">Leve</SelectItem>
                <SelectItem value="8px">Médio</SelectItem>
                <SelectItem value="16px">Arredondado</SelectItem>
                <SelectItem value="9999px">Pílula</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
  );
}
