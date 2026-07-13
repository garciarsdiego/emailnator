import type { BlockEditorFieldsProps } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DividerBlockFields({ content, onUpdate }: BlockEditorFieldsProps) {
  return (
        <div className="space-y-4">
          <h4 className="font-medium">Divisor</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input
                type="color"
                value={content.dividerColor || "#e5e7eb"}
                onChange={(e) => onUpdate({ dividerColor: e.target.value })}
                className="h-9 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label>Largura</Label>
              <Select
                value={content.dividerWidth || "100%"}
                onValueChange={(v) => onUpdate({ dividerWidth: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50%">50%</SelectItem>
                  <SelectItem value="75%">75%</SelectItem>
                  <SelectItem value="100%">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
  );
}
