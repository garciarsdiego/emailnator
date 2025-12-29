import { EmailBlock, BlockContent } from "@/types/emailBuilder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AITextGenerator } from "./AITextGenerator";

interface BlockEditorProps {
  block: EmailBlock;
  onUpdate: (content: Partial<BlockContent>) => void;
}

export function BlockEditor({ block, onUpdate }: BlockEditorProps) {
  const { type, content } = block;

  switch (type) {
    case "header":
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

    case "text":
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

    case "image":
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

    case "button":
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

    case "divider":
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

    case "spacer":
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

    case "social":
      return (
        <div className="space-y-4">
          <h4 className="font-medium">Redes Sociais</h4>
          <div className="space-y-2">
            {content.socialLinks?.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Select
                  value={link.platform}
                  onValueChange={(v) => {
                    const updated = [...(content.socialLinks || [])];
                    updated[index] = { ...updated[index], platform: v };
                    onUpdate({ socialLinks: updated });
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={link.url}
                  onChange={(e) => {
                    const updated = [...(content.socialLinks || [])];
                    updated[index] = { ...updated[index], url: e.target.value };
                    onUpdate({ socialLinks: updated });
                  }}
                  placeholder="URL"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const updated = content.socialLinks?.filter((_, i) => i !== index);
                    onUpdate({ socialLinks: updated });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const updated = [...(content.socialLinks || []), { platform: "instagram", url: "#" }];
                onUpdate({ socialLinks: updated });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar rede
            </Button>
          </div>
        </div>
      );

    case "footer":
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

    case "video":
      return (
        <div className="space-y-4">
          <h4 className="font-medium">Vídeo</h4>
          <div className="space-y-2">
            <Label>URL do vídeo (YouTube/Vimeo)</Label>
            <Input
              value={content.videoUrl || ""}
              onChange={(e) => onUpdate({ videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div className="space-y-2">
            <Label>Thumbnail (opcional)</Label>
            <Input
              value={content.videoThumbnail || ""}
              onChange={(e) => onUpdate({ videoThumbnail: e.target.value })}
              placeholder="URL da imagem de capa"
            />
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={content.videoTitle || ""}
              onChange={(e) => onUpdate({ videoTitle: e.target.value })}
              placeholder="Assista ao vídeo"
            />
          </div>
        </div>
      );

    case "countdown":
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

    case "product":
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

    default:
      return <div className="text-muted-foreground">Selecione um bloco para editar</div>;
  }
}
