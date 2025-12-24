import { Copy, Download, Check, RefreshCw, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EmailOptionsSelector } from "./EmailOptionsSelector";

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
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Update state when options change
  useEffect(() => {
    setSelectedSubject(options.subjects[0] || "");
    setSelectedSubjectResend(options.subjectsResend[0] || "");
    setSelectedPreheader(options.preheaders[0] || "");
    setSelectedCta(options.ctas[0] || "");
    setEditableContent(options.content);
  }, [options]);

  const { brandColors, brandName, tips } = options;

  // Resolve colors
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

  // Convert HTML to plain text for editing
  const htmlToPlainText = (html: string) => {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .trim();
  };

  // Convert plain text back to simple HTML
  const plainTextToHtml = (text: string) => {
    return text
      .split("\n\n")
      .map(paragraph => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
      .join("");
  };

  const handleCopy = async () => {
    const fullEmail = `Assunto: ${selectedSubject}\n\nAssunto Reenvio/A/B: ${selectedSubjectResend}\n\nPré-header: ${selectedPreheader}\n\n${htmlToPlainText(editableContent)}\n\nCTA: ${selectedCta}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    toast.success("Email copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHTML = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${selectedSubject}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: ${bgTextColor}; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px;
      background-color: ${backgroundColor};
    }
    .cta-button { 
      display: inline-block; 
      background: ${primaryColor}; 
      color: ${buttonTextColor}; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: bold; 
      margin: 20px 0; 
    }
    .header {
      border-bottom: 3px solid ${primaryColor};
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand-name {
      color: ${primaryColor};
      font-size: 24px;
      font-weight: bold;
    }
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
    toast.success("HTML do email baixado!");
  };

  const isComplete = selectedSubject && selectedPreheader && selectedCta;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Options Selection */}
      <div className="space-y-6">
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Montar Email</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique nas opções abaixo
                </p>
              </div>
              {onRegenerate && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
                  Novas Opções
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <EmailOptionsSelector
              label="📧 Assunto (Primeiro Envio)"
              options={options.subjects}
              selected={selectedSubject}
              onSelect={setSelectedSubject}
            />

            <EmailOptionsSelector
              label="🔄 Assunto (Reenvio / Teste A/B)"
              options={options.subjectsResend}
              selected={selectedSubjectResend}
              onSelect={setSelectedSubjectResend}
            />

            <EmailOptionsSelector
              label="👁️ Pré-Header"
              options={options.preheaders}
              selected={selectedPreheader}
              onSelect={setSelectedPreheader}
            />

            <EmailOptionsSelector
              label="🎯 CTA (Call-to-Action)"
              options={options.ctas}
              selected={selectedCta}
              onSelect={setSelectedCta}
            />
          </CardContent>
        </Card>

        {/* Tips */}
        {tips && tips.length > 0 && (
          <Card className="glass-card border-accent/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-accent flex items-center gap-2">
                💡 Dicas de Otimização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
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

      {/* Right Column - Email Preview */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg">Preview</CardTitle>
              {brandName && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">{brandName}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
                disabled={!isComplete}
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadHTML}
                disabled={!isComplete}
              >
                <Download className="h-4 w-4 mr-1" />
                HTML
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color palette indicator */}
            {brandColors && (
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Cores:</span>
                <div className="flex gap-1">
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
              </div>
            )}

            {/* Email preview with brand styling */}
            <div 
              className="rounded-lg border border-border overflow-hidden max-h-[70vh] overflow-y-auto"
              style={{ backgroundColor }}
            >
              {brandName && (
                <div 
                  className="px-4 py-3 border-b"
                  style={{ borderColor: primaryColor }}
                >
                  <span 
                    className="font-bold text-lg"
                    style={{ color: primaryColor }}
                  >
                    {brandName}
                  </span>
                </div>
              )}

              <div className="p-4">
                <div className="mb-4 pb-4 border-b" style={{ borderColor: `${primaryColor}20` }}>
                  <p className="text-xs mb-1" style={{ color: `${bgTextColor}80` }}>Assunto:</p>
                  <p className="font-semibold" style={{ color: bgTextColor }}>
                    {selectedSubject || <span className="opacity-50 italic">Selecione...</span>}
                  </p>
                  <p className="text-xs mt-2 mb-1" style={{ color: `${bgTextColor}80` }}>Pré-header:</p>
                  <p className="text-sm" style={{ color: `${bgTextColor}99` }}>
                    {selectedPreheader || <span className="opacity-50 italic">Selecione...</span>}
                  </p>
                </div>

                {/* Editable Content */}
                <div className="relative group">
                  {isEditingContent ? (
                    <div className="space-y-2">
                      <Textarea
                        value={htmlToPlainText(editableContent)}
                        onChange={(e) => setEditableContent(plainTextToHtml(e.target.value))}
                        className="min-h-[200px] text-sm"
                        style={{ color: bgTextColor }}
                      />
                      <Button 
                        size="sm" 
                        onClick={() => setIsEditingContent(false)}
                      >
                        Salvar Alterações
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div
                        className="prose prose-sm max-w-none cursor-pointer hover:bg-primary/5 rounded p-2 -m-2 transition-colors"
                        style={{ color: bgTextColor }}
                        dangerouslySetInnerHTML={{ __html: editableContent }}
                        onClick={() => setIsEditingContent(true)}
                      />
                      <button
                        onClick={() => setIsEditingContent(true)}
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-primary/10 hover:bg-primary/20"
                        title="Editar conteúdo"
                      >
                        <Edit3 className="h-4 w-4 text-primary" />
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-6 text-center">
                  <button 
                    className="inline-block rounded-lg px-6 py-3 font-semibold transition-transform hover:scale-105"
                    style={{ 
                      backgroundColor: primaryColor, 
                      color: buttonTextColor,
                      boxShadow: `0 4px 14px ${primaryColor}40`
                    }}
                  >
                    {selectedCta || "Selecione um CTA..."}
                  </button>
                </div>
              </div>
            </div>

            {!isComplete && (
              <p className="text-xs text-muted-foreground text-center py-1">
                Selecione assunto, pré-header e CTA para finalizar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}