/**
 * @tmc/ui - UI Components for TMC Studio
 */

// i18n (zero-dep, react-i18next-compatible API)
export { LanguageProvider, useTranslation, translate, LANGUAGES } from './i18n.js';
export type { Language, TFunction } from './i18n.js';
export { LanguageSwitcher } from './LanguageSwitcher.js';

// Core components
export { Button } from './Button.js';
export type { ButtonProps } from './Button.js';

// Shared form primitives (Toggle, Section, SettingRow, Slider, Field, ColorSwatchRow, SegmentedControl)
export {
  Toggle,
  SettingRow,
  Section,
  Field,
  inputClass,
  Slider,
  ColorSwatchRow,
  SegmentedControl,
} from './primitives.js';
export type {
  ToggleProps,
  SettingRowProps,
  SectionProps,
  FieldProps,
  SliderProps,
  ColorSwatchRowProps,
  SegmentedOption,
  SegmentedControlProps,
} from './primitives.js';

// Legacy components (kept for backwards compatibility)
export { Toolbar } from './Toolbar.js';
export type { ToolbarProps } from './Toolbar.js';

export { RightPanel } from './RightPanel.js';
export type { RightPanelProps } from './RightPanel.js';

// New UI components (v2)
export { TopBar } from './TopBar.js';
export type { TopBarProps, ExportFormat } from './TopBar.js';

export { RightInspector } from './RightInspector.js';
export type { RightInspectorProps, InspectorElement, ElementInList, LayerVisibility, LayerType } from './RightInspector.js';

export { BottomStepsBar } from './BottomStepsBar.js';
export type { BottomStepsBarProps, StepInfo, Duration } from './BottomStepsBar.js';

export { SmartBottomBar } from './SmartBottomBar.js';
export type { SmartBottomBarProps } from './SmartBottomBar.js';

export { CommandPaletteModal } from './CommandPaletteModal.js';
export type { CommandPaletteModalProps, CommandAction, CommandCategory } from './CommandPaletteModal.js';

export { CheatSheetOverlay } from './CheatSheetOverlay.js';
export type { CheatSheetOverlayProps } from './CheatSheetOverlay.js';
export { ShortcutsHint } from './ShortcutsHint.js';
export type { ShortcutsHintProps } from './ShortcutsHint.js';
export { EmptyStateOverlay } from './EmptyStateOverlay.js';
export type { EmptyStateOverlayProps } from './EmptyStateOverlay.js';

export { ToastHint } from './ToastHint.js';
export type { ToastHintProps } from './ToastHint.js';

export { SelectionToolbar } from './SelectionToolbar.js';
export type { SelectionToolbarProps } from './SelectionToolbar.js';

export { ZoomWidget } from './ZoomWidget.js';
export type { ZoomWidgetProps } from './ZoomWidget.js';

export { TeamsPanel } from './TeamsPanel.js';
export type { TeamsPanelProps } from './TeamsPanel.js';

export { PitchPanel } from './PitchPanel.js';
export type { PitchPanelProps } from './PitchPanel.js';

export { OrganizationPanel } from './OrganizationPanel.js';
export type { OrganizationPanelProps, OrganizationMemberView, InvitationView, OrgRole, InvitationRole } from './OrganizationPanel.js';

export { QuickEditOverlay } from './QuickEditOverlay.js';
export type { QuickEditOverlayProps } from './QuickEditOverlay.js';

// Auth components
export { AuthModal } from './AuthModal.js';
export { UserMenu } from './UserMenu.js';
export { PricingModal } from './PricingModal.js';

// Pricing config (shared source of truth)
export { STRIPE_PRICES, DISPLAY_PRICES, SAVE_PERCENT, ANNUAL_SAVINGS, getSavingsText } from './pricingConfig.js';
export type { Cycle } from './pricingConfig.js';

// Squad Bench
export { SquadBench } from './SquadBench.js';
export type { SquadBenchProps } from './SquadBench.js';
export type { SquadPlayer } from '@tmc/core';
export { ProjectsDrawer } from './ProjectsDrawer.js';
export type { ProjectItem, FolderItem } from './ProjectsDrawer.js';
export { ContextMenu } from './ContextMenu.js';
export type { ContextMenuItem } from './ContextMenu.js';
export { FolderColorPicker } from './FolderColorPicker.js';

// Club Premium Onboarding (Sprint H3)
export { ClubWelcomeModal } from './ClubWelcomeModal.js';
export type { ClubWelcomeModalProps } from './ClubWelcomeModal.js';
export { FolderOptionsModal } from './FolderOptionsModal.js';
export { CreateFolderModal } from './CreateFolderModal.js';
export { SettingsModal } from './SettingsModal.js';
export type { SettingsTab } from './SettingsModal.js';
export { UpgradeSuccessModal } from './UpgradeSuccessModal.js';
export { LimitReachedModal } from './LimitReachedModal.js';
export { ConfirmModal } from './ConfirmModal.js';
export type { ConfirmModalProps } from './ConfirmModal.js';
export { Footer } from './Footer.js';
export { BottomSheet } from './BottomSheet.js';
export type { BottomSheetProps } from './BottomSheet.js';

export { OfflineBanner } from './OfflineBanner.js';
export type { OfflineBannerProps } from './OfflineBanner.js';

// Help sidebar (Sprint E)
export { FloatingHelpButton } from './FloatingHelpButton.js';
export type { FloatingHelpButtonProps } from './FloatingHelpButton.js';
export { HelpSidebar } from './HelpSidebar.js';
export type { HelpSidebarProps, ProjectSaveStatus } from './HelpSidebar.js';
export { SHORTCUT_SECTIONS, TOOL_ACTIONS, HELP_TIPS } from './helpSidebarData.js';
export type { HelpShortcutItem, HelpSection, ToolAction, HelpTip } from './helpSidebarData.js';

// FAQ (Sprint H2)
export { FaqSearch } from './FaqSearch.js';
export { FaqCategory } from './FaqCategory.js';
export { FaqItem } from './FaqItem.js';
export { getFaqForPlan, searchFaq, FAQ_CATEGORIES } from './helpFaqData.js';
export type { FaqCategory as FaqCategoryType, FaqItem as FaqItemType, FaqCta } from './helpFaqData.js';

// Tutorial (Sprint F + H1)
export { TutorialOverlay } from './TutorialOverlay.js';
export type { TutorialOverlayProps } from './TutorialOverlay.js';
export { getStepsForPlan, getStepForPlan, TUTORIAL_STEPS } from './tutorialSteps.js';
export type { TutorialStep, Plan, TutorialStepContent } from './tutorialSteps.js';

// Color utilities
export { SHARED_COLORS, getColorsForMode, sanitizeColorForPrint } from './colors.js';
