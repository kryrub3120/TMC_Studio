/**
 * BottomStepsBar - Animation steps control bar
 * Shows step chips, play/loop controls, and duration dropdown
 */

import React, { useState } from 'react';

export type Duration = 0.6 | 0.8 | 1.2;

export interface StepInfo {
  id: string;
  label: string;
  index: number;
}

export interface BottomStepsBarProps {
  steps: StepInfo[];
  currentStepIndex: number;
  isPlaying: boolean;
  isLooping: boolean;
  duration: number;
  onStepSelect: (index: number) => void;
  onAddStep: () => void;
  onDeleteStep: (index: number) => void;
  onRenameStep?: (index: number, newName: string) => void;
  onPlay: () => void;
  onPause: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onToggleLoop: () => void;
  onDurationChange: (duration: number) => void;
}

/** Play icon */
const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

/** Pause icon */
const PauseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

/** Skip back icon */
const SkipBackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="19 20 9 12 19 4 19 20" fill="currentColor" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);

/** Skip forward icon */
const SkipForwardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

/** Loop icon */
const LoopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

/** Plus icon */
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/** X close icon */
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** Duration options */
const durationOptions: { value: Duration; label: string }[] = [
  { value: 0.6, label: '0.6s' },
  { value: 0.8, label: '0.8s' },
  { value: 1.2, label: '1.2s' },
];

/** BottomStepsBar Component */
export const BottomStepsBar: React.FC<BottomStepsBarProps> = ({
  steps,
  currentStepIndex,
  isPlaying,
  isLooping,
  duration,
  onStepSelect,
  onAddStep,
  onDeleteStep,
  onRenameStep,
  onPlay,
  onPause,
  onPrevStep,
  onNextStep,
  onToggleLoop,
  onDurationChange,
}) => {
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Handle double-click to start editing
  const handleDoubleClick = (index: number, currentLabel: string) => {
    if (!onRenameStep) return;
    setEditingIndex(index);
    setEditValue(currentLabel || `Step ${index + 1}`);
  };
  
  // Handle blur or Enter to finish editing
  const finishEditing = () => {
    if (editingIndex !== null && onRenameStep && editValue.trim()) {
      onRenameStep(editingIndex, editValue.trim());
    }
    setEditingIndex(null);
    setEditValue('');
  };
  
  // Handle keyboard in edit input
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setEditValue('');
    }
  };

  return (
    <footer className="h-14 px-4 flex items-center justify-between bg-surface border-t border-border z-bottombar">
      {/* Left: Playback Controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={onPrevStep}
          disabled={currentStepIndex === 0}
          className="p-2 rounded-md text-muted hover:text-text hover:bg-surface2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous Step (←)"
        >
          <SkipBackIcon className="w-4 h-4" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="p-2 rounded-md bg-accent text-white hover:bg-accent-hover transition-colors"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <PauseIcon className="w-4 h-4" />
          ) : (
            <PlayIcon className="w-4 h-4" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNextStep}
          disabled={currentStepIndex === steps.length - 1}
          className="p-2 rounded-md text-muted hover:text-text hover:bg-surface2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next Step (→)"
        >
          <SkipForwardIcon className="w-4 h-4" />
        </button>

        {/* Loop Toggle */}
        <button
          onClick={onToggleLoop}
          className={`p-2 rounded-md transition-colors ${
            isLooping 
              ? 'text-accent bg-accent/10' 
              : 'text-muted hover:text-text hover:bg-surface2'
          }`}
          title="Loop (L)"
        >
          <LoopIcon className="w-4 h-4" />
        </button>

        {/* Duration Dropdown */}
        <div className="relative ml-2">
          <button
            onClick={() => setShowDurationDropdown(!showDurationDropdown)}
            className="px-2 py-1 rounded-md text-xs text-muted hover:text-text hover:bg-surface2 border border-border transition-colors"
          >
            {duration}s
          </button>
          
          {showDurationDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDurationDropdown(false)} 
              />
              <div className="absolute bottom-full left-0 mb-1 py-1 bg-surface rounded-md shadow-lg border border-border z-20 min-w-[60px]">
                {durationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onDurationChange(opt.value);
                      setShowDurationDropdown(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                      duration === opt.value 
                        ? 'text-accent bg-accent/10' 
                        : 'text-muted hover:text-text hover:bg-surface2'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Step Chips */}
      <div className="flex items-center gap-2 flex-1 justify-center overflow-x-auto px-4">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className="group relative flex-shrink-0"
          >
            {editingIndex === index ? (
              // Editing mode - inline input
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={handleEditKeyDown}
                autoFocus
                className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  bg-surface border border-accent outline-none
                  text-text min-w-[60px] max-w-[120px]
                `}
              />
            ) : (
              // Normal mode - chip button
              <button
                onClick={() => onStepSelect(index)}
                onDoubleClick={() => handleDoubleClick(index, step.label)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium
                  transition-all duration-fast pr-6 group-hover:pr-7
                  ${index === currentStepIndex
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-surface2 text-muted hover:text-text hover:bg-border'}
                `}
                title={onRenameStep ? 'Double-click to rename' : undefined}
              >
                {step.label || `Step ${index + 1}`}
              </button>
            )}
            
            {/* Delete button - only show if more than 1 step and not editing */}
            {steps.length > 1 && editingIndex !== index && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteStep(index);
                }}
                className={`
                  absolute right-1 top-1/2 -translate-y-1/2
                  w-4 h-4 rounded-full
                  flex items-center justify-center
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-fast
                  ${index === currentStepIndex
                    ? 'text-white/70 hover:text-white hover:bg-white/20'
                    : 'text-muted hover:text-red-400 hover:bg-red-500/10'}
                `}
                title="Delete step (X)"
              >
                <XIcon className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
        
        {/* Add Step Button */}
        <button
          onClick={onAddStep}
          className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-dashed border-border text-muted hover:border-accent hover:text-accent transition-colors flex items-center justify-center"
          title="Add Step (N)"
        >
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Step Counter */}
      <div className="text-xs text-muted tabular-nums">
        Step {currentStepIndex + 1} / {steps.length}
      </div>
    </footer>
  );
};

export default BottomStepsBar;
