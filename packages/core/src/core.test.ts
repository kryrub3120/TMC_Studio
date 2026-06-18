/**
 * Smoke test for @tmc/core
 * Verifies that core types and utilities can be imported and used.
 */
import { describe, it, expect } from 'vitest';
import { createDocument } from './serialization.js';
import { generateId, createInitialBoard } from './board.js';
import { DEFAULT_PITCH_CONFIG } from './types.js';

describe('@tmc/core', () => {
  describe('createDocument', () => {
    it('creates a document with default name', () => {
      const doc = createDocument();
      expect(doc.name).toBe('Untitled Board');
      expect(doc.version).toBe('1.0.0');
      expect(doc.steps).toHaveLength(1);
      expect(doc.currentStepIndex).toBe(0);
    });

    it('creates a document with custom name', () => {
      const doc = createDocument('My Tactic');
      expect(doc.name).toBe('My Tactic');
    });

    it('has a valid createdAt timestamp', () => {
      const doc = createDocument();
      expect(new Date(doc.createdAt).getTime()).not.toBeNaN();
    });
  });

  describe('generateId', () => {
    it('generates a string id', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('generates unique ids', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('createInitialBoard', () => {
    it('returns an array of elements for a default pitch', () => {
      const elements = createInitialBoard(DEFAULT_PITCH_CONFIG);
      expect(Array.isArray(elements)).toBe(true);
    });
  });
});
