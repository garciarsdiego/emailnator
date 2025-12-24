import { Copy, Download, Check, RefreshCw, Code, Type, Eye, EyeOff } from "lucide-react";
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
  const [showPreview, setShowPreview] = useState(true);
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

  // Sanitize HTML for preview - remove prose classes interference
  const sanitizeHtmlForPreview = (html: string) => {
    return html
      .replace(/<p>/g, `<p style="margin: 0 0 1em 0; color: ${bgTextColor};">`)
      .replace(/<ul>/g, `<ul style="margin: 0.5em 0; padding-left: 1.5em; color: ${bgTextColor};">`)
      .replace(/<ol>/g, `<ol style="margin: 0.5em 0; padding-left: 1.5em; color: ${bgTextColor};">`)
      .replace(/<li>/g, `<li style="margin: 0.25em 0;">`)
      .replace(/<strong>/g, `<strong style="font-weight: 600;">`)
      .replace(/<a /g, `<a style="color: ${accentColor}; text-decoration: underline;" `);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with actions - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 flex-shrink-0">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Montar Email</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Selecione as opções e edite o conteúdo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden lg:flex"
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? "Ocultar" : "Preview"}
          </Button>
          {onRegenerate && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""} sm:mr-2`} />
              <span className="hidden sm:inline">Regenerar</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            disabled={!isComplete}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline sm:ml-1">Copiar</span>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleDownloadHTML}
            disabled={!isComplete}
          >
            <Download className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">HTML</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area - responsive grid */}
      <div className={`flex-1 min-h-0 grid gap-4 lg:gap-6 ${showPreview ? 'lg:grid-cols-[1fr,340px] xl:grid-cols-[1fr,380px]' : 'grid-cols-1'}`}>
        {/* Left Column - Options & Editor */}
        <div className="overflow-y-auto space-y-3 sm:space-y-4 pr-1">
          {/* Options Grid - Responsive: 1 col mobile, 2 cols tablet+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Card className="glass-card">
              <CardContent className="p-2.5 sm:p-3">
                <EmailOptionsSelector
                  label="📧 Assunto (1º Envio)"
                  options={options.subjects}
                  selected={selectedSubject}
                  onSelect={setSelectedSubject}
                />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-2.5 sm:p-3">
                <EmailOptionsSelector
                  label="🔄 Assunto (Reenvio)"
                  options={options.subjectsResend}
                  selected={selectedSubjectResend}
                  onSelect={setSelectedSubjectResend}
                />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-2.5 sm:p-3">
                <EmailOptionsSelector
                  label="👁️ Pré-Header"
                  options={options.preheaders}
                  selected={selectedPreheader}
                  onSelect={setSelectedPreheader}
                />
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-2.5 sm:p-3">
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
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">✏️ Conteúdo do Email</CardTitle>
                <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as "rich" | "html")}>
                  <TabsList className="h-7">
                    <TabsTrigger value="rich" className="text-xs px-2.5 h-6">
                      <Type className="h-3 w-3 mr-1" />
                      Visual
                    </TabsTrigger>
                    <TabsTrigger value="html" className="text-xs px-2.5 h-6">
                      <Code className="h-3 w-3 mr-1" />
                      HTML
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {editorMode === "rich" ? (
                <RichTextEditor
                  content={editableContent}
                  onChange={setEditableContent}
                />
              ) : (
                <Textarea
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  className="min-h-[180px] font-mono text-xs"
                  placeholder="<p>Seu conteúdo HTML aqui...</p>"
                />
              )}
            </CardContent>
          </Card>

          {/* Tips - Compact & Responsive */}
          {tips && tips.length > 0 && (
            <Card className="glass-card border-accent/30">
              <CardContent className="p-2.5 sm:p-3">
                <p className="text-xs font-medium text-accent mb-2">💡 Dicas</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {tips.map((tip, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-accent shrink-0">•</span>
                      <span className="line-clamp-2">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Mobile/Tablet Preview - visible below lg */}
          <div className="lg:hidden">
            <Card className="glass-card">
              <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Preview</CardTitle>
                  {brandColors && (
                    <div className="flex items-center gap-1">
                      {Object.entries(brandColors).map(([key, value]) => {
                        if (!value || value === "null" || !value.startsWith("#")) return null;
                        return (
                          <div
                            key={key}
                            className="h-3 w-3 rounded-full border border-border"
                            style={{ backgroundColor: value }}
                            title={`${key}: ${value}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <div 
                  className="rounded-lg border border-border overflow-hidden text-sm"
                  style={{ backgroundColor }}
                >
                  {brandName && (
                    <div className="px-3 py-2 border-b-2" style={{ borderColor: primaryColor }}>
                      <span className="font-bold text-sm" style={{ color: primaryColor }}>{brandName}</span>
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    <div className="space-y-1 pb-2 border-b" style={{ borderColor: `${primaryColor}20` }}>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: `${bgTextColor}60` }}>Assunto</p>
                      <p className="font-semibold text-xs" style={{ color: bgTextColor }}>
                        {selectedSubject || <span className="opacity-40 italic">Selecione...</span>}
                      </p>
                    </div>
                    <div 
                      className="text-xs leading-relaxed [&>*]:!m-0 [&>*]:!mb-2"
                      style={{ color: bgTextColor }}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(editableContent) }}
                    />
                    <div className="pt-2 text-center">
                      <span 
                        className="inline-block rounded-md px-4 py-1.5 text-xs font-semibold"
                        style={{ backgroundColor: primaryColor, color: buttonTextColor }}
                      >
                        {selectedCta || "CTA"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Live Preview (lg+ only) */}
        {showPreview && (
          <div className="hidden lg:block overflow-y-auto">
            <Card className="glass-card h-full">
              <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Preview</CardTitle>
                  {brandColors && (
                    <div className="flex items-center gap-1">
                      {Object.entries(brandColors).map(([key, value]) => {
                        if (!value || value === "null" || !value.startsWith("#")) return null;
                        return (
                          <div
                            key={key}
                            className="h-3.5 w-3.5 rounded-full border border-border shadow-sm"
                            style={{ backgroundColor: value }}
                            title={`${key}: ${value}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                {brandName && (
                  <p className="text-xs text-muted-foreground">{brandName}</p>
                )}
              </CardHeader>
              <CardContent className="px-4 pb-4 flex-1 overflow-hidden">
                <div 
                  className="rounded-lg border border-border overflow-hidden h-full flex flex-col"
                  style={{ backgroundColor }}
                >
                  {/* Brand Header */}
                  {brandName && (
                    <div 
                      className="px-4 py-2.5 border-b-2 flex-shrink-0"
                      style={{ borderColor: primaryColor }}
                    >
                      <span className="font-bold text-sm" style={{ color: primaryColor }}>
                        {brandName}
                      </span>
                    </div>
                  )}

                  <div className="p-4 space-y-3 overflow-y-auto flex-1">
                    {/* Subject & Preheader */}
                    <div className="space-y-1.5 pb-3 border-b" style={{ borderColor: `${primaryColor}20` }}>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: `${bgTextColor}60` }}>
                          Assunto
                        </p>
                        <p className="font-semibold text-sm leading-snug" style={{ color: bgTextColor }}>
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

                    {/* Email Content - Without prose to prevent style conflicts */}
                    <div
                      className="text-sm leading-relaxed [&>*]:!m-0 [&>*]:!mb-3 [&_ul]:!pl-5 [&_ol]:!pl-5 [&_li]:!mb-1"
                      style={{ color: bgTextColor, fontFamily: 'Arial, sans-serif' }}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(editableContent) }}
                    />

                    {/* CTA Button */}
                    <div className="pt-3 text-center">
                      <span 
                        className="inline-block rounded-lg px-5 py-2 text-sm font-semibold"
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
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Complete as seleções para finalizar
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
