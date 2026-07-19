import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level render-error safety net. Without this, any uncaught error thrown
 * during render anywhere in the tree unmounts the whole React app and leaves
 * the user staring at a blank white page with no way to recover.
 */
export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Structured client-side log so a session-replay/log pipeline can pick it
    // up even without a dedicated error-reporting service wired in yet.
    console.error(
      JSON.stringify({
        level: "error",
        event: "render_error_boundary",
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }),
    );
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main
        role="alert"
        aria-live="assertive"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center"
      >
        <h1 className="text-2xl font-semibold text-foreground">Algo deu errado</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Encontramos um erro inesperado nesta página. Você pode tentar recarregar; se o problema
          continuar, tente novamente em alguns minutos.
        </p>
        <Button onClick={this.handleReload}>Recarregar página</Button>
      </main>
    );
  }
}
