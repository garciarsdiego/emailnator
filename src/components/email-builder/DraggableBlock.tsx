import { EmailBlock, BlockContent } from "@/types/emailBuilder";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

interface DraggableBlockProps {
  block: EmailBlock;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

export function DraggableBlock({
  block,
  isSelected,
  onSelect,
  onRemove,
  onDuplicate,
}: DraggableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group border-2 rounded-lg transition-all",
        isSelected ? "border-primary shadow-md" : "border-transparent hover:border-muted-foreground/30",
        isDragging && "opacity-50 z-50"
      )}
      onClick={onSelect}
    >
      {/* Drag handle and actions */}
      <div className={cn(
        "absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
        isSelected && "opacity-100"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Actions on the right */}
      <div className={cn(
        "absolute -right-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
        isSelected && "opacity-100"
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Block content preview */}
      <div className="p-3">
        <BlockPreview block={block} />
      </div>
    </div>
  );
}

function BlockPreview({ block }: { block: EmailBlock }) {
  const { type, content } = block;

  switch (type) {
    case "header":
      return (
        <div className="text-center py-4 bg-muted/30 rounded">
          {content.logoUrl ? (
            <img src={content.logoUrl} alt="Logo" className="h-10 mx-auto" />
          ) : (
            <span className="text-lg font-bold">{content.brandName || "Sua Marca"}</span>
          )}
        </div>
      );

    case "text":
      return (
        <div
          style={{
            fontSize: content.fontSize,
            fontWeight: content.fontWeight,
            textAlign: content.textAlign,
            color: content.color,
          }}
          className="min-h-[24px] prose prose-sm max-w-none [&>*]:m-0 [&_ul]:pl-5 [&_ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.text || "<p>Clique para editar...</p>") }}
        />
      );

    case "image":
      return content.imageUrl ? (
        <img
          src={content.imageUrl}
          alt={content.altText}
          style={{ width: content.imageWidth }}
          className="mx-auto rounded"
        />
      ) : (
        <div className="h-32 bg-muted/50 rounded flex items-center justify-center text-muted-foreground">
          Clique para adicionar imagem
        </div>
      );

    case "button":
      return (
        <div className="text-center">
          <button
            style={{
              backgroundColor: content.buttonColor,
              color: content.buttonTextColor,
              borderRadius: content.buttonRadius,
            }}
            className="px-6 py-3 font-medium"
          >
            {content.buttonText || "Botão"}
          </button>
        </div>
      );

    case "divider":
      return (
        <hr
          style={{
            borderColor: content.dividerColor,
            width: content.dividerWidth,
          }}
          className="mx-auto"
        />
      );

    case "spacer":
      return (
        <div
          style={{ height: content.spacerHeight }}
          className="bg-muted/20 rounded border border-dashed border-muted-foreground/20"
        />
      );

    case "social":
      return (
        <div className="flex justify-center gap-4 py-2">
          {content.socialLinks?.map((link, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs uppercase"
            >
              {link.platform.slice(0, 2)}
            </div>
          ))}
        </div>
      );

    case "footer":
      return (
        <div className="text-center text-sm text-muted-foreground py-4 bg-muted/30 rounded">
          <p className="font-medium">{content.companyName}</p>
          <p className="text-xs mt-1">{content.address}</p>
          <p className="text-xs mt-2 underline">{content.unsubscribeText}</p>
        </div>
      );

    case "video":
      return (
        <div className="text-center py-2">
          <div className="relative inline-block">
            {content.videoThumbnail || content.videoUrl ? (
              <img
                src={content.videoThumbnail || `https://img.youtube.com/vi/${extractYouTubeId(content.videoUrl || "")}/mqdefault.jpg`}
                alt={content.videoTitle || "Vídeo"}
                className="max-w-full rounded-lg"
              />
            ) : (
              <div className="w-full h-32 bg-muted/50 rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Adicione URL do vídeo</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/70 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[14px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
              </div>
            </div>
          </div>
          {content.videoTitle && (
            <p className="mt-2 text-sm font-medium">{content.videoTitle}</p>
          )}
        </div>
      );

    case "countdown":
      return (
        <div
          className="text-center py-4 px-4 rounded-lg"
          style={{
            backgroundColor: content.countdownBgColor || "#6366f1",
            color: content.countdownTextColor || "#ffffff",
          }}
        >
          <p className="text-sm mb-3">{content.countdownTitle || "Oferta termina em:"}</p>
          <div className="flex justify-center gap-2">
            {["Dias", "Horas", "Min", "Seg"].map((label) => (
              <div key={label} className="bg-white/20 rounded px-3 py-2 min-w-[50px]">
                <span className="text-xl font-bold block">00</span>
                <span className="text-[10px] uppercase">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2 opacity-80">Termina em: {content.countdownDate}</p>
        </div>
      );

    case "product":
      return (
        <div className="border rounded-lg overflow-hidden max-w-[280px] mx-auto">
          {content.productImage ? (
            <img
              src={content.productImage}
              alt={content.productName}
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-muted/50 flex items-center justify-center text-muted-foreground text-sm">
              Imagem do produto
            </div>
          )}
          <div className="p-3">
            <h4 className="font-medium text-sm">{content.productName || "Nome do Produto"}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {content.productDescription || "Descrição do produto..."}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-green-600 font-bold">{content.productPrice || "R$ 0,00"}</span>
              {content.productOldPrice && (
                <span className="text-xs text-muted-foreground line-through">{content.productOldPrice}</span>
              )}
            </div>
            <button className="mt-3 w-full bg-primary text-primary-foreground text-xs py-2 rounded font-medium">
              Comprar Agora
            </button>
          </div>
        </div>
      );

    default:
      return <div className="p-4 bg-muted rounded">Bloco desconhecido</div>;
  }
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : "";
}
