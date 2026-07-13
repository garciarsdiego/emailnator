import type { BlockEditorFieldsProps } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ProductBlockFields({ content, onUpdate }: BlockEditorFieldsProps) {
  return (
        <div className="space-y-4">
          <h4 className="font-medium">Produto</h4>
          <div className="space-y-2">
            <Label>Nome do produto</Label>
            <Input
              value={content.productName || ""}
              onChange={(e) => onUpdate({ productName: e.target.value })}
              placeholder="Nome do Produto"
            />
          </div>
          <div className="space-y-2">
            <Label>URL da imagem</Label>
            <Input
              value={content.productImage || ""}
              onChange={(e) => onUpdate({ productImage: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Preço atual</Label>
              <Input
                value={content.productPrice || ""}
                onChange={(e) => onUpdate({ productPrice: e.target.value })}
                placeholder="R$ 99,90"
              />
            </div>
            <div className="space-y-2">
              <Label>Preço antigo</Label>
              <Input
                value={content.productOldPrice || ""}
                onChange={(e) => onUpdate({ productOldPrice: e.target.value })}
                placeholder="R$ 149,90"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={content.productDescription || ""}
              onChange={(e) => onUpdate({ productDescription: e.target.value })}
              placeholder="Descrição do produto..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Link de compra</Label>
            <Input
              value={content.productUrl || ""}
              onChange={(e) => onUpdate({ productUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
  );
}
