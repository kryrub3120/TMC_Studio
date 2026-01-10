/**
 * Create Folder Modal - Create new project folder
 */

import { useState } from 'react';
import { FolderColorPicker } from './FolderColorPicker';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}

export function CreateFolderModal({
  isOpen,
  onClose,
  onCreate,
}: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6'); // Default blue

  if (!isOpen) return null;

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), color);
      // Reset form
      setName('');
      setColor('#3b82f6');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-text mb-4">Create Folder</h3>

        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted mb-2">
            Folder Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Tactics, Training Drills..."
            autoFocus
            maxLength={100}
            className="w-full px-4 py-2.5 bg-surface2 border border-border/50 rounded-lg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        {/* Color Picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted mb-2">
            Folder Color
          </label>
          <FolderColorPicker currentColor={color} onSelectColor={setColor} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted hover:text-text bg-surface2 hover:bg-surface rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 disabled:bg-accent/50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Create Folder
          </button>
        </div>
      </div>
    </div>
  );
}
