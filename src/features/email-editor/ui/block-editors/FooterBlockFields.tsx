import type { BlockEditorFieldsProps } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FooterBlockFields({ content, onUpdate }: BlockEditorFieldsProps) {
  return (
        <div className="space-y-4">
          <h4 className="font-medium">Rodapé</h4>
          <div className="space-y-2">
            <Label>Nome da empresa</Label>
            <Input
              value={content.companyName || ""}
              onChange={(e) => onUpdate({ companyName: e.target.value })}
              placeholder="Sua Empresa"
            />
          </div>
          <div className="space-y-2">
            <Label>Endereço</Label>
            <Input
              value={content.address || ""}
              onChange={(e) => onUpdate({ address: e.target.value })}
              placeholder="Seu endereço"
            />
          </div>
          <div className="space-y-2">
            <Label>Texto de cancelamento</Label>
            <Input
              value={content.unsubscribeText || ""}
              onChange={(e) => onUpdate({ unsubscribeText: e.target.value })}
              placeholder="Clique aqui para cancelar"
            />
          </div>
        </div>
  );
}
