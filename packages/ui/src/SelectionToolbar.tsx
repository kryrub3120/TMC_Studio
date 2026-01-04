/**
 * SelectionToolbar - Figma-style floating toolbar above selected element
 * Provides quick actions: Duplicate, Delete, Bring Front/Back
 */

import React from 'react';

export interface SelectionToolbarProps {
  /** Position relative to canvas */
  position: { x: number; y: number };
  /** Canvas offset (for positioning) */
  canvasOffset?: { x: number; y: number };
  /** Whether to flip toolbar below element (near top edge) */
  flipBelow?: boolean;
  /** Callbacks */
  onDuplicate?: () => void;
  onDelete?: () => void;
  onBringFront?: () => void;
  onSendBack?: () => void;
}

/** Icons */
const DuplicateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const DeleteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const BringFrontIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="8" y="2" width="12" height="12" rx="2" />
    <rect x="4" y="10" width="12" height="12" rx="2" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

const SendBackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="10" width="12" height="12" rx="2" />
    <rect x="8" y="2" width="12" height="12" rx="2" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

/** Toolbar Button */
const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}> = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-1.5 rounded-md transition-colors ${
      danger
        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
        : 'text-muted hover:text-text hover:bg-surface2'
    }`}
  >
    {icon}
  </button>
);

/** Selection Toolbar Component */
export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  position,
  canvasOffset = { x: 0, y: 0 },
  flipBelow = false,
  onDuplicate,
  onDelete,
  onBringFront,
  onSendBack,
}) => {
  // Calculate absolute position
  const left = canvasOffset.x + position.x;
  const top = canvasOffset.y + position.y;

  return (
    <div
      className="absolute z-30 pointer-events-auto animate-in"
      style={{
        left: `${left}px`,
        top: flipBelow ? `${top + 40}px` : `${top - 44}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-0.5 px-1 py-0.5 bg-surface/95 backdrop-blur-md border border-border rounded-lg shadow-lg">
        {/* Duplicate */}
        <ToolbarButton
          icon={<DuplicateIcon className="w-4 h-4" />}
          label="Duplicate (⌘D)"
          onClick={onDuplicate}
        />
        
        {/* Divider */}
        <div className="w-px h-5 bg-border mx-0.5" />
        
        {/* Layer order */}
        <ToolbarButton
          icon={<BringFrontIcon className="w-4 h-4" />}
          label="Bring to Front"
          onClick={onBringFront}
        />
        <ToolbarButton
          icon={<SendBackIcon className="w-4 h-4" />}
          label="Send to Back"
          onClick={onSendBack}
        />
        
        {/* Divider */}
        <div className="w-px h-5 bg-border mx-0.5" />
        
        {/* Delete */}
        <ToolbarButton
          icon={<DeleteIcon className="w-4 h-4" />}
          label="Delete (Del)"
          onClick={onDelete}
          danger
        />
      </div>
      
      {/* Arrow pointing to element */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-surface border-border rotate-45 ${
          flipBelow ? '-top-1 border-t border-l' : '-bottom-1 border-b border-r'
        }`}
      />
    </div>
  );
};

export default SelectionToolbar;
