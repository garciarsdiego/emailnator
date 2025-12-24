import { BlockType, EmailBlock, BlockContent } from "@/types/emailBuilder";
import { 
  Type, 
  Image, 
  MousePointerClick, 
  Minus, 
  Space, 
  Share2, 
  FileText,
  Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "header", label: "Cabeçalho", icon: <Layout className="h-4 w-4" /> },
  { type: "text", label: "Texto", icon: <Type className="h-4 w-4" /> },
  { type: "image", label: "Imagem", icon: <Image className="h-4 w-4" /> },
  { type: "button", label: "Botão", icon: <MousePointerClick className="h-4 w-4" /> },
  { type: "divider", label: "Divisor", icon: <Minus className="h-4 w-4" /> },
  { type: "spacer", label: "Espaço", icon: <Space className="h-4 w-4" /> },
  { type: "social", label: "Redes Sociais", icon: <Share2 className="h-4 w-4" /> },
  { type: "footer", label: "Rodapé", icon: <FileText className="h-4 w-4" /> },
];

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground px-1">Blocos</h3>
      <div className="grid grid-cols-2 gap-2">
        {BLOCK_TYPES.map((block) => (
          <Button
            key={block.type}
            variant="outline"
            size="sm"
            className="h-auto py-3 flex flex-col gap-1 hover:bg-primary/10 hover:border-primary"
            onClick={() => onAddBlock(block.type)}
          >
            {block.icon}
            <span className="text-xs">{block.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
