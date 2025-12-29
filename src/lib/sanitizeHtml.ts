import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Only allows safe HTML tags and attributes commonly used in emails.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'span', 'div', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
      'img', 'hr', 'blockquote', 'pre', 'code'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'style', 'class', 'target', 'rel',
      'width', 'height', 'align', 'valign', 'border', 'cellpadding', 'cellspacing'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
  });
}

/**
 * Sanitizes HTML and applies email-safe inline styling transformations.
 * Use this for email preview content.
 */
export function sanitizeEmailHtml(html: string, styleOptions?: {
  textColor?: string;
  accentColor?: string;
}): string {
  const sanitized = sanitizeHtml(html);
  
  if (!styleOptions) return sanitized;
  
  const { textColor = '#333333', accentColor = '#6366f1' } = styleOptions;
  
  return sanitized
    .replace(/<p>/g, `<p style="margin: 0 0 1em 0; color: ${textColor};">`)
    .replace(/<ul>/g, `<ul style="margin: 0.5em 0; padding-left: 1.5em; color: ${textColor};">`)
    .replace(/<ol>/g, `<ol style="margin: 0.5em 0; padding-left: 1.5em; color: ${textColor};">`)
    .replace(/<li>/g, `<li style="margin: 0.25em 0;">`)
    .replace(/<strong>/g, `<strong style="font-weight: 600;">`)
    .replace(/<a /g, `<a style="color: ${accentColor}; text-decoration: underline;" `);
}
