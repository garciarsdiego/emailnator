import type { ComponentType } from "react";
import type { BlockContent, EmailBlock } from "@/types/emailBuilder";
import { HeaderBlockFields } from "@/features/email-editor/ui/block-editors/HeaderBlockFields";
import { TextBlockFields } from "@/features/email-editor/ui/block-editors/TextBlockFields";
import { ImageBlockFields } from "@/features/email-editor/ui/block-editors/ImageBlockFields";
import { ButtonBlockFields } from "@/features/email-editor/ui/block-editors/ButtonBlockFields";
import { DividerBlockFields } from "@/features/email-editor/ui/block-editors/DividerBlockFields";
import { SpacerBlockFields } from "@/features/email-editor/ui/block-editors/SpacerBlockFields";
import { SocialBlockFields } from "@/features/email-editor/ui/block-editors/SocialBlockFields";
import { FooterBlockFields } from "@/features/email-editor/ui/block-editors/FooterBlockFields";
import { VideoBlockFields } from "@/features/email-editor/ui/block-editors/VideoBlockFields";
import { CountdownBlockFields } from "@/features/email-editor/ui/block-editors/CountdownBlockFields";
import { ProductBlockFields } from "@/features/email-editor/ui/block-editors/ProductBlockFields";

interface BlockEditorProps {
  block: EmailBlock;
  onUpdate: (content: Partial<BlockContent>) => void;
}

const editorByType = {
  header: HeaderBlockFields,
  text: TextBlockFields,
  image: ImageBlockFields,
  button: ButtonBlockFields,
  divider: DividerBlockFields,
  spacer: SpacerBlockFields,
  social: SocialBlockFields,
  footer: FooterBlockFields,
  video: VideoBlockFields,
  countdown: CountdownBlockFields,
  product: ProductBlockFields,
} satisfies Record<EmailBlock["type"], ComponentType<{ content: BlockContent; onUpdate: BlockEditorProps["onUpdate"] }>>;

export function BlockEditor({ block, onUpdate }: BlockEditorProps) {
  const EditorFields = editorByType[block.type];
  return <EditorFields content={block.content} onUpdate={onUpdate} />;
}
