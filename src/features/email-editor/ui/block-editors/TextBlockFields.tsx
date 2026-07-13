import type { BlockEditorFieldsProps } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AITextGenerator } from "@/components/email-builder/AITextGenerator";

export function TextBlockFields({ content, onUpdate }: BlockEditorFieldsProps) {
  return (
        <div className="space-y-4">
          <h4 className="font-medium">Texto</h4>
          <AITextGenerator
            blockType="text"
            currentText={content.text}
            onGenerated={(text) => onUpdate({ text })}
          />
          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <Textarea
              value={content.text || ""}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Digite seu texto..."
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select
                value={content.fontSize || "16px"}
                onValueChange={(v) => onUpdate({ fontSize: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12px">12px</SelectItem>
                  <SelectItem value="14px">14px</SelectItem>
                  <SelectItem value="16px">16px</SelectItem>
                  <SelectItem value="18px">18px</SelectItem>
                  <SelectItem value="20px">20px</SelectItem>
                  <SelectItem value="24px">24px</SelectItem>
                  <SelectItem value="32px">32px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Peso</Label>
              <Select
                value={content.fontWeight || "normal"}
                onValueChange={(v) => onUpdate({ fontWeight: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="semibold">Semibold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Alinhamento</Label>
              <Select
                value={content.textAlign || "left"}
                onValueChange={(v) => onUpdate({ textAlign: v as "left" | "center" | "right" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input
                type="color"
                value={content.color || "#333333"}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="h-9 p-1"
              />
            </div>
          </div>
        </div>
  );
}
