import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SkipLink } from "@/components/v2/SkipLink";

describe("SkipLink", () => {
  it("moves keyboard focus to the main content", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });
    Element.prototype.scrollIntoView = vi.fn();

    render(<><SkipLink /><main id="main-content">Conteúdo</main></>);
    fireEvent.click(screen.getByRole("link", { name: /ir para o conteúdo/i }));

    expect(screen.getByRole("main")).toHaveFocus();
  });
});
