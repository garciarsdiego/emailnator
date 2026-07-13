import { describe, expect, it } from "vitest";
import {
  escapeEmailText,
  renderEmailDocument,
  safeEmailUrl,
} from "@/features/email-editor/lib/renderEmailDocument";
import type { EmailBlock } from "@/types/emailBuilder";

describe("email document renderer", () => {
  it("escapes metadata and blocks unsafe protocols", () => {
    expect(escapeEmailText('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
    expect(safeEmailUrl("javascript:alert(1)")).toBe("#");
    expect(safeEmailUrl("https://example.com/path")).toBe("https://example.com/path");
  });

  it("renders a static deadline instead of a fake live countdown", () => {
    const blocks: EmailBlock[] = [
      {
        id: "deadline",
        type: "countdown",
        position: 0,
        content: {
          countdownTitle: "Inscrições até",
          countdownDate: "2027-04-18",
        },
      },
    ];

    const html = renderEmailDocument(blocks, {
      subject: "Últimos dias",
      preheader: "Confira os detalhes",
    });

    expect(html).toContain("2027-04-18");
    expect(html).not.toContain("countdown-number");
    expect(html).toContain('role="presentation"');
  });
});
