/**
 * Regression tests for cloud save / autosave (production bug 2026-09-24):
 *  1. reload lost cloudProjectId -> duplicate project on next autosave
 *  2. autosave left the save badge stuck on "unsaved"
 *  3. concurrent saves of a new project inserted two rows
 *  4. autosave wrote the active step's elements into steps[0]
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createDocument, saveToLocalStorage, type BoardElement } from '@tmc/core';

const cloud = vi.hoisted(() => {
  let seq = 0;
  const rows = new Map<string, unknown>();
  return {
    rows,
    reset() {
      seq = 0;
      rows.clear();
    },
    createProject: vi.fn(async (p: { document: unknown }) => {
      await new Promise((r) => setTimeout(r, 5));
      const id = `project-${++seq}`;
      rows.set(id, p.document);
      return { id, ...p };
    }),
    updateProject: vi.fn(async (id: string, u: { document?: unknown }) => {
      await new Promise((r) => setTimeout(r, 5));
      if (!rows.has(id)) {
        throw Object.assign(new Error('not found'), { code: 'PGRST116' });
      }
      if (u.document) rows.set(id, u.document);
      return { id, ...u };
    }),
  };
});

vi.mock('../../../lib/supabase', () => ({
  isSupabaseEnabled: () => true,
  createProject: cloud.createProject,
  updateProject: cloud.updateProject,
  getProject: vi.fn(async (id: string) =>
    cloud.rows.has(id) ? { id, document: cloud.rows.get(id) } : null,
  ),
  getProjects: vi.fn(async () => []),
  getFolders: vi.fn(async () => []),
  createFolder: vi.fn(async () => null),
  uploadThumbnail: vi.fn(async () => null),
}));

vi.mock('../../useAuthStore', () => ({
  useAuthStore: {
    getState: () => {
      // A real clock moves between the local save and the cloud snapshot.
      // Fake timers freeze Date, which hid the stuck "unsaved" badge bug.
      vi.setSystemTime(Date.now() + 1);
      return { isAuthenticated: true };
    },
  },
}));

const saveMonitoring = vi.hoisted(() => ({
  reportSaveFailure: vi.fn(),
  reportDocumentIssues: vi.fn(),
  noteSaveSucceeded: vi.fn(),
}));

vi.mock('../../../lib/saveMonitoring', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/saveMonitoring')>()),
  reportSaveFailure: saveMonitoring.reportSaveFailure,
  reportDocumentIssues: saveMonitoring.reportDocumentIssues,
  noteSaveSucceeded: saveMonitoring.noteSaveSucceeded,
}));

import type { AppState } from '../../types';
import {
  createDocumentSlice,
  createDrawingSlice,
  createElementsSlice,
  createGroupsSlice,
  createHistorySlice,
  createSelectionSlice,
  createStepsSlice,
} from '../index';
import { CLOUD_PROJECT_STORAGE_KEY } from '../documentSlice';
import { useUIStore } from '../../useUIStore';

function createTestStore() {
  return create<AppState>()(
    subscribeWithSelector((...args) => {
      const documentSlice = createDocumentSlice(...args);
      const initialElements = documentSlice.document.steps[0]?.elements ?? [];
      return {
        ...documentSlice,
        ...createElementsSlice(...args),
        elements: initialElements,
        ...createSelectionSlice(...args),
        ...createHistorySlice(...args),
        history: [{ elements: initialElements, selectedIds: [] }],
        historyIndex: 0,
        ...createStepsSlice(...args),
        ...createGroupsSlice(...args),
        ...createDrawingSlice(...args),
      };
    }),
  );
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

async function runAutosave(store: ReturnType<typeof createTestStore>) {
  const done = store.getState().performAutoSave();
  await vi.advanceTimersByTimeAsync(50);
  await done;
  await flush();
}

function marker(id: string): BoardElement {
  return {
    id,
    type: 'text',
    position: { x: 10, y: 10 },
    content: id,
  } as unknown as BoardElement;
}

describe('cloud save integrity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    cloud.reset();
    cloud.createProject.mockClear();
    cloud.updateProject.mockClear();
    useUIStore.setState({ isOnline: true, projectSaveStatus: 'saved' });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('keeps the cloud project id across a reload (no duplicate on next autosave)', async () => {
    const first = createTestStore();
    first.getState().markDirty();
    await runAutosave(first);
    expect(cloud.createProject).toHaveBeenCalledTimes(1);
    const projectId = first.getState().cloudProjectId;
    expect(projectId).toBe('project-1');
    expect(localStorage.getItem(CLOUD_PROJECT_STORAGE_KEY)).toContain('project-1');

    // Simulate a page reload: a brand-new store boots from localStorage.
    const reloaded = createTestStore();
    expect(reloaded.getState().cloudProjectId).toBe('project-1');

    reloaded.getState().markDirty();
    await runAutosave(reloaded);
    expect(cloud.createProject).toHaveBeenCalledTimes(1);
    expect(cloud.updateProject).toHaveBeenCalledWith('project-1', expect.anything());
  });

  it('does not restore a cloud id that belongs to a different local document', async () => {
    localStorage.setItem(
      CLOUD_PROJECT_STORAGE_KEY,
      JSON.stringify({ projectId: 'project-x', documentCreatedAt: 'other' }),
    );
    saveToLocalStorage(createDocument('Local only'));
    const store = createTestStore();
    expect(store.getState().cloudProjectId).toBeNull();
  });

  it('clears the persisted id when starting a new document', async () => {
    const store = createTestStore();
    store.getState().markDirty();
    await runAutosave(store);
    expect(localStorage.getItem(CLOUD_PROJECT_STORAGE_KEY)).not.toBeNull();
    store.getState().newDocument();
    expect(localStorage.getItem(CLOUD_PROJECT_STORAGE_KEY)).toBeNull();
    expect(store.getState().cloudProjectId).toBeNull();
  });

  it('reports "saved" after a successful autosave', async () => {
    const store = createTestStore();
    store.getState().markDirty();
    await flush();
    expect(useUIStore.getState().projectSaveStatus).toBe('unsaved');
    await runAutosave(store);
    expect(store.getState().isDirty).toBe(false);
    expect(useUIStore.getState().projectSaveStatus).toBe('saved');
  });

  it('stays dirty when the user edits while the save is in flight', async () => {
    const store = createTestStore();
    store.getState().markDirty();
    const done = store.getState().performAutoSave();
    store.getState().markDirty(); // edit during the network request
    await vi.advanceTimersByTimeAsync(50);
    await done;
    await flush();
    expect(store.getState().isDirty).toBe(true);
    expect(useUIStore.getState().projectSaveStatus).toBe('unsaved');
  });

  it('creates exactly one project when autosave and manual save race', async () => {
    const store = createTestStore();
    store.getState().markDirty();
    const a = store.getState().saveToCloud();
    const b = store.getState().saveToCloud();
    await vi.advanceTimersByTimeAsync(50);
    await Promise.all([a, b]);
    expect(cloud.createProject).toHaveBeenCalledTimes(1);
    expect(cloud.updateProject).toHaveBeenCalledTimes(1);
  });

  it('manual save that fails in the cloud keeps the document dirty', async () => {
    const store = createTestStore();
    store.getState().markDirty();
    cloud.createProject.mockRejectedValueOnce(new Error('network'));
    const done = store.getState().manualSave();
    await vi.advanceTimersByTimeAsync(50);
    const ok = await done;
    await flush();
    expect(ok).toBe(false);
    expect(store.getState().isDirty).toBe(true);
    expect(useUIStore.getState().projectSaveStatus).toBe('error');
  });

  it('saves as a new project when the restored id no longer exists', async () => {
    const store = createTestStore();
    store.setState({ cloudProjectId: 'deleted-elsewhere' });
    store.getState().markDirty();
    await runAutosave(store);
    expect(cloud.createProject).toHaveBeenCalledTimes(1);
    expect(store.getState().cloudProjectId).toBe('project-1');
  });

  it('autosave on step 2 never overwrites step 1 (animation integrity)', async () => {
    const store = createTestStore();
    store.setState({ elements: [marker('step-1-element')] });
    store.getState().addStep();
    // addStep switches to the new step; make sure we edit step 2
    if (store.getState().currentStepIndex !== 1) store.getState().goToStep(1);
    store.setState({ elements: [marker('step-2-element')] });
    store.getState().markDirty();
    await runAutosave(store);

    const steps = store.getState().document.steps;
    expect(steps[0].elements.map((e) => e.id)).toEqual(['step-1-element']);
    expect(steps[1].elements.map((e) => e.id)).toEqual(['step-2-element']);

    const local = JSON.parse(localStorage.getItem('tmc-studio-board') ?? '{}');
    expect(local.steps[0].elements.map((e: BoardElement) => e.id)).toEqual(['step-1-element']);

    const saved = cloud.rows.get('project-1') as { steps: { elements: BoardElement[] }[] };
    expect(saved.steps[0].elements.map((e) => e.id)).toEqual(['step-1-element']);
    expect(saved.steps[1].elements.map((e) => e.id)).toEqual(['step-2-element']);
  });
});

describe('cloud save monitoring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    cloud.reset();
    vi.clearAllMocks();
    useUIStore.setState({ isOnline: true, projectSaveStatus: 'saved' });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('reports a failed autosave update with its context', async () => {
    const store = createTestStore();
    store.getState().markDirty();
    await runAutosave(store);
    expect(saveMonitoring.noteSaveSucceeded).toHaveBeenCalledWith('autosave', 'create');

    const rlsError = { message: 'new row violates row-level security policy', code: '42501' };
    cloud.updateProject.mockRejectedValueOnce(rlsError);
    store.getState().markDirty();
    await runAutosave(store);

    expect(saveMonitoring.reportSaveFailure).toHaveBeenCalledTimes(1);
    expect(saveMonitoring.reportSaveFailure).toHaveBeenCalledWith(rlsError, {
      trigger: 'autosave',
      op: 'update',
      projectId: 'project-1',
      stepCount: 1,
      elementCount: store.getState().elements.length,
    });
  });

  it('labels a failed manual save of a new project as manual/create', async () => {
    const store = createTestStore();
    store.getState().markDirty();
    cloud.createProject.mockRejectedValueOnce(new Error('network'));
    const done = store.getState().manualSave();
    await vi.advanceTimersByTimeAsync(50);
    await done;

    expect(saveMonitoring.reportSaveFailure).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ trigger: 'manual', op: 'create', projectId: null }),
    );
  });

  it('does not report a save skipped while offline', async () => {
    useUIStore.setState({ isOnline: false });
    const store = createTestStore();
    store.getState().markDirty();
    await runAutosave(store);

    expect(cloud.createProject).not.toHaveBeenCalled();
    expect(saveMonitoring.reportSaveFailure).not.toHaveBeenCalled();
  });

  it('does not report the missing-row fallback that saves as a new project', async () => {
    const store = createTestStore();
    store.setState({ cloudProjectId: 'deleted-elsewhere' });
    store.getState().markDirty();
    await runAutosave(store);

    expect(saveMonitoring.reportSaveFailure).not.toHaveBeenCalled();
    expect(saveMonitoring.noteSaveSucceeded).toHaveBeenCalledWith('autosave', 'create');
  });

  it('does not write a document that fails validation to the cloud', async () => {
    const store = createTestStore();
    store.setState({
      elements: [{ id: 'p1', type: 'player', position: { x: Number.NaN, y: 10 } } as unknown as BoardElement],
    });
    store.getState().markDirty();
    await runAutosave(store);

    expect(cloud.createProject).not.toHaveBeenCalled();
    expect(saveMonitoring.reportDocumentIssues).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false, errors: ['steps[0].elements[0].position.x is not a finite number'] }),
      { trigger: 'autosave', op: 'create', projectId: null },
    );
    expect(store.getState().isDirty).toBe(true);
    expect(useUIStore.getState().projectSaveStatus).toBe('error');
    // The local copy is still written, so the user loses nothing.
    expect(localStorage.getItem('tmc-studio-board')).not.toBeNull();
  });

  it('saves a document with warnings and reports them', async () => {
    const store = createTestStore();
    store.setState({ elements: [marker('dup'), marker('dup')] });
    store.getState().markDirty();
    await runAutosave(store);

    expect(cloud.createProject).toHaveBeenCalledTimes(1);
    expect(saveMonitoring.reportDocumentIssues).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, warnings: ['steps[0].elements[1].id is duplicated in the step'] }),
      expect.objectContaining({ trigger: 'autosave' }),
    );
  });

  it.each([
    ['adding', (store: ReturnType<typeof createTestStore>) => store.getState().addStep()],
    ['renaming', (store: ReturnType<typeof createTestStore>) => store.getState().renameStep(0, 'Pressing')],
    ['deleting', (store: ReturnType<typeof createTestStore>) => {
      store.getState().addStep();
      store.setState({ isDirty: false });
      store.getState().removeStep(1);
    }],
  ])('%s a step schedules an autosave on its own', async (_name, change) => {
    const store = createTestStore();
    change(store);
    expect(store.getState().isDirty).toBe(true);

    await vi.advanceTimersByTimeAsync(2100);
    await flush();
    expect(store.getState().isDirty).toBe(false);
    expect(cloud.createProject).toHaveBeenCalledTimes(1);
  });
});

describe('step list operations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    cloud.reset();
    vi.clearAllMocks();
    useUIStore.setState({ isOnline: true, projectSaveStatus: 'saved' });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  /** Three steps holding markers a / b / c; the canvas is on step 2 ("b"). */
  function threeSteps() {
    const store = createTestStore();
    store.setState({ elements: [marker('a')] });
    store.getState().addStep();
    store.setState({ elements: [marker('b')] });
    store.getState().addStep();
    store.setState({ elements: [marker('c')] });
    store.getState().goToStep(1);
    return store;
  }

  const ids = (store: ReturnType<typeof createTestStore>) =>
    store.getState().document.steps.map((step) => step.elements.map((e) => e.id).join(''));

  it('deleting another step keeps the coach on their step and keeps unsaved canvas edits', () => {
    const store = threeSteps();
    store.setState({ elements: [marker('b'), marker('b2')] }); // live edit, not synced yet
    store.getState().removeStep(0);

    expect(ids(store)).toEqual(['bb2', 'c']);
    expect(store.getState().currentStepIndex).toBe(0);
    expect(store.getState().elements.map((e) => e.id)).toEqual(['b', 'b2']);
    expect(store.getState().isDirty).toBe(true);
  });

  it('duplicating a step copies its live content right after it and opens the copy', () => {
    const store = threeSteps();
    store.setState({ elements: [marker('b'), marker('b2')] });
    store.getState().duplicateStep(1);

    expect(ids(store)).toEqual(['a', 'bb2', 'bb2', 'c']);
    expect(store.getState().currentStepIndex).toBe(2);
    const [original, copy] = store.getState().document.steps.slice(1, 3);
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('');
    expect(copy.elements).not.toBe(original.elements);
    expect(store.getState().isDirty).toBe(true);
  });

  it('moving steps reorders them and keeps the canvas on the same step', () => {
    const store = threeSteps();
    store.setState({ elements: [marker('b'), marker('b2')] });
    store.getState().moveStep(1, 2);

    expect(ids(store)).toEqual(['a', 'c', 'bb2']);
    expect(store.getState().currentStepIndex).toBe(2);
    expect(store.getState().elements.map((e) => e.id)).toEqual(['b', 'b2']);

    store.getState().moveStep(0, 2);
    expect(ids(store)).toEqual(['c', 'bb2', 'a']);
    expect(store.getState().currentStepIndex).toBe(1);
    expect(store.getState().isDirty).toBe(true);
  });

  it('ignores moves out of range', () => {
    const store = threeSteps();
    store.setState({ isDirty: false });
    store.getState().moveStep(0, 5);
    store.getState().moveStep(-1, 0);
    store.getState().moveStep(1, 1);
    expect(ids(store)).toEqual(['a', 'b', 'c']);
    expect(store.getState().isDirty).toBe(false);
  });
});

describe('adopting the local (guest) document after sign-in', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    cloud.reset();
    vi.clearAllMocks();
    useUIStore.setState({ isOnline: true, projectSaveStatus: 'saved' });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('uploads a locally saved board that is not a cloud project yet', async () => {
    saveToLocalStorage({ ...createDocument('Guest drill'), steps: [{ id: 's1', name: '', duration: 0.8, elements: [marker('guest')] }] });
    const store = createTestStore();

    expect(store.getState().adoptLocalDocument()).toBe(true);
    await vi.advanceTimersByTimeAsync(2100);
    await flush();

    expect(cloud.createProject).toHaveBeenCalledTimes(1);
    expect(store.getState().cloudProjectId).toBe('project-1');
    expect(store.getState().adoptLocalDocument()).toBe(false);
  });

  it('does nothing without a locally saved board (untouched demo board)', () => {
    const store = createTestStore();
    expect(store.getState().adoptLocalDocument()).toBe(false);
    expect(store.getState().isDirty).toBe(false);
  });
});

