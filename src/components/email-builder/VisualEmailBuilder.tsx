import { useState, useEffect } from "react";
import { useEmailBlocks } from "@/hooks/useEmailBlocks";
import { BlockPalette } from "./BlockPalette";
import { BlockEditor } from "./BlockEditor";
import { EmailCanvas } from "./EmailCanvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Eye, Code, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { EmailBlock } from "@/types/emailBuilder";
import { createBlocksFromEmailData } from "@/lib/htmlToBlocks";

export interface EmailContent {
  subject?: string;
  preheader?: string;
  content?: string;
  cta?: string;
  brandName?: string;
}

interface VisualEmailBuilderProps {
  initialBlocks?: EmailBlock[];
  initialContent?: EmailContent;
  onSave?: (blocks: EmailBlock[], html: string, metadata?: { subject: string; preheader: string }) => void;
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
  // Convert initial content to blocks if provided
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

  const [previewMode, setPreviewMode] = useState<"edit" | "preview" | "html">("edit");
  const [subject, setSubject] = useState(initialContent?.subject || "");
  const [preheader, setPreheader] = useState(initialContent?.preheader || "");

  // Update subject/preheader if initialContent changes
  useEffect(() => {
    if (initialContent) {
      setSubject(initialContent.subject || "");
      setPreheader(initialContent.preheader || "");
    }
  }, [initialContent]);

  const generateHTML = (): string => {
    const bodyContent = blocks.map((block) => generateBlockHTML(block)).join("\n");
    
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .button { display: inline-block; text-decoration: none; font-weight: 500; }
    .social-icon { display: inline-block; width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; text-align: center; line-height: 32px; margin: 0 4px; }
  </style>
</head>
<body>
  <div class="email-container" style="padding: 20px;">
    ${bodyContent}
  </div>
</body>
</html>`;
  };

  const generateBlockHTML = (block: EmailBlock): string => {
    const { type, content } = block;

    switch (type) {
      case "header":
        return `<div style="text-align: center; padding: 20px 0;">
          ${content.logoUrl 
            ? `<img src="${content.logoUrl}" alt="${content.brandName || 'Logo'}" style="max-height: 60px;" />` 
            : `<h1 style="margin: 0; font-size: 24px;">${content.brandName || ''}</h1>`}
        </div>`;

      case "text":
        return `<div style="font-size: ${content.fontSize}; font-weight: ${content.fontWeight}; text-align: ${content.textAlign}; color: ${content.color}; padding: 10px 0;">
          ${content.text || ''}
        </div>`;

      case "image":
        return content.imageUrl 
          ? `<div style="text-align: center; padding: 10px 0;">
              <img src="${content.imageUrl}" alt="${content.altText || ''}" style="max-width: ${content.imageWidth}; height: auto;" />
            </div>`
          : '';

      case "button":
        return `<div style="text-align: center; padding: 20px 0;">
          <a href="${content.buttonUrl || '#'}" class="button" style="background-color: ${content.buttonColor}; color: ${content.buttonTextColor}; padding: 12px 24px; border-radius: ${content.buttonRadius};">
            ${content.buttonText || 'Clique Aqui'}
          </a>
        </div>`;

      case "divider":
        return `<hr style="border: none; border-top: 1px solid ${content.dividerColor}; width: ${content.dividerWidth}; margin: 20px auto;" />`;

      case "spacer":
        return `<div style="height: ${content.spacerHeight};"></div>`;

      case "social":
        const icons = content.socialLinks?.map(link => 
          `<a href="${link.url}" class="social-icon" style="text-decoration: none; color: #666;">${link.platform.slice(0,2).toUpperCase()}</a>`
        ).join('') || '';
        return `<div style="text-align: center; padding: 20px 0;">${icons}</div>`;

      case "footer":
        return `<div style="text-align: center; padding: 20px; background-color: #f4f4f4; font-size: 12px; color: #666;">
          <p style="margin: 0; font-weight: 500;">${content.companyName || ''}</p>
          <p style="margin: 5px 0;">${content.address || ''}</p>
          <p style="margin: 10px 0;"><a href="#" style="color: #666;">${content.unsubscribeText || 'Cancelar inscrição'}</a></p>
        </div>`;

      default:
        return '';
    }
  };

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

  const handleSave = () => {
    const html = generateHTML();
    onSave?.(blocks, html, { subject, preheader });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Metadata Fields */}
      {showMetadataFields && (
        <div className="p-3 border-b bg-muted/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-medium">Assunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Assunto do email..."
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preheader" className="text-xs font-medium">Pré-header</Label>
              <Input
                id="preheader"
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                placeholder="Texto de pré-visualização..."
                className="h-9"
              />
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as typeof previewMode)}>
            <TabsList>
              <TabsTrigger value="edit">Editar</TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="html">
                <Code className="h-4 w-4 mr-1" />
                HTML
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearBlocks}>
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportHTML}>
            <Download className="h-4 w-4 mr-1" />
            Exportar HTML
          </Button>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          {onSave && (
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {previewMode === "edit" && (
          <>
            {/* Left sidebar - Block palette */}
            <div className="w-48 border-r p-3 overflow-y-auto bg-muted/30">
              <BlockPalette onAddBlock={addBlock} />
            </div>

            {/* Center - Canvas */}
            <div className="flex-1 p-4 overflow-auto bg-muted/20">
              <EmailCanvas
                blocks={blocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onMoveBlock={moveBlock}
                onRemoveBlock={removeBlock}
                onDuplicateBlock={duplicateBlock}
              />
            </div>

            {/* Right sidebar - Block editor */}
            <div className="w-72 border-l p-4 overflow-y-auto bg-background">
              {selectedBlock ? (
                <BlockEditor
                  block={selectedBlock}
                  onUpdate={(content) => updateBlock(selectedBlock.id, content)}
                />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>Selecione um bloco para editar</p>
                </div>
              )}
            </div>
          </>
        )}

        {previewMode === "preview" && (
          <div className="flex-1 p-4 overflow-auto bg-muted/20">
            <div className="max-w-[600px] mx-auto">
              <Card className="overflow-hidden">
                <iframe
                  srcDoc={generateHTML()}
                  className="w-full min-h-[600px] border-0"
                  title="Email Preview"
                />
              </Card>
            </div>
          </div>
        )}

        {previewMode === "html" && (
          <div className="flex-1 p-4 overflow-auto">
            <Card className="p-4">
              <pre className="text-sm overflow-auto max-h-[600px] bg-muted p-4 rounded">
                <code>{generateHTML()}</code>
              </pre>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
