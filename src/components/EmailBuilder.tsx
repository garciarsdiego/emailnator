import { Copy, Download, Check, RefreshCw, Code, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EmailOptionsSelector } from "./EmailOptionsSelector";
import { RichTextEditor } from "./RichTextEditor";

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
}

interface EmailOptions {
  subjects: string[];
  subjectsResend: string[];
  preheaders: string[];
  ctas: string[];
  content: string;
  tips: string[];
  brandColors?: BrandColors;
  brandName?: string;
}

interface EmailBuilderProps {
  options: EmailOptions;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function EmailBuilder({ options, onRegenerate, isRegenerating }: EmailBuilderProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>(options.subjects[0] || "");
  const [selectedSubjectResend, setSelectedSubjectResend] = useState<string>(options.subjectsResend[0] || "");
  const [selectedPreheader, setSelectedPreheader] = useState<string>(options.preheaders[0] || "");
  const [selectedCta, setSelectedCta] = useState<string>(options.ctas[0] || "");
  const [editableContent, setEditableContent] = useState<string>(options.content);
  const [editorMode, setEditorMode] = useState<"rich" | "html">("rich");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSelectedSubject(options.subjects[0] || "");
    setSelectedSubjectResend(options.subjectsResend[0] || "");
    setSelectedPreheader(options.preheaders[0] || "");
    setSelectedCta(options.ctas[0] || "");
    setEditableContent(options.content);
  }, [options]);

  const { brandColors, brandName, tips } = options;

  const primaryColor = brandColors?.primary && brandColors.primary !== "null" 
    ? brandColors.primary 
    : "#6366f1";
  const backgroundColor = brandColors?.background && brandColors.background !== "null" 
    ? brandColors.background 
    : "#ffffff";
  const accentColor = brandColors?.accent && brandColors.accent !== "null" 
    ? brandColors.accent 
    : primaryColor;

  const isLightColor = (color: string) => {
    if (!color || !color.startsWith("#")) return true;
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  const buttonTextColor = isLightColor(primaryColor) ? "#000000" : "#ffffff";
  const bgTextColor = isLightColor(backgroundColor) ? "#333333" : "#ffffff";

  const htmlToPlainText = (html: string) => {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .trim();
  };

  const handleCopy = async () => {
    const fullEmail = `Assunto: ${selectedSubject}\n\nAssunto Reenvio/A/B: ${selectedSubjectResend}\n\nPré-header: ${selectedPreheader}\n\n${htmlToPlainText(editableContent)}\n\nCTA: ${selectedCta}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    toast.success("Email copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${selectedSubject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: ${bgTextColor}; max-width: 600px; margin: 0 auto; padding: 20px; background-color: ${backgroundColor}; }
    .cta-button { display: inline-block; background: ${primaryColor}; color: ${buttonTextColor}; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .header { border-bottom: 3px solid ${primaryColor}; padding-bottom: 16px; margin-bottom: 24px; }
    .brand-name { color: ${primaryColor}; font-size: 24px; font-weight: bold; }
    a { color: ${accentColor}; }
  </style>
</head>
<body>
  ${brandName ? `<div class="header"><span class="brand-name">${brandName}</span></div>` : ""}
  ${editableContent}
  <div style="text-align: center;">
    <a href="#" class="cta-button">${selectedCta}</a>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email-campanha.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML baixado!");
  };

  const isComplete = selectedSubject && selectedPreheader && selectedCta;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6 h-full">
      {/* Left Column - Options & Editor */}
      <div className="space-y-4 overflow-y-auto">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Montar Email</h2>
            <p className="text-sm text-muted-foreground">
              Selecione as opções e edite o conteúdo
            </p>
          </div>
          <div className="flex gap-2">
            {onRegenerate && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
                Regenerar
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy}
              disabled={!isComplete}
            >
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              Copiar
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleDownloadHTML}
              disabled={!isComplete}
            >
              <Download className="h-4 w-4 mr-1" />
              Baixar HTML
            </Button>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <EmailOptionsSelector
                label="📧 Assunto (Primeiro Envio)"
                options={options.subjects}
                selected={selectedSubject}
                onSelect={setSelectedSubject}
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <EmailOptionsSelector
                label="🔄 Assunto (Reenvio / A/B)"
                options={options.subjectsResend}
                selected={selectedSubjectResend}
                onSelect={setSelectedSubjectResend}
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <EmailOptionsSelector
                label="👁️ Pré-Header"
                options={options.preheaders}
                selected={selectedPreheader}
                onSelect={setSelectedPreheader}
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <EmailOptionsSelector
                label="🎯 CTA"
                options={options.ctas}
                selected={selectedCta}
                onSelect={setSelectedCta}
              />
            </CardContent>
          </Card>
        </div>

        {/* Content Editor */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">✏️ Conteúdo do Email</CardTitle>
              <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as "rich" | "html")}>
                <TabsList className="h-8">
                  <TabsTrigger value="rich" className="text-xs px-3 h-7">
                    <Type className="h-3 w-3 mr-1" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="html" className="text-xs px-3 h-7">
                    <Code className="h-3 w-3 mr-1" />
                    HTML
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {editorMode === "rich" ? (
              <RichTextEditor
                content={editableContent}
                onChange={setEditableContent}
              />
            ) : (
              <Textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="min-h-[250px] font-mono text-sm"
                placeholder="<p>Seu conteúdo HTML aqui...</p>"
              />
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        {tips && tips.length > 0 && (
          <Card className="glass-card border-accent/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-accent">💡 Dicas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-accent">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Live Preview */}
      <div className="lg:sticky lg:top-0 lg:h-fit">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Preview</CardTitle>
              {brandColors && (
                <div className="flex items-center gap-1.5">
                  {Object.entries(brandColors).map(([key, value]) => {
                    if (!value || value === "null" || !value.startsWith("#")) return null;
                    return (
                      <div
                        key={key}
                        className="h-4 w-4 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: value }}
                        title={`${key}: ${value}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            {brandName && (
              <p className="text-sm text-muted-foreground">{brandName}</p>
            )}
          </CardHeader>
          <CardContent>
            <div 
              className="rounded-lg border border-border overflow-hidden"
              style={{ backgroundColor }}
            >
              {/* Brand Header */}
              {brandName && (
                <div 
                  className="px-4 py-3 border-b-2"
                  style={{ borderColor: primaryColor }}
                >
                  <span 
                    className="font-bold"
                    style={{ color: primaryColor }}
                  >
                    {brandName}
                  </span>
                </div>
              )}

              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {/* Subject & Preheader */}
                <div className="space-y-2 pb-3 border-b" style={{ borderColor: `${primaryColor}20` }}>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: `${bgTextColor}60` }}>
                      Assunto
                    </p>
                    <p className="font-semibold text-sm" style={{ color: bgTextColor }}>
                      {selectedSubject || <span className="opacity-40 italic">Selecione...</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: `${bgTextColor}60` }}>
                      Pré-header
                    </p>
                    <p className="text-xs" style={{ color: `${bgTextColor}80` }}>
                      {selectedPreheader || <span className="opacity-40 italic">Selecione...</span>}
                    </p>
                  </div>
                </div>

                {/* Email Content */}
                <div
                  className="prose prose-sm max-w-none text-sm"
                  style={{ color: bgTextColor }}
                  dangerouslySetInnerHTML={{ __html: editableContent }}
                />

                {/* CTA Button */}
                <div className="pt-4 text-center">
                  <span 
                    className="inline-block rounded-lg px-5 py-2.5 text-sm font-semibold"
                    style={{ 
                      backgroundColor: primaryColor, 
                      color: buttonTextColor,
                      boxShadow: `0 4px 14px ${primaryColor}40`
                    }}
                  >
                    {selectedCta || "Selecione um CTA..."}
                  </span>
                </div>
              </div>
            </div>

            {!isComplete && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Complete as seleções para finalizar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
