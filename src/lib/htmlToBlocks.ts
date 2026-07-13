import { EmailBlock, DEFAULT_BLOCKS } from "@/types/emailBuilder";

/**
 * Converts HTML content to email blocks for the visual builder
 */
export function htmlToBlocks(html: string, options?: {
  subject?: string;
  brandName?: string;
  ctaText?: string;
}): EmailBlock[] {
  const blocks: EmailBlock[] = [];
  let position = 0;

  // Add header block if brandName is provided
  if (options?.brandName) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "header",
      content: {
        ...DEFAULT_BLOCKS.header,
        brandName: options.brandName,
      },
      position: position++,
    });
  }

  // Add subject as main text block if provided
  if (options?.subject) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "text",
      content: {
        ...DEFAULT_BLOCKS.text,
        text: `<strong>${options.subject}</strong>`,
        fontSize: "20px",
        fontWeight: "bold",
        textAlign: "center",
      },
      position: position++,
    });

    blocks.push({
      id: crypto.randomUUID(),
      type: "divider",
      content: DEFAULT_BLOCKS.divider,
      position: position++,
    });
  }

  // Parse HTML content and convert to blocks
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  // Process child nodes
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({
          id: crypto.randomUUID(),
          type: "text",
          content: {
            ...DEFAULT_BLOCKS.text,
            text: text,
          },
          position: position++,
        });
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    // Handle images
    if (tagName === "img") {
      const src = element.getAttribute("src");
      if (src) {
        blocks.push({
          id: crypto.randomUUID(),
          type: "image",
          content: {
            ...DEFAULT_BLOCKS.image,
            imageUrl: src,
            altText: element.getAttribute("alt") || "Imagem",
          },
          position: position++,
        });
      }
      return;
    }

    // Handle horizontal rules
    if (tagName === "hr") {
      blocks.push({
        id: crypto.randomUUID(),
        type: "divider",
        content: DEFAULT_BLOCKS.divider,
        position: position++,
      });
      return;
    }

    // Handle line breaks as spacers
    if (tagName === "br") {
      blocks.push({
        id: crypto.randomUUID(),
        type: "spacer",
        content: { ...DEFAULT_BLOCKS.spacer, spacerHeight: "12px" },
        position: position++,
      });
      return;
    }

    // Handle links that might be buttons
    if (tagName === "a") {
      const href = element.getAttribute("href");
      const text = element.textContent?.trim();
      const style = element.getAttribute("style") || "";
      
      // Check if it looks like a button (has background color or button class)
      if (style.includes("background") || element.classList.contains("button") || element.classList.contains("cta")) {
        blocks.push({
          id: crypto.randomUUID(),
          type: "button",
          content: {
            ...DEFAULT_BLOCKS.button,
            buttonText: text || "Clique Aqui",
            buttonUrl: href || "#",
          },
          position: position++,
        });
        return;
      }
    }

    // Handle paragraphs and divs with content
    if (tagName === "p" || tagName === "div") {
      const innerHTML = element.innerHTML.trim();
      if (innerHTML) {
        blocks.push({
          id: crypto.randomUUID(),
          type: "text",
          content: {
            ...DEFAULT_BLOCKS.text,
            text: innerHTML,
          },
          position: position++,
        });
      }
      return;
    }

    // Handle headings
    if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
      const fontSize = {
        h1: "28px",
        h2: "24px",
        h3: "20px",
        h4: "18px",
        h5: "16px",
        h6: "14px",
      }[tagName] || "16px";

      blocks.push({
        id: crypto.randomUUID(),
        type: "text",
        content: {
          ...DEFAULT_BLOCKS.text,
          text: element.innerHTML,
          fontSize,
          fontWeight: "bold",
        },
        position: position++,
      });
      return;
    }

    // Handle lists
    if (tagName === "ul" || tagName === "ol") {
      blocks.push({
        id: crypto.randomUUID(),
        type: "text",
        content: {
          ...DEFAULT_BLOCKS.text,
          text: element.outerHTML,
        },
        position: position++,
      });
      return;
    }

    // For other elements, process children
    element.childNodes.forEach(processNode);
  };

  body.childNodes.forEach(processNode);

  // Add CTA button if provided and not already in content
  if (options?.ctaText) {
    const hasButton = blocks.some(b => b.type === "button");
    if (!hasButton) {
      blocks.push({
        id: crypto.randomUUID(),
        type: "button",
        content: {
          ...DEFAULT_BLOCKS.button,
          buttonText: options.ctaText,
        },
        position: position++,
      });
    }
  }

  // Add footer if we have content
  if (blocks.length > 0) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "footer",
      content: {
        ...DEFAULT_BLOCKS.footer,
        companyName: options?.brandName || "Sua Empresa",
      },
      position: position++,
    });
  }

  // If no blocks were created, add a default text block
  if (blocks.length === 0) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "text",
      content: {
        ...DEFAULT_BLOCKS.text,
        text: html || "Comece a criar seu email...",
      },
      position: 0,
    });
  }

  return blocks;
}

/**
 * Creates initial blocks for a new email based on template/campaign data
 */
export function createBlocksFromEmailData(data: {
  subject?: string;
  preheader?: string;
  content?: string;
  cta?: string;
  brandName?: string;
}): EmailBlock[] {
  return htmlToBlocks(data.content || "", {
    subject: data.subject,
    brandName: data.brandName,
    ctaText: data.cta,
  });
}
