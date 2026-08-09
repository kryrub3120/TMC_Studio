/**
 * Minimal application logger.
 *
 * - debug / info  → only emitted in dev mode (import.meta.env.DEV or VITE_DEBUG=true)
 * - warn  / error → always emitted (these are actionable signals in production)
 */

import { captureException } from './monitoring';

const isDev: boolean =
  import.meta.env.DEV === true ||
  import.meta.env.VITE_DEBUG === 'true';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogArgs = any[];

function reportLoggedError(args: LogArgs): void {
  const error = args.find((argument) => argument instanceof Error);
  const source = args.find((argument) => typeof argument === 'string');

  void captureException(
    error ?? new Error(source ?? 'Unknown application error'),
    { source: source ?? 'logger.error' },
  );
}

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
    reportLoggedError(args);
  },
};
