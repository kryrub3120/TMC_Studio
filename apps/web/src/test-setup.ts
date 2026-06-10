/**
 * Test setup for vitest
 * Provides browser-like environment for Zustand store tests
 */

import { vi } from 'vitest';

// Mock localStorage for serialization tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number): string | null => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Suppress logger output in tests
vi.mock('../lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock supabase module to avoid VITE_* env requirements
vi.mock('../lib/supabase', () => ({
  isSupabaseEnabled: () => false,
  createProject: vi.fn(),
  updateProject: vi.fn(),
  getProject: vi.fn(),
  getProjects: vi.fn(),
  getFolders: vi.fn(),
  createFolder: vi.fn(),
}));