import type { BlockEditorFieldsProps } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ImageBlockFields({ content, onUpdate }: BlockEditorFieldsProps) {
  return (
        <div className="space-y-4">
          <h4 className="font-medium">Imagem</h4>
          <div className="space-y-2">
            <Label>URL da imagem</Label>
            <Input
              value={content.imageUrl || ""}
              onChange={(e) => onUpdate({ imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Texto alternativo</Label>
            <Input
              value={content.altText || ""}
              onChange={(e) => onUpdate({ altText: e.target.value })}
              placeholder="Descrição da imagem"
            />
          </div>
          <div className="space-y-2">
            <Label>Largura</Label>
            <Select
              value={content.imageWidth || "100%"}
              onValueChange={(v) => onUpdate({ imageWidth: v })}
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
  );
}
