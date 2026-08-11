import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createDocument, DEFAULT_PITCH_SETTINGS } from '@tmc/core';
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

describe('settings document persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('marks team names and colors dirty and stores them in the document', () => {
    const store = createTestStore();
    store.getState().updateTeamSettings('home', {
      name: 'TMC Academy',
      primaryColor: '#112233',
      secondaryColor: '#445566',
    });

    expect(store.getState().isDirty).toBe(true);
    expect(store.getState().document.teamSettings?.home).toMatchObject({
      name: 'TMC Academy',
      primaryColor: '#112233',
      secondaryColor: '#445566',
    });
  });

  it('marks non-orientation pitch changes dirty', () => {
    const store = createTestStore();
    store.getState().updatePitchSettings({ showStripes: !DEFAULT_PITCH_SETTINGS.showStripes });
    expect(store.getState().isDirty).toBe(true);
  });

  it('adds and edits several squad players in one persisted document', () => {
    const store = createTestStore();
    store.setState({ document: createDocument('Squad test'), isDirty: false });
    store.getState().addSquadPlayers([
      { name: 'Jan Kowalski', number: 1, team: 'home', isGoalkeeper: true },
      { name: 'Piotr Nowak', number: 7, team: 'home', isGoalkeeper: false },
    ]);

    const secondPlayer = store.getState().document.squad?.[1];
    expect(secondPlayer).toBeDefined();
    store.getState().updateSquadPlayer(secondPlayer!.id, { name: 'Piotr Zielinski', number: 8 });
    store.getState().saveDocument();

    const persisted = JSON.parse(localStorage.getItem('tmc-studio-board') ?? '{}');
    expect(store.getState().isDirty).toBe(true);
    expect(persisted.squad).toHaveLength(2);
    expect(persisted.squad[1]).toMatchObject({ name: 'Piotr Zielinski', number: 8, team: 'home' });
  });
});
