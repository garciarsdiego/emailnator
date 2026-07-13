import { useState, useEffect } from "react";
import { useEmailBlocks } from "@/hooks/useEmailBlocks";
import { toast } from "sonner";
import type { EmailBlock } from "@/types/emailBuilder";
import { createBlocksFromEmailData } from "@/lib/htmlToBlocks";
import { renderEmailDocument } from "@/features/email-editor/lib/renderEmailDocument";
import type { EmailContent } from "@/features/email-editor/model/emailDocument";
import type { EditorMode, PreviewDevice } from "@/features/email-editor/model/editorView";
import { EmailMetadataFields } from "@/features/email-editor/ui/EmailMetadataFields";
import { EmailEditorToolbar } from "@/features/email-editor/ui/EmailEditorToolbar";
import { EmailEditorWorkspace } from "@/features/email-editor/ui/EmailEditorWorkspace";
import { SaveEmailDialog } from "@/features/email-editor/ui/SaveEmailDialog";

export type { EmailContent } from "@/features/email-editor/model/emailDocument";

interface VisualEmailBuilderProps {
  initialBlocks?: EmailBlock[];
  initialContent?: EmailContent;
  onSave?: (blocks: EmailBlock[], html: string, metadata?: { subject: string; preheader: string; templateName?: string }) => Promise<void> | void;
  onCancel?: () => void;
  showMetadataFields?: boolean;
}

export function VisualEmailBuilder({ 
  initialBlocks, 
  initialContent,
  onSave, 
  onCancel,
  showMetadataFields = false,
}: VisualEmailBuilderProps) {
  const getInitialBlocks = () => {
    if (initialBlocks) return initialBlocks;
    if (initialContent?.content) {
      return createBlocksFromEmailData(initialContent);
    }
    return [];
  };

  const {
    blocks,
    selectedBlockId,
    selectedBlock,
    setSelectedBlockId,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    duplicateBlock,
    clearBlocks,
  } = useEmailBlocks(getInitialBlocks());

  const [previewMode, setPreviewMode] = useState<EditorMode>("edit");
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [subject, setSubject] = useState(initialContent?.subject || "");
  const [subjectResend, setSubjectResend] = useState(initialContent?.subjectResend || "");
  const [preheader, setPreheader] = useState(initialContent?.preheader || "");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialContent) {
      setSubject(initialContent.subject || "");
      setSubjectResend(initialContent.subjectResend || "");
      setPreheader(initialContent.preheader || "");
    }
  }, [initialContent]);

  const generateHTML = (): string =>
    renderEmailDocument(blocks, { subject, preheader });

  const handleExportHTML = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML exportado com sucesso!");
  };

  const persistDocument = async (metadata: { subject: string; preheader: string; templateName?: string }) => {
    setIsSaving(true);
    try {
      await onSave?.(blocks, generateHTML(), metadata);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o email.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (showMetadataFields) {
      setShowSaveDialog(true);
    } else {
      await persistDocument({ subject, preheader });
    }
  };

  const handleConfirmSave = async () => {
    const saved = await persistDocument({
      subject,
      preheader,
      templateName: templateName.trim() || undefined,
    });
    if (saved) {
      setShowSaveDialog(false);
      setTemplateName("");
    }
  };

  const html = generateHTML();

  return (
    <div className="flex h-full flex-col">
      {showMetadataFields && (
        <EmailMetadataFields
          initialContent={initialContent}
          subject={subject}
          subjectResend={subjectResend}
          preheader={preheader}
          onSubjectChange={setSubject}
          onSubjectResendChange={setSubjectResend}
          onPreheaderChange={setPreheader}
        />
      )}
      <EmailEditorToolbar
        mode={previewMode}
        device={previewDevice}
        isSaving={isSaving}
        canSave={Boolean(onSave)}
        canCancel={Boolean(onCancel)}
        onModeChange={setPreviewMode}
        onDeviceChange={setPreviewDevice}
        onClear={clearBlocks}
        onExport={handleExportHTML}
        onCancel={() => onCancel?.()}
        onSave={() => void handleSave()}
      />
      <EmailEditorWorkspace
        mode={previewMode}
        device={previewDevice}
        blocks={blocks}
        selectedBlockId={selectedBlockId}
        selectedBlock={selectedBlock}
        html={html}
        onAddBlock={addBlock}
        onSelectBlock={setSelectedBlockId}
        onMoveBlock={moveBlock}
        onRemoveBlock={removeBlock}
        onDuplicateBlock={duplicateBlock}
        onUpdateBlock={updateBlock}
      />
      <SaveEmailDialog
        open={showSaveDialog}
        isSaving={isSaving}
        subject={subject}
        templateName={templateName}
        onOpenChange={setShowSaveDialog}
        onTemplateNameChange={setTemplateName}
        onConfirm={() => void handleConfirmSave()}
      />
    </div>
  );
}
