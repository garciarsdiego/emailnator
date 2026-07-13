import type { MouseEvent } from "react";

export function SkipLink() {
  const focusMainContent = (event: MouseEvent<HTMLAnchorElement>) => {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    event.preventDefault();

    if (!mainContent.hasAttribute("tabindex")) {
      mainContent.setAttribute("tabindex", "-1");
    }

    mainContent.focus({ preventScroll: true });
    mainContent.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <a className="skip-link" href="#main-content" onClick={focusMainContent}>
      Ir para o conteúdo
    </a>
  );
}
