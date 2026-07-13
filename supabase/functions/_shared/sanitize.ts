import * as sanitizeHtmlModule from "https://esm.sh/sanitize-html@2.17.0";

type Sanitizer = {
  (value: string, options: Record<string, unknown>): string;
  simpleTransform(tagName: string, attributes: Record<string, string>, merge?: boolean): unknown;
};

// sanitize-html publishes CommonJS-shaped type declarations while esm.sh exposes
// a real ESM default at runtime. Keep the interop cast in this single adapter.
const sanitizeHtml = (sanitizeHtmlModule as unknown as { default: Sanitizer }).default;

export function sanitizeEmailHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [
      "a", "b", "blockquote", "br", "button", "center", "div", "em", "font",
      "h1", "h2", "h3", "h4", "hr", "i", "img", "li", "ol", "p", "small",
      "span", "strong", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul",
    ],
    allowedAttributes: {
      "*": ["align", "bgcolor", "class", "height", "style", "title", "valign", "width"],
      a: ["href", "name", "rel", "target"],
      img: ["alt", "border", "height", "src", "width"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan", "scope"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    allowedStyles: {
      "*": {
        color: [/^(?:#[0-9a-f]{3,8}|rgba?\([0-9.,% ]+\)|[a-z]+)$/i],
        "background-color": [/^(?:#[0-9a-f]{3,8}|rgba?\([0-9.,% ]+\)|[a-z]+)$/i],
        "font-family": [/^[a-z0-9 ,"'-]+$/i],
        "font-size": [/^[0-9.]+(?:px|em|rem|%)$/i],
        "font-weight": [/^(?:normal|bold|[1-9]00)$/i],
        "line-height": [/^[0-9.]+(?:px|em|rem|%)?$/i],
        "text-align": [/^(?:left|right|center|justify)$/i],
        "text-decoration": [/^(?:none|underline|line-through)$/i],
        display: [/^(?:block|inline|inline-block|table|table-row|table-cell|none)$/i],
        width: [/^(?:auto|[0-9.]+(?:px|em|rem|%))$/i],
        "max-width": [/^(?:none|[0-9.]+(?:px|em|rem|%))$/i],
        height: [/^(?:auto|[0-9.]+(?:px|em|rem|%))$/i],
        margin: [/^(?:auto|[0-9. -]+(?:px|em|rem|%)(?: [0-9. -]+(?:px|em|rem|%)){0,3})$/i],
        padding: [/^[0-9. -]+(?:px|em|rem|%)(?: [0-9. -]+(?:px|em|rem|%)){0,3}$/i],
        border: [/^[0-9.]+px (?:solid|dashed|dotted) (?:#[0-9a-f]{3,8}|[a-z]+)$/i],
        "border-radius": [/^[0-9.]+(?:px|em|rem|%)$/i],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
  });
}
