import { BlockType } from "@/types/emailBuilder";
import { 
  Type, 
  Image, 
  MousePointerClick, 
  Minus, 
  Space, 
  Share2, 
  FileText,
  Layout,
  Video,
  Timer,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; category: "content" | "layout" | "advanced" }[] = [
  { type: "header", label: "Cabeçalho", icon: <Layout className="h-4 w-4" />, category: "layout" },
  { type: "text", label: "Texto", icon: <Type className="h-4 w-4" />, category: "content" },
  { type: "image", label: "Imagem", icon: <Image className="h-4 w-4" />, category: "content" },
  { type: "button", label: "Botão", icon: <MousePointerClick className="h-4 w-4" />, category: "content" },
  { type: "divider", label: "Divisor", icon: <Minus className="h-4 w-4" />, category: "layout" },
  { type: "spacer", label: "Espaço", icon: <Space className="h-4 w-4" />, category: "layout" },
  { type: "social", label: "Redes Sociais", icon: <Share2 className="h-4 w-4" />, category: "content" },
  { type: "footer", label: "Rodapé", icon: <FileText className="h-4 w-4" />, category: "layout" },
  { type: "video", label: "Vídeo", icon: <Video className="h-4 w-4" />, category: "advanced" },
  { type: "countdown", label: "Contador", icon: <Timer className="h-4 w-4" />, category: "advanced" },
  { type: "product", label: "Produto", icon: <ShoppingBag className="h-4 w-4" />, category: "advanced" },
];

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  const categories = [
    { key: "content", label: "Conteúdo" },
    { key: "layout", label: "Layout" },
    { key: "advanced", label: "Avançado" },
  ];

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.key} className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
            {category.label}
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {BLOCK_TYPES.filter((b) => b.category === category.key).map((block) => (
              <Button
                key={block.type}
                variant="outline"
                size="sm"
                className="h-auto py-2 flex flex-col gap-0.5 hover:bg-primary/10 hover:border-primary text-xs"
                onClick={() => onAddBlock(block.type)}
              >
                {block.icon}
                <span className="text-[10px] leading-tight">{block.label}</span>
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
