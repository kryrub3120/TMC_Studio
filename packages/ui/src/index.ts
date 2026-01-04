/**
 * @tmc/ui - UI Components for TMC Studio
 */

// Core components
export { Button } from './Button.js';
export type { ButtonProps } from './Button.js';

// Legacy components (kept for backwards compatibility)
export { Toolbar } from './Toolbar.js';
export type { ToolbarProps } from './Toolbar.js';

export { RightPanel } from './RightPanel.js';
export type { RightPanelProps } from './RightPanel.js';

// New UI components (v2)
export { TopBar } from './TopBar.js';
export type { TopBarProps } from './TopBar.js';

export { RightInspector } from './RightInspector.js';
export type { RightInspectorProps, InspectorElement, ElementInList, LayerVisibility, LayerType } from './RightInspector.js';

export { BottomStepsBar } from './BottomStepsBar.js';
export type { BottomStepsBarProps, StepInfo, Duration } from './BottomStepsBar.js';

export { CommandPaletteModal } from './CommandPaletteModal.js';
export type { CommandPaletteModalProps, CommandAction, CommandCategory } from './CommandPaletteModal.js';

export { CheatSheetOverlay } from './CheatSheetOverlay.js';
export type { CheatSheetOverlayProps } from './CheatSheetOverlay.js';

export { ToastHint } from './ToastHint.js';
export type { ToastHintProps } from './ToastHint.js';

export { SelectionToolbar } from './SelectionToolbar.js';
export type { SelectionToolbarProps } from './SelectionToolbar.js';

export { ZoomWidget } from './ZoomWidget.js';
export type { ZoomWidgetProps } from './ZoomWidget.js';
