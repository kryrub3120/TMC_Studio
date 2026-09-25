import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  init: vi.fn(),
  setExtra: vi.fn(),
  setFingerprint: vi.fn(),
  setLevel: vi.fn(),
  setTag: vi.fn(),
  withScope: vi.fn((callback: (scope: unknown) => void) =>
    callback({
      setExtra: sentry.setExtra,
      setFingerprint: sentry.setFingerprint,
      setLevel: sentry.setLevel,
      setTag: sentry.setTag,
    }),
  ),
}));

vi.mock("@sentry/react", () => sentry);

describe("error monitoring", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("VITE_SENTRY_DSN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stays inactive when no DSN is configured", async () => {
    const monitoring = await import("./monitoring");

    expect(monitoring.isMonitoringConfigured()).toBe(false);
    await expect(monitoring.initializeMonitoring()).resolves.toBe(false);
    await monitoring.captureException(new Error("not sent"));

    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it("initializes once and reports errors without default PII", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@example.ingest.sentry.io/1");
    vi.stubEnv("VITE_SENTRY_ENVIRONMENT", "test");
    const monitoring = await import("./monitoring");
    const error = new Error("boom");

    await monitoring.initializeMonitoring();
    await monitoring.captureException(error, {
      source: "test.source",
      componentStack: "Component stack",
    });

    expect(sentry.init).toHaveBeenCalledTimes(1);
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://public@example.ingest.sentry.io/1",
        environment: "test",
        sendDefaultPii: false,
        tracesSampleRate: 0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
      }),
    );
    expect(sentry.setTag).toHaveBeenCalledWith("tmc.error_source", "test.source");
    expect(sentry.setExtra).toHaveBeenCalledWith(
      "react.component_stack",
      "Component stack",
    );
    expect(sentry.captureException).toHaveBeenCalledWith(error);
  });

  it("keeps the code of a Supabase error object instead of a generic Error", async () => {
    const monitoring = await import("./monitoring");
    const error = monitoring.toReportableError({
      message: "permission denied",
      code: "42501",
      details: "d",
      hint: "h",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "SupabaseError",
      message: "permission denied",
      code: "42501",
      details: "d",
      hint: "h",
    });
    expect(monitoring.toReportableError("text")).toBeNull();
    expect(monitoring.toReportableError({ code: "x" })).toBeNull();
  });

  it("logger.error reports the Supabase error, not the log label", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@example.ingest.sentry.io/1");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { logger } = await import("./logger");

    logger.error("Fetch projects error:", { message: "JWT expired", code: "PGRST301" });
    await vi.waitFor(() => expect(sentry.captureException).toHaveBeenCalledTimes(1));

    const [reported] = sentry.captureException.mock.calls[0];
    expect(reported).toMatchObject({ message: "JWT expired", code: "PGRST301" });
    expect(sentry.setTag).toHaveBeenCalledWith("tmc.error_source", "Fetch projects error:");
  });

  it("captureEvent applies tags, extras, fingerprint and level", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://public@example.ingest.sentry.io/1");
    const monitoring = await import("./monitoring");
    const error = new Error("save failed");

    await monitoring.captureEvent({
      error,
      level: "error",
      tags: { module: "save" },
      extras: { "save.step_count": 3 },
      fingerprint: ["save", "update", "42501"],
    });
    await monitoring.captureEvent({ message: "save.stuck_unsaved", level: "warning" });

    expect(sentry.setTag).toHaveBeenCalledWith("module", "save");
    expect(sentry.setExtra).toHaveBeenCalledWith("save.step_count", 3);
    expect(sentry.setFingerprint).toHaveBeenCalledWith(["save", "update", "42501"]);
    expect(sentry.setLevel).toHaveBeenCalledWith("warning");
    expect(sentry.captureException).toHaveBeenCalledWith(error);
    expect(sentry.captureMessage).toHaveBeenCalledWith("save.stuck_unsaved");
  });
});
