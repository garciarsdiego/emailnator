import { EmailBlock } from "@/types/emailBuilder";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableBlock } from "./DraggableBlock";

interface EmailCanvasProps {
  blocks: EmailBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onMoveBlock: (fromIndex: number, toIndex: number) => void;
  onRemoveBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
}

export function EmailCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  onRemoveBlock,
  onDuplicateBlock,
}: EmailCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      onMoveBlock(oldIndex, newIndex);
    }
  };

  if (blocks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg min-h-[400px]">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Seu email está vazio</p>
          <p className="text-sm">Adicione blocos do painel lateral para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-[600px] mx-auto bg-white rounded-lg shadow-sm border p-6 min-h-[400px]">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 px-10">
              {blocks.map((block) => (
                <DraggableBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => onSelectBlock(block.id)}
                  onRemove={() => onRemoveBlock(block.id)}
                  onDuplicate={() => onDuplicateBlock(block.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
