/**
 * Save monitoring - reports failed cloud saves and a save badge stuck on
 * "unsaved" to Sentry, tagged `module=save`.
 *
 * Privacy: never sends document content, project names or user data. Only
 * error codes, counts and the project id.
 *
 * Autosave retries every 2 s, so one outage could send hundreds of events.
 * Each fingerprint is sent at most once per FINGERPRINT_COOLDOWN_MS, and a
 * session sends at most SESSION_EVENT_LIMIT save events.
 */

import {
  addBreadcrumb,
  captureEvent,
  toReportableError,
  type ReportableError,
} from './monitoring';

export type SaveTrigger = 'autosave' | 'manual' | 'other';
export type SaveOp = 'create' | 'update';

export interface SaveFailureContext {
  trigger: SaveTrigger;
  op: SaveOp;
  projectId: string | null;
  stepCount: number;
  elementCount: number;
}

export const FINGERPRINT_COOLDOWN_MS = 5 * 60_000;
export const SESSION_EVENT_LIMIT = 20;
export const STUCK_UNSAVED_MS = 60_000;

let consecutiveFailures = 0;
let sessionEvents = 0;
const lastSentAt = new Map<string, number>();
let stuckTimer: ReturnType<typeof setTimeout> | null = null;

/** Short, stable code for grouping: PostgREST/HTTP code, "network" or the error name. */
export function saveErrorCode(error: ReportableError | null): string {
  if (!error) return 'unknown';
  if (error.code) return error.code;
  if (typeof error.status === 'number') return `http_${error.status}`;
  if (error.name === 'TypeError' && /fetch|network/i.test(error.message)) return 'network';
  return error.name || 'unknown';
}

function takeSlot(fingerprint: string[]): boolean {
  if (sessionEvents >= SESSION_EVENT_LIMIT) return false;
  const key = fingerprint.join('|');
  const now = Date.now();
  const last = lastSentAt.get(key);
  if (last !== undefined && now - last < FINGERPRINT_COOLDOWN_MS) return false;
  lastSentAt.set(key, now);
  sessionEvents += 1;
  return true;
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export function reportSaveFailure(error: unknown, context: SaveFailureContext): void {
  consecutiveFailures += 1;

  const reportable = toReportableError(error);
  const code = saveErrorCode(reportable);
  const fingerprint = ['save', context.op, code];
  if (!takeSlot(fingerprint)) return;

  void captureEvent({
    error: reportable ?? new Error(`Cloud save failed (${code})`),
    level: 'error',
    fingerprint,
    tags: {
      module: 'save',
      'save.trigger': context.trigger,
      'save.op': context.op,
      'save.code': code,
      online: String(isOnline()),
    },
    extras: {
      'save.consecutive_failures': consecutiveFailures,
      'save.project_id': context.projectId,
      'save.step_count': context.stepCount,
      'save.element_count': context.elementCount,
      'error.details': reportable?.details,
      'error.hint': reportable?.hint,
    },
  });
}

export function noteSaveSucceeded(trigger: SaveTrigger, op: SaveOp): void {
  consecutiveFailures = 0;
  void addBreadcrumb('save', 'Cloud save succeeded', { trigger, op });
}

function reportStuckUnsaved(): void {
  stuckTimer = null;
  // Offline edits are expected to wait; that is not a save failure.
  if (!isOnline()) return;

  const fingerprint = ['save', 'stuck_unsaved'];
  if (!takeSlot(fingerprint)) return;

  void captureEvent({
    message: 'save.stuck_unsaved',
    level: 'warning',
    fingerprint,
    tags: { module: 'save', 'save.code': 'stuck_unsaved', online: 'true' },
    extras: {
      'save.stuck_ms': STUCK_UNSAVED_MS,
      'save.consecutive_failures': consecutiveFailures,
    },
  });
}

/**
 * Follow the save badge. The clock starts at the first edit that is not yet
 * saved and stops only at "saved"; "saving" and "error" keep it running.
 */
export function trackSaveStatus(status: 'saved' | 'unsaved' | 'saving' | 'error'): void {
  if (status === 'saved') {
    if (stuckTimer) clearTimeout(stuckTimer);
    stuckTimer = null;
    return;
  }
  if (status === 'unsaved' && !stuckTimer) {
    stuckTimer = setTimeout(reportStuckUnsaved, STUCK_UNSAVED_MS);
  }
}

export function resetSaveMonitoringForTests(): void {
  consecutiveFailures = 0;
  sessionEvents = 0;
  lastSentAt.clear();
  if (stuckTimer) clearTimeout(stuckTimer);
  stuckTimer = null;
}
