import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "@/app/ErrorBoundary";

function Bomb(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React logs the caught error to console.error too; keep test output clean.
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders children normally when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("shows a recoverable fallback instead of unmounting the whole app when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /recarregar página/i })).toBeInTheDocument();
  });

  it("logs a structured error event for the caught render error", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    const structuredCall = consoleErrorSpy.mock.calls.find((call: unknown[]) => {
      const arg = call[0];
      try {
        return typeof arg === "string" && JSON.parse(arg).event === "render_error_boundary";
      } catch {
        return false;
      }
    });
    expect(structuredCall).toBeDefined();
  });
});
