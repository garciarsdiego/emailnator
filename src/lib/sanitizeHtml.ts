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
