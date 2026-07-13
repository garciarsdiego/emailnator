import type { BlockEditorFieldsProps } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CountdownBlockFields({ content, onUpdate }: BlockEditorFieldsProps) {
  return (
        <div className="space-y-4">
          <h4 className="font-medium">Contador Regressivo</h4>
          <div className="space-y-2">
            <Label>Data de término</Label>
            <Input
              type="date"
              value={content.countdownDate || ""}
              onChange={(e) => onUpdate({ countdownDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={content.countdownTitle || ""}
              onChange={(e) => onUpdate({ countdownTitle: e.target.value })}
              placeholder="Oferta termina em:"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Cor de fundo</Label>
              <Input
                type="color"
                value={content.countdownBgColor || "#6366f1"}
                onChange={(e) => onUpdate({ countdownBgColor: e.target.value })}
                className="h-9 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor do texto</Label>
              <Input
                type="color"
                value={content.countdownTextColor || "#ffffff"}
                onChange={(e) => onUpdate({ countdownTextColor: e.target.value })}
                className="h-9 p-1"
              />
            </div>
          </div>
        </div>
  );
}
