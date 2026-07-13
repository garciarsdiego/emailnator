import { sanitizeHtml } from "@/lib/sanitizeHtml";
import type { BlockContent, EmailBlock } from "@/types/emailBuilder";

interface EmailMetadata {
  subject: string;
  preheader?: string;
  language?: string;
}

const CSS_LENGTH = /^\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw)?$/;
const CSS_COLOR = /^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\))$/i;

export function escapeEmailText(value: string | undefined): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function safeEmailUrl(value: string | undefined, fallback = "#"): string {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  if (candidate.startsWith("{{") && candidate.endsWith("}}")) return candidate;

  try {
    const url = new URL(candidate);
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol)
      ? escapeEmailText(candidate)
      : fallback;
  } catch {
    return candidate.startsWith("#") ? escapeEmailText(candidate) : fallback;
  }
}

function safeLength(value: string | undefined, fallback: string): string {
  return value && CSS_LENGTH.test(value.trim()) ? value.trim() : fallback;
}

function safeColor(value: string | undefined, fallback: string): string {
  return value && CSS_COLOR.test(value.trim()) ? value.trim() : fallback;
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match?.[1] ?? "";
}

function row(content: string, style = "padding: 10px 24px;"): string {
  return `<tr><td style="${style}">${content}</td></tr>`;
}

