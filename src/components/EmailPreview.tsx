import { Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

interface EmailPreviewProps {
  subject: string;
  preheader: string;
  content: string;
  ctaText: string;
  tips: string[];
}

export function EmailPreview({ subject, preheader, content, ctaText, tips }: EmailPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const fullEmail = `Assunto: ${subject}\n\nPré-header: ${preheader}\n\n${content.replace(/<[^>]*>/g, "")}`;
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
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .cta-button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  ${content}
  <a href="#" class="cta-button">${ctaText}</a>
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

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Preview do Email</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadHTML}>
              <Download className="h-4 w-4 mr-1" />
              HTML
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-4 border-b border-border pb-4">
              <p className="text-xs text-muted-foreground mb-1">Assunto:</p>
              <p className="font-semibold text-foreground">{subject}</p>
              <p className="text-xs text-muted-foreground mt-2 mb-1">Pré-header:</p>
              <p className="text-sm text-muted-foreground">{preheader}</p>
            </div>
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: content }}
            />
            <div className="mt-6 text-center">
              <button className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground">
                {ctaText}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {tips.length > 0 && (
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
  );
}
