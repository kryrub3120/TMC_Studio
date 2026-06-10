/**
 * Integration tests: Sprint C — renumberAllArrows + pushHistory evidence
 *
 * These tests create a REAL Zustand store instance and verify:
 * 1. renumberAllArrows assigns 1..N and does NOT push history
 * 2. deleteSelected deletes, renumbers, and creates ONE history snapshot
 * 3. toggleAutoNumbering toggles, renumbers, and creates ONE history snapshot
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AppState } from '../../types';
import {
  createElementsSlice,
  createHistorySlice,
  createDocumentSlice,
  createSelectionSlice,
  createStepsSlice,
  createGroupsSlice,
  createDrawingSlice,
} from '../index';

// ---------------------------------------------------------------------------
// Helper: build a minimal Zustand store (same composition as the real one)
// ---------------------------------------------------------------------------

function createTestStore() {
  return create<AppState>()(
    subscribeWithSelector(
      (...a) => {
        const documentSlice = createDocumentSlice(...a);
        const initialElements = documentSlice.document.steps[0]?.elements ?? [];

        return {
          ...documentSlice,
          ...createElementsSlice(...a),
          elements: initialElements,
          ...createSelectionSlice(...a),
          ...createHistorySlice(...a),
          history: [{ elements: initialElements, selectedIds: [] }],
          historyIndex: 0,
          ...createStepsSlice(...a),
          ...createGroupsSlice(...a),
          ...createDrawingSlice(...a),
        };
      },
    ),
  );
}

// ---------------------------------------------------------------------------
// HELPERS: create arrow elements
// ---------------------------------------------------------------------------

function makeArrow(
  id: string,
  overrides: Partial<import('@tmc/core').ArrowElement> = {},
): import('@tmc/core').ArrowElement {
  return {
    id,
    type: 'arrow',
    arrowType: 'pass',
    startPoint: { x: 100, y: 200 },
    endPoint: { x: 300, y: 200 },
    color: '#1a1a1a',
    strokeWidth: 4,
    ...overrides,
  };
}

function makePlayer(id: string): import('@tmc/core').PlayerElement {
  return {
    id,
    type: 'player',
    position: { x: 100, y: 100 },
    team: 'home',
    number: 1,
    color: '#ef4444',
  };
}

// ---------------------------------------------------------------------------
// TEST: renumberAllArrows does NOT push history
// ---------------------------------------------------------------------------

describe('renumberAllArrows — real store', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('renumbers 3 arrows to 1,2,3 in insertion order', () => {
    // Add elements directly to avoid pushHistory from addElement
    store.setState({
      elements: [
        makeArrow('a1', { showNumber: true, number: 10 }),
        makeArrow('a2', { showNumber: true, number: 5 }),
        makeArrow('a3', { showNumber: true, number: 99 }),
      ],
    });

    store.getState().renumberAllArrows();

    const arrows = store
      .getState()
      .elements.filter((e: any) => e.type === 'arrow') as any[];
    expect(arrows[0].number).toBe(1);
    expect(arrows[1].number).toBe(2);
    expect(arrows[2].number).toBe(3);
  });

  it('does NOT increase history length (no pushHistory call)', () => {
    store.setState({
      elements: [
        makeArrow('a1', { showNumber: true, number: 10 }),
        makeArrow('a2', { showNumber: true, number: 5 }),
      ],
    });
    // Reset history to known state
    store.setState({
      history: [],
      historyIndex: -1,
    });

    store.getState().renumberAllArrows();

    // renumberAllArrows must NOT call pushHistory, so history stays empty
    expect(store.getState().history.length).toBe(0);
    expect(store.getState().historyIndex).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// TEST: deleteSelected + renumber + ONE pushHistory
// ---------------------------------------------------------------------------

describe('deleteSelected — real store', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('deletes one arrow and renumbers the rest', () => {
    store.setState({
      elements: [
        makeArrow('a1', { showNumber: true, number: 1 }),
        makeArrow('a2', { showNumber: true, number: 2 }),
        makeArrow('a3', { showNumber: true, number: 3 }),
      ],
      selectedIds: ['a2'],
    });

    store.getState().deleteSelected();

    const arrows = store
      .getState()
      .elements.filter((e: any) => e.type === 'arrow') as any[];
    expect(arrows).toHaveLength(2);
    expect(arrows[0].id).toBe('a1');
    expect(arrows[0].number).toBe(1);
    expect(arrows[1].id).toBe('a3');
    expect(arrows[1].number).toBe(2);
  });

  it('creates EXACTLY ONE history snapshot', () => {
    store.setState({
      elements: [
        makeArrow('a1', { showNumber: true, number: 1 }),
        makeArrow('a2', { showNumber: true, number: 2 }),
      ],
      selectedIds: ['a1'],
      history: [],
      historyIndex: -1,
    });

    store.getState().deleteSelected();

    // deleteSelected should push ONE history entry
    expect(store.getState().history.length).toBe(1);
    expect(store.getState().historyIndex).toBe(0);
  });

  it('deleting non-numbered arrows does NOT trigger renumber', () => {
    store.setState({
      elements: [
        makeArrow('a1', { showNumber: true, number: 1 }),
        makePlayer('p1'),
      ],
      selectedIds: ['p1'],
      history: [],
      historyIndex: -1,
    });

    store.getState().deleteSelected();

    // Arrow should be untouched
    const arrow = store
      .getState()
      .elements.find((e: any) => e.type === 'arrow') as any;
    expect(arrow.number).toBe(1);

    // One history snapshot for the delete
    expect(store.getState().history.length).toBe(1);
  });

  it('does nothing when nothing selected', () => {
    store.setState({
      elements: [makeArrow('a1', { showNumber: true, number: 1 })],
      selectedIds: [],
      history: [{ elements: [], selectedIds: [] }],
      historyIndex: 0,
    });

    store.getState().deleteSelected();

    // Nothing changed
    expect(store.getState().elements).toHaveLength(1);
    expect(store.getState().historyIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TEST: toggleAutoNumbering + renumber + ONE pushHistory
// ---------------------------------------------------------------------------

describe('toggleAutoNumbering — real store', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
    // Set initial state with some numbered arrows
    store.setState({
      elements: [
        makeArrow('a1', { showNumber: true, number: 5 }),
        makeArrow('a2', { showNumber: true, number: 3 }),
      ],
      isAutoNumbering: false,
    });
  });

  it('sets isAutoNumbering to true', () => {
    expect(store.getState().isAutoNumbering).toBe(false);
    store.getState().toggleAutoNumbering();
    expect(store.getState().isAutoNumbering).toBe(true);
  });

  it('renumbers arrows when turning ON', () => {
    // Reset history so we can count snapshots
    store.setState({ history: [], historyIndex: -1 });

    store.getState().toggleAutoNumbering();

    const arrows = store
      .getState()
      .elements.filter((e: any) => e.type === 'arrow') as any[];
    // wasOff === true → renumberAllArrows called
    expect(arrows[0].number).toBe(1);
    expect(arrows[1].number).toBe(2);
  });

  it('creates EXACTLY ONE history snapshot', () => {
    store.setState({ history: [], historyIndex: -1 });

    store.getState().toggleAutoNumbering();

    // Toggle + renumber should produce exactly ONE history snapshot
    expect(store.getState().history.length).toBe(1);
    expect(store.getState().historyIndex).toBe(0);
  });

  it('turning OFF does NOT renumber arrows', () => {
    // First turn ON
    store.getState().toggleAutoNumbering();
    const arrowsAfterOn = store
      .getState()
      .elements.filter((e: any) => e.type === 'arrow') as any[];
    expect(arrowsAfterOn[0].number).toBe(1); // was renumbered

    // Turn OFF — wasOff is false, so renumberAllArrows should NOT be called
    store.getState().toggleAutoNumbering();
    const arrowsAfterOff = store
      .getState()
      .elements.filter((e: any) => e.type === 'arrow') as any[];
    // Numbers should stay as they were (no renumber called)
    expect(arrowsAfterOff[0].number).toBe(1);
  });

  it('history snapshots: toggle ON creates 1 entry, toggle OFF creates another', () => {
    store.setState({ history: [], historyIndex: -1 });

    // Toggle ON → 1 snapshot
    store.getState().toggleAutoNumbering();
    expect(store.getState().history.length).toBe(1);

    // Toggle OFF → another snapshot
    store.getState().toggleAutoNumbering();
    expect(store.getState().history.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// TEST: toggleArrowNumber — OFF/ON preserves number, respects visible set
// ---------------------------------------------------------------------------

describe('toggleArrowNumber — real store', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('OFF/ON same single arrow preserves number 1', () => {
    store.setState({
      elements: [
        makeArrow('a1', { showNumber: true, number: 1 }),
      ],
    });

    // Toggle OFF
    store.getState().toggleArrowNumber('a1');
    let a1 = store.getState().elements.find((e: any) => e.id === 'a1') as any;
    expect(a1.showNumber).toBe(false);
    expect(a1.number).toBe(1); // number remembered

    // Toggle ON — should restore 1 (it's not taken by any visible arrow)
    store.getState().toggleArrowNumber('a1');
    a1 = store.getState().elements.find((e: any) => e.id === 'a1') as any;
    expect(a1.showNumber).toBe(true);
    expect(a1.number).toBe(1);
  });

  it('visible 1,2 + new toggle ON → gets 3', () => {
    store.setState({
      elements: [
        makeArrow('a1', { showNumber: true, number: 1 }),
        makeArrow('a2', { showNumber: true, number: 2 }),
        makeArrow('a3', { showNumber: false }), // no number, hidden
      ],
    });

    // Toggle ON arrow a3 (no stored number)
    store.getState().toggleArrowNumber('a3');
    const a3 = store.getState().elements.find((e: any) => e.id === 'a3') as any;
    expect(a3.showNumber).toBe(true);
    expect(a3.number).toBe(3); // max visible (2) + 1
  });

  it('arrow hidden with 3 restores 3 if not taken by visible arrows', () => {
    store.setState({
      elements: [
        makeArrow('a1', { showNumber: true, number: 1 }),
        makeArrow('a2', { showNumber: true, number: 2 }),
        makeArrow('a3', { showNumber: false, number: 3 }), // hidden, remembers 3
      ],
    });

    // Toggle ON — 3 is not used by any VISIBLE arrow, restore it
    store.getState().toggleArrowNumber('a3');
    const a3 = store.getState().elements.find((e: any) => e.id === 'a3') as any;
    expect(a3.showNumber).toBe(true);
    expect(a3.number).toBe(3);
  });

  it('arrow hidden with 3 gets 5 if visible arrows already use 1,2,3,4', () => {
    store.setState({
      elements: [
        makeArrow('a1', { showNumber: true, number: 1 }),
        makeArrow('a2', { showNumber: true, number: 2 }),
        makeArrow('a3', { showNumber: true, number: 3 }),
        makeArrow('a4', { showNumber: true, number: 4 }),
        makeArrow('a5', { showNumber: false, number: 3 }), // hidden with 3, but 3 is taken by visible a3
      ],
    });

    // Toggle ON — 3 is used by visible a3, so assign max visible (4) + 1 = 5
    store.getState().toggleArrowNumber('a5');
    const a5 = store.getState().elements.find((e: any) => e.id === 'a5') as any;
    expect(a5.showNumber).toBe(true);
    expect(a5.number).toBe(5);
  });

  it('creates exactly one history snapshot per toggle', () => {
    store.setState({
      elements: [
        makeArrow('a1', { showNumber: true, number: 1 }),
      ],
      history: [],
      historyIndex: -1,
    });

    store.getState().toggleArrowNumber('a1'); // OFF → 1 snapshot
    expect(store.getState().history.length).toBe(1);

    store.getState().toggleArrowNumber('a1'); // ON → 2nd snapshot
    expect(store.getState().history.length).toBe(2);
  });
});