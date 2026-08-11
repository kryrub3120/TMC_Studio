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

  it('applies saved defaults to balls, text and each equipment type', () => {
    const store = createTestStore();
    useUIStore.setState({
      ballDefaults: { color: '#00ff00', strokeColor: '#112233', strokeWidth: 5, radius: 18 },
      textDefaults: { fontSize: 30, fontFamily: 'Inter', color: '#111111', backgroundColor: '#eeeeee', bold: true, italic: false, textAlign: 'center' },
      equipmentDefaults: { cone: { variant: 'flat', rotation: 45, color: '#abcdef', scale: 1.6 } },
    });

    store.getState().addBallAtCursor();
    store.getState().addTextAtCursor();
    store.getState().addEquipmentAtCursor('cone');

    expect(store.getState().elements.find((element) => element.type === 'ball')).toMatchObject({
      color: '#00ff00', strokeColor: '#112233', strokeWidth: 5, radius: 18,
    });
    expect(store.getState().elements.find((element) => element.type === 'text')).toMatchObject({
      fontSize: 30, color: '#111111', backgroundColor: '#eeeeee', bold: true, textAlign: 'center',
    });
    expect(store.getState().elements.find((element) => element.type === 'equipment')).toMatchObject({
      equipmentType: 'cone', variant: 'flat', rotation: 45, color: '#abcdef', scale: 1.6,
    });
  });

  it('applies the saved player appearance to a new player', () => {
    const store = createTestStore();
    store.setState({ elements: [] });
    store.getState().updatePlayerDefaults({
      homeShape: 'diamond',
      homeColor: '#123456',
      radius: 24,
      fontSize: 18,
      textColor: '#fedcba',
      opacity: 0.7,
      showLabel: true,
    });
    expect(store.getState().document.playerDefaults).toMatchObject({ homeShape: 'diamond', radius: 24 });
    store.getState().addPlayerAtCursor('home');

    expect(store.getState().elements.find((element) => element.type === 'player')).toMatchObject({
      shape: 'diamond', color: '#123456', radius: 24, fontSize: 18,
      textColor: '#fedcba', opacity: 0.7, showLabel: true,
    });
  });

  it('saves and restores a complete named lineup', () => {
    const store = createTestStore();
    store.setState({ elements: [] });
    store.getState().addPlayerFromSquad('home', 'Jan Kowalski', 7, { x: 220, y: 180 });
    store.getState().addPlayerFromSquad('home', 'Piotr Nowak', 9, { x: 420, y: 280 });

    expect(store.getState().saveLineupPreset(0, 'home', 'Pressing XI')).toBe(true);
    store.setState({ elements: [] });
    expect(store.getState().applyLineupPreset(0)).toBe(true);

    const players = store.getState().elements.filter((element) => element.type === 'player');
    expect(players).toHaveLength(2);
    expect(players.map((player) => player.type === 'player' ? player.label : '')).toEqual(['Jan Kowalski', 'Piotr Nowak']);
    expect(store.getState().document.lineupPresets?.[0]?.name).toBe('Pressing XI');
  });
});
