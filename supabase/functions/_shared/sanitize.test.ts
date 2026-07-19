import { describe, expect, it } from "vitest";
import { sanitizeEmailHtml } from "./sanitize.ts";

describe("sanitizeEmailHtml", () => {
  it("strips script tags and their contents", () => {
    const out = sanitizeEmailHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert(1)");
    expect(out).toContain("<p>hi</p>");
  });

  it("removes disallowed tags but keeps allowed ones", () => {
    const out = sanitizeEmailHtml('<div><iframe src="https://evil.example"></iframe><p>ok</p></div>');
    expect(out).not.toContain("<iframe");
    expect(out).toContain("<p>ok</p>");
  });

  it("strips event handler attributes (onerror, onclick, ...)", () => {
    const out = sanitizeEmailHtml('<img src="https://x.test/a.png" onerror="alert(1)" onclick="steal()">');
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("onclick");
    expect(out).toContain('src="https://x.test/a.png"');
  });

  it("blocks javascript: URLs in href", () => {
    const out = sanitizeEmailHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain("javascript:");
  });

  it("blocks data: and other unlisted URL schemes in href", () => {
    const out = sanitizeEmailHtml('<a href="data:text/html,<script>alert(1)</script>">click</a>');
    expect(out).not.toContain("data:");
  });

  it("allows http, https, mailto and tel links", () => {
    expect(sanitizeEmailHtml('<a href="https://example.com">l</a>')).toContain('href="https://example.com"');
    expect(sanitizeEmailHtml('<a href="http://example.com">l</a>')).toContain('href="http://example.com"');
    expect(sanitizeEmailHtml('<a href="mailto:a@b.com">l</a>')).toContain('href="mailto:a@b.com"');
    expect(sanitizeEmailHtml('<a href="tel:+15551234567">l</a>')).toContain('href="tel:+15551234567"');
  });

  it("blocks protocol-relative URLs", () => {
    const out = sanitizeEmailHtml('<a href="//evil.example/phish">l</a>');
    expect(out).not.toContain('href="//evil.example');
  });

  it("adds rel=noopener noreferrer to links", () => {
    const out = sanitizeEmailHtml('<a href="https://example.com" target="_blank">l</a>');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("keeps allowed inline styles with safe values", () => {
    const out = sanitizeEmailHtml('<p style="color:#ff0000; font-size:14px; text-align:center;">t</p>');
    expect(out).toContain("color:#ff0000");
    expect(out).toContain("font-size:14px");
    expect(out).toContain("text-align:center");
  });

  it("strips inline style properties with unsafe/unlisted values", () => {
    const out = sanitizeEmailHtml('<p style="color:#fff; behavior:url(evil.htc); position:fixed;">t</p>');
    expect(out).not.toContain("behavior");
    expect(out).not.toContain("position");
    expect(out).toContain("color:#fff");
  });

  it("strips disallowed attributes such as srcdoc/formaction", () => {
    const out = sanitizeEmailHtml('<img src="https://x.test/a.png" srcdoc="<script>1</script>">');
    expect(out).not.toContain("srcdoc");
  });

  it("keeps table structure tags used by email layouts", () => {
    const out = sanitizeEmailHtml(
      '<table><thead><tr><th>H</th></tr></thead><tbody><tr><td>D</td></tr></tbody></table>'
    );
    expect(out).toContain("<table>");
    expect(out).toContain("<thead>");
    expect(out).toContain("<tbody>");
    expect(out).toContain("<th>H</th>");
    expect(out).toContain("<td>D</td>");
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeEmailHtml("")).toBe("");
  });
});
