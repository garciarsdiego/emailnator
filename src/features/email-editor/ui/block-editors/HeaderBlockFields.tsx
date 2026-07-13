import type { BlockEditorFieldsProps } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function HeaderBlockFields({ content, onUpdate }: BlockEditorFieldsProps) {
  return (
        <div className="space-y-4">
          <h4 className="font-medium">Cabeçalho</h4>
          <div className="space-y-2">
            <Label>Nome da marca</Label>
            <Input
              value={content.brandName || ""}
              onChange={(e) => onUpdate({ brandName: e.target.value })}
              placeholder="Sua Marca"
            />
          </div>
          <div className="space-y-2">
            <Label>URL do logo</Label>
            <Input
              value={content.logoUrl || ""}
              onChange={(e) => onUpdate({ logoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
  );
}
