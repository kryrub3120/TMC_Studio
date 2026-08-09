import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureException } from "../lib/monitoring";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void captureException(error, {
      source: "react.error_boundary",
      componentStack: info.componentStack,
    });
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-6 text-[var(--color-text)]">
        <section className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg">
          <p className="text-sm font-semibold text-[var(--color-accent)]">
            TMC Studio
          </p>
          <h1 className="mt-2 text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Reload the application to continue. Your last saved project remains
            available in your account.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-slate-950"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
            <a
              className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)]"
              href="mailto:support@tacticsmadeclear.store?subject=TMC%20Studio%20application%20error"
            >
              Contact support
            </a>
          </div>
        </section>
      </main>
    );
  }
}
