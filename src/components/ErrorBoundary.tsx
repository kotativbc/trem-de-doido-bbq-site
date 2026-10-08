import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Quando este valor muda (ex.: a rota), o erro é limpo e a página tenta renderizar de novo. */
  resetKey?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Última barreira: um erro de renderização mostra uma tela amigável em vez de uma página branca. */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[app] erro de renderização:", error, info.componentStack);
  }

  componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (this.state.error && previous.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <main role="alert" className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="font-['Bebas_Neue'] text-4xl text-foreground">Algo deu errado por aqui</h1>
          <p className="text-muted-foreground">
            A página não conseguiu carregar. Sua sacola continua salva. Tente recarregar; se o problema continuar, chame a gente pelo WhatsApp.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Recarregar a página
            </button>
            <a
              href="/"
              className="rounded-md border border-border px-4 py-2 font-semibold text-foreground hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Voltar ao início
            </a>
          </div>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
