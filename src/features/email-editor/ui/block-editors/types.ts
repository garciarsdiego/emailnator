import type { BlockContent } from "@/types/emailBuilder";

export interface BlockEditorFieldsProps {
  content: BlockContent;
  onUpdate: (content: Partial<BlockContent>) => void;
}
