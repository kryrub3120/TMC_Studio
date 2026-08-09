type SentrySdk = typeof import("./monitoringSdk");

export interface ErrorContext {
  source?: string;
  componentStack?: string | null;
}

let sdkPromise: Promise<SentrySdk> | null = null;
let initializationPromise: Promise<boolean> | null = null;

function getDsn(): string {
  return import.meta.env.VITE_SENTRY_DSN?.trim() ?? "";
}

function loadSdk(): Promise<SentrySdk> {
  sdkPromise ??= import("./monitoringSdk");
  return sdkPromise;
}

export function isMonitoringConfigured(): boolean {
  return getDsn().length > 0;
}

export function initializeMonitoring(): Promise<boolean> {
  if (!isMonitoringConfigured()) return Promise.resolve(false);

  initializationPromise ??= loadSdk()
    .then((Sentry) => {
      Sentry.init({
        dsn: getDsn(),
        environment:
          import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
        release: import.meta.env.VITE_APP_RELEASE || undefined,
        sendDefaultPii: false,
        tracesSampleRate: 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
      });
      return true;
    })
    .catch(() => false);

  return initializationPromise;
}

export async function captureException(
  error: unknown,
  context: ErrorContext = {},
): Promise<void> {
  if (!(await initializeMonitoring())) return;

  const Sentry = await loadSdk();
  Sentry.withScope((scope) => {
    if (context.source) scope.setTag("tmc.error_source", context.source);
    if (context.componentStack) {
      scope.setExtra("react.component_stack", context.componentStack);
    }
    Sentry.captureException(error);
  });
}
