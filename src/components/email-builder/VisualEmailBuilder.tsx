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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Eye, Code, Trash2, Save, Monitor, Smartphone, Star } from "lucide-react";
import { toast } from "sonner";
import { EmailBlock } from "@/types/emailBuilder";
import { createBlocksFromEmailData } from "@/lib/htmlToBlocks";
import { cn } from "@/lib/utils";

export interface EmailContent {
  subject?: string;
  subjectResend?: string;
  preheader?: string;
  content?: string;
  cta?: string;
  brandName?: string;
  // Variations for selection
  subjectVariations?: string[];
  subjectResendVariations?: string[];
  preheaderVariations?: string[];
}

interface VisualEmailBuilderProps {
  initialBlocks?: EmailBlock[];
  initialContent?: EmailContent;
  onSave?: (blocks: EmailBlock[], html: string, metadata?: { subject: string; preheader: string; templateName?: string }) => void;
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

  const [previewMode, setPreviewMode] = useState<"edit" | "preview" | "html">("edit");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [subject, setSubject] = useState(initialContent?.subject || "");
  const [subjectResend, setSubjectResend] = useState(initialContent?.subjectResend || "");
  const [preheader, setPreheader] = useState(initialContent?.preheader || "");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Check if we have variations to show dropdowns
  const hasSubjectVariations = (initialContent?.subjectVariations?.length || 0) > 1;
  const hasSubjectResendVariations = (initialContent?.subjectResendVariations?.length || 0) > 1;
  const hasPreheaderVariations = (initialContent?.preheaderVariations?.length || 0) > 1;

