import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  retryCount: number;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    if (this.state.retryCount < 5) {
      setTimeout(() => {
        this.setState((prev) => ({ hasError: false, retryCount: prev.retryCount + 1 }));
      }, 2000);
    }
  }

  render() {
    if (this.state.hasError && this.state.retryCount >= 5) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="rounded-3xl border border-border bg-card p-8 text-center max-w-md">
            <h2 className="text-lg font-bold text-foreground mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              L'application a rencontré un problème inattendu.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
