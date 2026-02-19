/**
 * Minimal application logger.
 *
 * - debug / info  → only emitted in dev mode (import.meta.env.DEV or VITE_DEBUG=true)
 * - warn  / error → always emitted (these are actionable signals in production)
 */

const isDev: boolean =
  import.meta.env.DEV === true ||
  import.meta.env.VITE_DEBUG === 'true';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogArgs = any[];

export const logger = {
  debug: (...args: LogArgs): void => {
    if (isDev) console.log(...args);   // eslint-disable-line no-console
  },
  info: (...args: LogArgs): void => {
    if (isDev) console.info(...args);  // eslint-disable-line no-console
  },
  warn: (...args: LogArgs): void => {
    console.warn(...args);             // eslint-disable-line no-console
  },
  error: (...args: LogArgs): void => {
    console.error(...args);            // eslint-disable-line no-console
  },
};
