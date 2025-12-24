import { EmailBlock, BlockContent } from "@/types/emailBuilder";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          className="min-h-[24px]"
        >
          {content.text || "Clique para editar..."}
        </div>
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

    default:
      return <div className="p-4 bg-muted rounded">Bloco desconhecido</div>;
  }
}
