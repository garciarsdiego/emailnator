import type { BlockEditorFieldsProps } from "./types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SpacerBlockFields({ content, onUpdate }: BlockEditorFieldsProps) {
  return (
        <div className="space-y-4">
          <h4 className="font-medium">Espaçamento</h4>
          <div className="space-y-2">
            <Label>Altura</Label>
            <Select
              value={content.spacerHeight || "24px"}
              onValueChange={(v) => onUpdate({ spacerHeight: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8px">Pequeno (8px)</SelectItem>
                <SelectItem value="16px">Médio (16px)</SelectItem>
                <SelectItem value="24px">Grande (24px)</SelectItem>
                <SelectItem value="32px">Extra grande (32px)</SelectItem>
                <SelectItem value="48px">Enorme (48px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
  );
}
