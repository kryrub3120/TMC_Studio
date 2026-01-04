/**
 * Main toolbar component
 */

import React from 'react';
import { Button } from './Button.js';

export interface ToolbarProps {
  onAddPlayer: (team: 'home' | 'away') => void;
  onAddBall: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onLoad: () => void;
  onNewBoard: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
}

/** Icons as simple SVG components */
const Icons = {
  Plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Copy: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Undo: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  Redo: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
    </svg>
  ),
  Save: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  File: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Ball: () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  ),
};

/** Main toolbar for the tactical board */
export const Toolbar: React.FC<ToolbarProps> = ({
  onAddPlayer,
  onAddBall,
  onDuplicate,
  onDelete,
  onUndo,
  onRedo,
  onSave,
  onLoad,
  onNewBoard,
  canUndo,
  canRedo,
  hasSelection,
}) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-800 border-b border-gray-700">
      {/* Logo/Title */}
      <div className="flex items-center gap-2 mr-4">
        <span className="text-lg font-bold text-white">TMC</span>
        <span className="text-xs text-gray-400">Studio</span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-600" />

      {/* File operations */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={<Icons.File />}
          onClick={onNewBoard}
          title="New Board"
        >
          New
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icons.Save />}
          onClick={onSave}
          title="Save (Ctrl+S)"
        >
          Save
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icons.Upload />}
          onClick={onLoad}
          title="Load"
        >
          Load
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-600" />

      {/* Add elements */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={<Icons.Plus />}
          onClick={() => onAddPlayer('home')}
          title="Add Home Player (P)"
          className="text-red-400 hover:text-red-300"
        >
          Home
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icons.Plus />}
          onClick={() => onAddPlayer('away')}
          title="Add Away Player"
          className="text-blue-400 hover:text-blue-300"
        >
          Away
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icons.Ball />}
          onClick={onAddBall}
          title="Add Ball (B)"
        >
          Ball
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-600" />

      {/* Edit operations */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={<Icons.Copy />}
          onClick={onDuplicate}
          disabled={!hasSelection}
          title="Duplicate (Ctrl+D)"
        >
          Duplicate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icons.Trash />}
          onClick={onDelete}
          disabled={!hasSelection}
          title="Delete (Del)"
          className="text-red-400 hover:text-red-300"
        >
          Delete
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-600" />

      {/* History */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={<Icons.Undo />}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<Icons.Redo />}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-gray-500">
        <span className="hidden md:inline">
          P: Player | B: Ball | Ctrl+D: Duplicate | Ctrl+Z: Undo
        </span>
      </div>
    </div>
  );
};

export default Toolbar;
