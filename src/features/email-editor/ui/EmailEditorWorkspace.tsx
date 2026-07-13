import { Card } from "@/components/ui/card";
import { BlockPalette } from "@/components/email-builder/BlockPalette";
import { BlockEditor } from "@/components/email-builder/BlockEditor";
import { EmailCanvas } from "@/components/email-builder/EmailCanvas";
import type { EditorMode, PreviewDevice } from "@/features/email-editor/model/editorView";
import type { BlockContent, BlockType, EmailBlock } from "@/types/emailBuilder";
import { cn } from "@/lib/utils";

interface EmailEditorWorkspaceProps {
  mode: EditorMode;
  device: PreviewDevice;
  blocks: EmailBlock[];
  selectedBlockId: string | null;
  selectedBlock: EmailBlock | null;
  html: string;
  onAddBlock: (type: BlockType) => void;
  onSelectBlock: (id: string) => void;
  onMoveBlock: (fromIndex: number, toIndex: number) => void;
  onRemoveBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onUpdateBlock: (id: string, content: Partial<BlockContent>) => void;
}

export function EmailEditorWorkspace(props: EmailEditorWorkspaceProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {props.mode === "edit" && <>
        <aside className="w-44 overflow-y-auto border-r bg-muted/30 p-2" aria-label="Blocos"><BlockPalette onAddBlock={props.onAddBlock} /></aside>
        <div className="flex-1 overflow-auto bg-muted/20 p-4">
          <EmailCanvas blocks={props.blocks} selectedBlockId={props.selectedBlockId} onSelectBlock={props.onSelectBlock} onMoveBlock={props.onMoveBlock} onRemoveBlock={props.onRemoveBlock} onDuplicateBlock={props.onDuplicateBlock} />
        </div>
        <aside className="w-64 overflow-y-auto border-l bg-background p-3" aria-label="Propriedades do bloco">
          {props.selectedBlock ? <BlockEditor block={props.selectedBlock} onUpdate={(content) => props.onUpdateBlock(props.selectedBlock!.id, content)} /> : <div className="py-8 text-center text-muted-foreground"><p className="text-sm">Selecione um bloco para editar</p><p className="mt-2 text-xs">ou adicione um bloco da paleta</p></div>}
        </aside>
      </>}

      {props.mode === "preview" && (
        <div className="flex-1 overflow-auto bg-muted/20 p-4">
          <div className={cn("mx-auto transition-all", props.device === "mobile" ? "max-w-[375px]" : "max-w-[600px]")}>
            <Card className="overflow-hidden"><iframe srcDoc={props.html} sandbox="" className="min-h-[600px] w-full border-0" title="Preview do email" /></Card>
          </div>
        </div>
      )}

      {props.mode === "html" && <div className="flex-1 overflow-auto p-4"><Card className="p-4"><pre className="max-h-[600px] overflow-auto rounded bg-muted p-4 text-sm"><code>{props.html}</code></pre></Card></div>}
    </div>
  );
}