  useEffect(() => {
    if (initialContent) {
      setSubject(initialContent.subject || "");
      setSubjectResend(initialContent.subjectResend || "");
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
  <title>${subject || 'Email'}</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .button { display: inline-block; text-decoration: none; font-weight: 500; }
    .social-icon { display: inline-block; width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; text-align: center; line-height: 32px; margin: 0 4px; }
    .countdown-box { display: inline-block; padding: 10px 15px; margin: 0 5px; border-radius: 8px; text-align: center; }
    .countdown-number { font-size: 24px; font-weight: bold; display: block; }
    .countdown-label { font-size: 10px; text-transform: uppercase; }
    .product-card { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .product-image { width: 100%; height: auto; }
    .product-info { padding: 15px; }
    .product-price { font-size: 20px; font-weight: bold; color: #22c55e; }
    .product-old-price { font-size: 14px; color: #999; text-decoration: line-through; margin-left: 8px; }
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
          <a href="${content.buttonUrl || '#'}" class="button" style="background-color: ${content.buttonColor || '#22c55e'}; color: ${content.buttonTextColor || '#ffffff'}; padding: 12px 24px; border-radius: ${content.buttonRadius || '8px'};">
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

      case "video":
        const thumbnailUrl = content.videoThumbnail || `https://img.youtube.com/vi/${extractYouTubeId(content.videoUrl || '')}/maxresdefault.jpg`;
        return `<div style="text-align: center; padding: 20px 0;">
          <a href="${content.videoUrl || '#'}" style="display: block; position: relative;">
            <img src="${thumbnailUrl}" alt="${content.videoTitle || 'Vídeo'}" style="max-width: 100%; border-radius: 8px;" />
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background: rgba(0,0,0,0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <div style="width: 0; height: 0; border-left: 20px solid white; border-top: 12px solid transparent; border-bottom: 12px solid transparent; margin-left: 5px;"></div>
            </div>
          </a>
          ${content.videoTitle ? `<p style="margin-top: 10px; font-weight: 500;">${content.videoTitle}</p>` : ''}
        </div>`;

      case "countdown":
        return `<div style="text-align: center; padding: 20px; background-color: ${content.countdownBgColor || '#6366f1'}; color: ${content.countdownTextColor || '#ffffff'}; border-radius: 8px;">
          <p style="margin: 0 0 15px 0; font-size: 16px;">${content.countdownTitle || 'Oferta termina em:'}</p>
          <div>
            <span class="countdown-box" style="background: rgba(255,255,255,0.2);">
              <span class="countdown-number">00</span>
              <span class="countdown-label">Dias</span>
            </span>
            <span class="countdown-box" style="background: rgba(255,255,255,0.2);">
              <span class="countdown-number">00</span>
              <span class="countdown-label">Horas</span>
            </span>
            <span class="countdown-box" style="background: rgba(255,255,255,0.2);">
              <span class="countdown-number">00</span>
              <span class="countdown-label">Min</span>
            </span>
            <span class="countdown-box" style="background: rgba(255,255,255,0.2);">
              <span class="countdown-number">00</span>
              <span class="countdown-label">Seg</span>
            </span>
          </div>
          <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">Termina em: ${content.countdownDate || ''}</p>
        </div>`;

      case "product":
        return `<div class="product-card" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; max-width: 300px; margin: 20px auto;">
          ${content.productImage ? `<img src="${content.productImage}" alt="${content.productName}" class="product-image" style="width: 100%; height: auto;" />` : '<div style="height: 200px; background: #f4f4f4; display: flex; align-items: center; justify-content: center; color: #999;">Sem imagem</div>'}
          <div class="product-info" style="padding: 15px;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px;">${content.productName || 'Nome do Produto'}</h3>
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #666;">${content.productDescription || ''}</p>
            <div style="margin-bottom: 15px;">
              <span class="product-price" style="font-size: 20px; font-weight: bold; color: #22c55e;">${content.productPrice || ''}</span>
              ${content.productOldPrice ? `<span class="product-old-price" style="font-size: 14px; color: #999; text-decoration: line-through; margin-left: 8px;">${content.productOldPrice}</span>` : ''}
            </div>
            <a href="${content.productUrl || '#'}" style="display: block; text-align: center; background: #6366f1; color: white; padding: 10px; border-radius: 6px; text-decoration: none; font-weight: 500;">Comprar Agora</a>
          </div>
        </div>`;

      default:
        return '';
    }
  };

  const extractYouTubeId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : '';
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
    if (showMetadataFields) {
      setShowSaveDialog(true);
    } else {
      const html = generateHTML();
      onSave?.(blocks, html, { subject, preheader });
    }
  };

  const handleConfirmSave = () => {
    const html = generateHTML();
    onSave?.(blocks, html, { subject, preheader, templateName: templateName || undefined });
    setShowSaveDialog(false);
    setTemplateName("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Metadata Fields */}
      {showMetadataFields && (
        <div className="p-3 border-b bg-muted/30 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Subject (1st Send) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="subject" className="text-xs font-medium">Assunto (1º Envio)</Label>
                {hasSubjectVariations && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {(initialContent?.subjectVariations?.indexOf(subject) ?? 0) + 1}/{initialContent?.subjectVariations?.length}
                  </span>
                )}
              </div>
              {hasSubjectVariations ? (
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione um assunto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {initialContent?.subjectVariations?.map((s, i) => (
                      <SelectItem key={i} value={s} className="text-sm">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Assunto do email..."
                  className="h-9"
                />
              )}
            </div>

            {/* Subject (Resend/A-B) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="subjectResend" className="text-xs font-medium">Assunto (Reenvio/A-B)</Label>
                {hasSubjectResendVariations && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {(initialContent?.subjectResendVariations?.indexOf(subjectResend) ?? 0) + 1}/{initialContent?.subjectResendVariations?.length}
                  </span>
                )}
              </div>
              {hasSubjectResendVariations ? (
                <Select value={subjectResend} onValueChange={setSubjectResend}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione um assunto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {initialContent?.subjectResendVariations?.map((s, i) => (
                      <SelectItem key={i} value={s} className="text-sm">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="subjectResend"
                  value={subjectResend}
                  onChange={(e) => setSubjectResend(e.target.value)}
                  placeholder="Assunto alternativo..."
                  className="h-9"
                />
              )}
            </div>

            {/* Preheader */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="preheader" className="text-xs font-medium">Pré-header</Label>
                {hasPreheaderVariations && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {(initialContent?.preheaderVariations?.indexOf(preheader) ?? 0) + 1}/{initialContent?.preheaderVariations?.length}
                  </span>
                )}
              </div>
              {hasPreheaderVariations ? (
                <Select value={preheader} onValueChange={setPreheader}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione um pré-header..." />
                  </SelectTrigger>
                  <SelectContent>
                    {initialContent?.preheaderVariations?.map((p, i) => (
                      <SelectItem key={i} value={p} className="text-sm">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="preheader"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="Texto de pré-visualização..."
                  className="h-9"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as typeof previewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="text-xs px-3 h-7">Editar</TabsTrigger>
              <TabsTrigger value="preview" className="text-xs px-3 h-7">
                <Eye className="h-3.5 w-3.5 mr-1" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="html" className="text-xs px-3 h-7">
                <Code className="h-3.5 w-3.5 mr-1" />
                HTML
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {previewMode === "preview" && (
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant={previewDevice === "desktop" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0 btn-animated"
                onClick={() => setPreviewDevice("desktop")}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewDevice === "mobile" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0 btn-animated"
                onClick={() => setPreviewDevice("mobile")}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          )}

        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs btn-animated" onClick={clearBlocks}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Limpar
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs btn-animated" onClick={handleExportHTML}>
            <Download className="h-3.5 w-3.5 mr-1" />
            HTML
          </Button>
          {onCancel && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          {onSave && (
            <Button size="sm" className="h-7 text-xs btn-primary-animated" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1" />
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
            <div className="w-44 border-r p-2 overflow-y-auto bg-muted/30">
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
            <div className="w-64 border-l p-3 overflow-y-auto bg-background">
              {selectedBlock ? (
                <BlockEditor
                  block={selectedBlock}
                  onUpdate={(content) => updateBlock(selectedBlock.id, content)}
                />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">Selecione um bloco para editar</p>
                  <p className="text-xs mt-2">ou arraste blocos da paleta</p>
                </div>
              )}
            </div>
          </>
        )}

        {previewMode === "preview" && (
          <div className="flex-1 p-4 overflow-auto bg-muted/20">
            <div className={cn(
              "mx-auto transition-all",
              previewDevice === "mobile" ? "max-w-[375px]" : "max-w-[600px]"
            )}>
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

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Salvar como Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome do template</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Email de Boas-vindas"
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg space-y-1">
              <p className="text-xs text-muted-foreground">Assunto:</p>
              <p className="text-sm font-medium">{subject || "(sem assunto)"}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
