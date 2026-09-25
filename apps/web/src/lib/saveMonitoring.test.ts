import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const monitoring = vi.hoisted(() => ({
  captureEvent: vi.fn(async () => {}),
  addBreadcrumb: vi.fn(async () => {}),
}));

vi.mock('./monitoring', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./monitoring')>()),
  captureEvent: monitoring.captureEvent,
  addBreadcrumb: monitoring.addBreadcrumb,
}));

import {
  FINGERPRINT_COOLDOWN_MS,
  SESSION_EVENT_LIMIT,
  STUCK_UNSAVED_MS,
  noteSaveSucceeded,
  reportDocumentIssues,
  reportSaveFailure,
  resetSaveMonitoringForTests,
  saveErrorCode,
  trackSaveStatus,
  type SaveFailureContext,
} from './saveMonitoring';

const context: SaveFailureContext = {
  trigger: 'autosave',
  op: 'update',
  projectId: 'project-1',
  stepCount: 3,
  elementCount: 7,
};

/** Supabase/PostgREST errors are plain objects, not Error instances. */
const postgrestError = { message: 'permission denied for table projects', code: '42501', details: 'd', hint: 'h' };

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
}

describe('save monitoring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    resetSaveMonitoringForTests();
    setOnline(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    setOnline(true);
  });

  it('reports a failed save with module/trigger/op/code tags and no document content', () => {
    reportSaveFailure(postgrestError, context);

    expect(monitoring.captureEvent).toHaveBeenCalledTimes(1);
    const [event] = monitoring.captureEvent.mock.calls[0] as unknown as [
      { error: Error & { code?: string }; tags: Record<string, string>; extras: Record<string, unknown>; fingerprint: string[] },
    ];
    expect(event.error).toBeInstanceOf(Error);
    expect(event.error.message).toBe('permission denied for table projects');
    expect(event.error.code).toBe('42501');
    expect(event.fingerprint).toEqual(['save', 'update', '42501']);
    expect(event.tags).toEqual({
      module: 'save',
      'save.trigger': 'autosave',
      'save.op': 'update',
      'save.code': '42501',
      online: 'true',
    });
    expect(Object.keys(event.extras).sort()).toEqual([
      'error.details',
      'error.hint',
      'save.consecutive_failures',
      'save.element_count',
      'save.project_id',
      'save.step_count',
    ]);
  });

  it('derives stable codes for HTTP, network and unknown failures', () => {
    expect(saveErrorCode(Object.assign(new Error('x'), { status: 413 }))).toBe('http_413');
    expect(saveErrorCode(new TypeError('Failed to fetch'))).toBe('network');
    expect(saveErrorCode(new Error('boom'))).toBe('Error');
    expect(saveErrorCode(null)).toBe('unknown');
  });

  it('sends one event per fingerprint per cooldown while counting every failure', () => {
    for (let i = 0; i < 100; i++) reportSaveFailure(postgrestError, context);
    expect(monitoring.captureEvent).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(FINGERPRINT_COOLDOWN_MS);
    reportSaveFailure(postgrestError, context);
    expect(monitoring.captureEvent).toHaveBeenCalledTimes(2);
    const [event] = monitoring.captureEvent.mock.calls[1] as unknown as [{ extras: Record<string, unknown> }];
    expect(event.extras['save.consecutive_failures']).toBe(101);
  });

  it('caps save events per session', () => {
    for (let i = 0; i < SESSION_EVENT_LIMIT + 10; i++) {
      reportSaveFailure({ message: 'x', code: `code-${i}` }, context);
    }
    expect(monitoring.captureEvent).toHaveBeenCalledTimes(SESSION_EVENT_LIMIT);
  });

  it('resets the failure streak and leaves a breadcrumb after a successful save', () => {
    reportSaveFailure(postgrestError, context);
    noteSaveSucceeded('manual', 'create');
    expect(monitoring.addBreadcrumb).toHaveBeenCalledWith('save', 'Cloud save succeeded', {
      trigger: 'manual',
      op: 'create',
    });

    vi.advanceTimersByTime(FINGERPRINT_COOLDOWN_MS);
    reportSaveFailure(postgrestError, context);
    const [event] = monitoring.captureEvent.mock.calls[1] as unknown as [{ extras: Record<string, unknown> }];
    expect(event.extras['save.consecutive_failures']).toBe(1);
  });

  it('reports an invalid document as an error and warnings as a warning', () => {
    const where = { trigger: 'manual' as const, op: 'update' as const, projectId: 'project-1' };
    reportDocumentIssues({ ok: false, errors: ['steps is empty'], warnings: [] }, where);
    reportDocumentIssues({ ok: true, errors: [], warnings: ['currentStepIndex is out of range'] }, where);

    expect(monitoring.captureEvent).toHaveBeenNthCalledWith(1, expect.objectContaining({
      message: 'save.invalid_document',
      level: 'error',
      fingerprint: ['save', 'invalid_document'],
      extras: expect.objectContaining({ 'document.errors': ['steps is empty'] }),
    }));
    expect(monitoring.captureEvent).toHaveBeenNthCalledWith(2, expect.objectContaining({
      message: 'save.document_warnings',
      level: 'warning',
      fingerprint: ['save', 'document_warnings'],
    }));
  });

  describe('stuck "unsaved" badge', () => {
    it('reports once when the badge stays unsaved for 60 s', () => {
      trackSaveStatus('unsaved');
      trackSaveStatus('saving');
      trackSaveStatus('error');
      trackSaveStatus('unsaved');
      vi.advanceTimersByTime(STUCK_UNSAVED_MS - 1);
      expect(monitoring.captureEvent).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(monitoring.captureEvent).toHaveBeenCalledTimes(1);
      expect(monitoring.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'save.stuck_unsaved',
          level: 'warning',
          fingerprint: ['save', 'stuck_unsaved'],
          tags: expect.objectContaining({ module: 'save' }),
        }),
      );
    });

    it('does not report when the save completes in time', () => {
      trackSaveStatus('unsaved');
      vi.advanceTimersByTime(STUCK_UNSAVED_MS - 1);
      trackSaveStatus('saved');
      vi.advanceTimersByTime(STUCK_UNSAVED_MS * 2);
      expect(monitoring.captureEvent).not.toHaveBeenCalled();
    });

    it('does not report while offline', () => {
      setOnline(false);
      trackSaveStatus('unsaved');
      vi.advanceTimersByTime(STUCK_UNSAVED_MS);
      expect(monitoring.captureEvent).not.toHaveBeenCalled();
    });
  });
});
