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

/** Error fields worth keeping from Supabase/PostgREST and fetch failures. */
export interface ReportableError extends Error {
  code?: string;
  status?: number;
  details?: string;
  hint?: string;
}

/**
 * Supabase returns plain objects ({ message, code, details, hint }), not Error
 * instances. Turn them into an Error that keeps those fields; otherwise the
 * code is lost and every failure groups into one generic Sentry issue.
 */
export function toReportableError(value: unknown): ReportableError | null {
  if (value instanceof Error) return value as ReportableError;
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (typeof record.message !== "string") return null;

  const error = new Error(record.message) as ReportableError;
  error.name = "SupabaseError";
  if (typeof record.code === "string") error.code = record.code;
  if (typeof record.status === "number") error.status = record.status;
  if (typeof record.details === "string") error.details = record.details;
  if (typeof record.hint === "string") error.hint = record.hint;
  return error;
}

export interface MonitoringEvent {
  /** Sent as an exception when set, otherwise `message` is sent. */
  error?: Error;
  message?: string;
  level?: "error" | "warning";
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
  fingerprint?: string[];
}

export async function captureEvent(event: MonitoringEvent): Promise<void> {
  if (!(await initializeMonitoring())) return;

  const Sentry = await loadSdk();
  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(event.tags ?? {})) {
      scope.setTag(key, value);
    }
    for (const [key, value] of Object.entries(event.extras ?? {})) {
      scope.setExtra(key, value);
    }
    if (event.fingerprint) scope.setFingerprint(event.fingerprint);
    if (event.level) scope.setLevel(event.level);

    if (event.error) Sentry.captureException(event.error);
    else Sentry.captureMessage(event.message ?? "Unknown monitoring event");
  });
}

export async function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!(await initializeMonitoring())) return;

  const Sentry = await loadSdk();
  Sentry.addBreadcrumb({ category, message, data, level: "info" });
}
