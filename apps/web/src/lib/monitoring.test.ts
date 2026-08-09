import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({
  captureException: vi.fn(),
  init: vi.fn(),
  setExtra: vi.fn(),
  setTag: vi.fn(),
  withScope: vi.fn((callback: (scope: unknown) => void) =>
    callback({ setExtra: sentry.setExtra, setTag: sentry.setTag }),
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
});