function renderBlock(block: EmailBlock): string {
  const content: BlockContent = block.content;

  switch (block.type) {
    case "header": {
      const logo = safeEmailUrl(content.logoUrl, "");
      const inner = logo
        ? `<img src="${logo}" alt="${escapeEmailText(content.brandName || "Logo da marca")}" width="180" style="display:block;max-width:180px;max-height:64px;width:auto;height:auto;margin:0 auto;border:0;">`
        : `<strong style="font-size:24px;line-height:1.2;color:#1f2924;">${escapeEmailText(content.brandName)}</strong>`;
      return row(inner, "padding: 28px 24px; text-align: center;");
    }

    case "text":
      return row(
        `<div style="font-size:${safeLength(content.fontSize, "16px")};font-weight:${content.fontWeight === "bold" ? "700" : "400"};text-align:${content.textAlign ?? "left"};color:${safeColor(content.color, "#29322e")};line-height:1.65;">${sanitizeHtml(content.text ?? "")}</div>`,
      );

    case "image": {
      const source = safeEmailUrl(content.imageUrl, "");
      if (!source) return "";
      return row(
        `<img src="${source}" alt="${escapeEmailText(content.altText)}" style="display:block;width:${safeLength(content.imageWidth, "100%")};max-width:100%;height:auto;margin:0 auto;border:0;">`,
        "padding: 12px 24px; text-align:center;",
      );
    }

    case "button":
      return row(
        `<a href="${safeEmailUrl(content.buttonUrl)}" style="display:inline-block;background:${safeColor(content.buttonColor, "#b75a3d")};color:${safeColor(content.buttonTextColor, "#ffffff")};padding:13px 24px;border-radius:${safeLength(content.buttonRadius, "6px")};font-weight:700;text-decoration:none;">${escapeEmailText(content.buttonText || "Abrir")}</a>`,
        "padding: 18px 24px; text-align:center;",
      );

    case "divider":
      return row(
        `<div style="height:1px;line-height:1px;background:${safeColor(content.dividerColor, "#dfe3df")};width:${safeLength(content.dividerWidth, "100%")};">&nbsp;</div>`,
        "padding: 14px 24px;",
      );

    case "spacer":
      return row("&nbsp;", `height:${safeLength(content.spacerHeight, "24px")};font-size:1px;line-height:1px;`);

    case "social": {
      const links = (content.socialLinks ?? [])
        .map(
          (link) =>
            `<a href="${safeEmailUrl(link.url)}" style="display:inline-block;margin:0 8px;color:#506057;text-decoration:underline;">${escapeEmailText(link.platform)}</a>`,
        )
        .join("");
      return row(links, "padding:18px 24px;text-align:center;font-size:13px;");
    }

    case "footer":
      return row(
        `<p style="margin:0 0 6px;font-weight:700;">${escapeEmailText(content.companyName)}</p><p style="margin:0 0 10px;">${escapeEmailText(content.address)}</p><a href="{{unsubscribe_url}}" style="color:#506057;text-decoration:underline;">${escapeEmailText(content.unsubscribeText || "Cancelar inscrição")}</a>`,
        "padding:24px;text-align:center;background:#edf0ec;color:#59645e;font-size:12px;line-height:1.5;",
      );

    case "video": {
      const videoUrl = safeEmailUrl(content.videoUrl);
      const youtubeId = extractYouTubeId(content.videoUrl ?? "");
      const thumbnail = safeEmailUrl(
        content.videoThumbnail ||
          (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : undefined),
        "",
      );
      const visual = thumbnail
        ? `<img src="${thumbnail}" alt="${escapeEmailText(content.videoTitle || "Abrir vídeo")}" style="display:block;width:100%;max-width:552px;height:auto;border:0;">`
        : `<span style="display:inline-block;padding:16px 22px;background:#edf0ec;color:#29322e;">Abrir vídeo</span>`;
      return row(
        `<a href="${videoUrl}" style="text-decoration:none;">${visual}</a>${content.videoTitle ? `<p style="margin:10px 0 0;text-align:center;color:#29322e;">${escapeEmailText(content.videoTitle)}</p>` : ""}`,
        "padding:18px 24px;",
      );
    }

    case "countdown":
      return row(
        `<p style="margin:0 0 6px;font-weight:700;">${escapeEmailText(content.countdownTitle || "Oferta por tempo limitado")}</p><p style="margin:0;font-size:20px;font-weight:700;">${escapeEmailText(content.countdownDate || "Consulte as condições")}</p>`,
        `padding:22px 24px;text-align:center;background:${safeColor(content.countdownBgColor, "#29322e")};color:${safeColor(content.countdownTextColor, "#ffffff")};`,
      );

    case "product": {
      const imageUrl = safeEmailUrl(content.productImage, "");
      return row(
        `${imageUrl ? `<img src="${imageUrl}" alt="${escapeEmailText(content.productName)}" style="display:block;width:100%;max-width:320px;height:auto;margin:0 auto 16px;border:0;">` : ""}<h3 style="margin:0 0 8px;font-size:19px;">${escapeEmailText(content.productName || "Produto")}</h3><p style="margin:0 0 12px;color:#59645e;line-height:1.5;">${escapeEmailText(content.productDescription)}</p><p style="margin:0 0 16px;"><strong style="font-size:20px;color:#2f6b4f;">${escapeEmailText(content.productPrice)}</strong>${content.productOldPrice ? ` <s style="color:#7b8580;">${escapeEmailText(content.productOldPrice)}</s>` : ""}</p><a href="${safeEmailUrl(content.productUrl)}" style="display:inline-block;background:#b75a3d;color:#ffffff;padding:12px 20px;border-radius:6px;font-weight:700;text-decoration:none;">Ver produto</a>`,
        "padding:22px 24px;text-align:center;",
      );
    }
  }
}

export function renderEmailDocument(blocks: EmailBlock[], metadata: EmailMetadata): string {
  const content = [...blocks]
    .sort((a, b) => a.position - b.position)
    .map(renderBlock)
    .join("\n");
  const language = /^[a-z]{2}(?:-[A-Z]{2})?$/.test(metadata.language ?? "")
    ? metadata.language
    : "pt-BR";

  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeEmailText(metadata.subject || "Email")}</title>
</head>
<body style="margin:0;padding:0;background:#e9ece8;font-family:Arial,Helvetica,sans-serif;color:#29322e;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeEmailText(metadata.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#e9ece8;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-collapse:collapse;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
