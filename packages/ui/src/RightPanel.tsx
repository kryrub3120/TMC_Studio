/**
 * Right panel component for element properties
 */

import React from 'react';

export interface RightPanelProps {
  selectedCount: number;
  selectedElement?: {
    id: string;
    type: 'player' | 'ball';
    team?: 'home' | 'away';
    number?: number;
    label?: string;
    x: number;
    y: number;
  };
  onUpdateElement?: (updates: { number?: number; label?: string }) => void;
}

/** Right panel showing selection info and properties */
export const RightPanel: React.FC<RightPanelProps> = ({
  selectedCount,
  selectedElement,
  onUpdateElement,
}) => {
  return (
    <div className="w-64 h-full bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
          Properties
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedCount === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">
            <p>No element selected</p>
            <p className="mt-2 text-xs">
              Click on a player or ball to see its properties
            </p>
          </div>
        ) : selectedCount > 1 ? (
          <div className="text-gray-400 text-sm">
            <p className="font-medium text-white">{selectedCount} elements selected</p>
            <p className="mt-2 text-xs text-gray-500">
              Multiple selection mode. Use Ctrl+D to duplicate or Delete to remove.
            </p>
          </div>
        ) : selectedElement ? (
          <div className="space-y-4">
            {/* Element type */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                Type
              </label>
              <div className="text-sm text-white capitalize flex items-center gap-2">
                {selectedElement.type === 'player' ? (
                  <>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          selectedElement.team === 'home' ? '#e63946' : '#457b9d',
                      }}
                    />
                    {selectedElement.team === 'home' ? 'Home' : 'Away'} Player
                  </>
                ) : (
                  <>
                    <span className="w-3 h-3 rounded-full bg-white border border-gray-600" />
                    Ball
                  </>
                )}
              </div>
            </div>

            {/* Player number */}
            {selectedElement.type === 'player' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={selectedElement.number ?? 1}
                  onChange={(e) =>
                    onUpdateElement?.({ number: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Player label */}
            {selectedElement.type === 'player' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Label (optional)
                </label>
                <input
                  type="text"
                  value={selectedElement.label ?? ''}
                  onChange={(e) => onUpdateElement?.({ label: e.target.value })}
                  placeholder="e.g. Messi"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                />
              </div>
            )}

            {/* Position */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                Position
              </label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-700 px-3 py-2 rounded-lg">
                  <span className="text-gray-400">X:</span>{' '}
                  <span className="text-white">{Math.round(selectedElement.x)}</span>
                </div>
                <div className="bg-gray-700 px-3 py-2 rounded-lg">
                  <span className="text-gray-400">Y:</span>{' '}
                  <span className="text-white">{Math.round(selectedElement.y)}</span>
                </div>
              </div>
            </div>

            {/* ID (for debugging) */}
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                ID
              </label>
              <div className="text-xs text-gray-500 font-mono bg-gray-700 px-2 py-1 rounded truncate">
                {selectedElement.id}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer with tips */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
        <p className="font-medium text-gray-400 mb-2">Shortcuts</p>
        <ul className="space-y-1">
          <li>
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">Shift</kbd> + click = multi-select
          </li>
          <li>
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-300">Del</kbd> = delete selection
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RightPanel;
