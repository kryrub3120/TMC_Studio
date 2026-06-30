/**
 * BoardPage - Main board page component
 * Pure composition - orchestrates all board-related sections
 */

import { useRef, useEffect, useState } from 'react';
import {
  RightInspector, 
  SmartBottomBar,
  CommandPaletteModal, 
  CheatSheetOverlay, 
  ShortcutsHint, 
  EmptyStateOverlay, 
  ToastHint, 
  ZoomWidget,
  OfflineBanner,
  FloatingHelpButton,
  HelpSidebar,
  TutorialOverlay,
  SquadBench,
  useTranslation,
} from '@tmc/ui';
import type { TutorialStep } from '@tmc/ui';
import type { PitchBoardPreset } from '@tmc/core';
import { getPitchBoardId, DEFAULT_PITCH_SETTINGS } from '@tmc/core';
import { getCanvasContextMenuItems, getContextMenuHeader } from '../../utils/canvasContextMenu';
import { ANIMATION_ENABLED } from '../../config/featureFlags';
import { useBoardStore } from '../../store';
import { useUIStore } from '../../store/useUIStore';
import { setThumbnailGenerator } from '../../store/slices/documentSlice';

import { BoardTopBarSection } from './BoardTopBarSection';
import { BoardCanvasSection } from './BoardCanvasSection';
import { BoardEditOverlays } from './BoardEditOverlays';
import { CanvasContextMenuOverlay, FocusModeExitBar } from './BoardOverlays';
import { useBoardPageState, type BoardPageProps } from '../routes/useBoardPageState';
import { useBoardPageHandlers } from './useBoardPageHandlers';
import { useAnimationPlayback, useInterpolation, useStageEventHandlers, useContextMenuHandler } from './useBoardPageEffects';
import { useViewportSync } from '../../hooks/useViewportSync';
import { auditShortcutConflicts } from '../../shortcuts/shortcutMap';

export { type BoardPageProps } from '../routes/useBoardPageState';

export function BoardPage(props: BoardPageProps) {
  const { t } = useTranslation();
  // Dev-time shortcut audit
  useEffect(() => { auditShortcutConflicts(); }, []);
  const {
    onOpenProjectsDrawer,
    onCloseProjectsDrawer,
    onCloseSettingsModal,
    onOpenAuthModal,
    onOpenSettingsModal,
    onOpenPricingModal,
    onRenameProject,
    appVersion,
    onNavigateFooter,
  } = props;

  // ─── Viewport transform ref (PR-UX-3 ETAP 1) ───────────────────────
  // BoardCanvasSection writes this every render; useStageEventHandlers reads it
  // to convert Stage screen coords → world coords without re-render coupling.
  const viewportTransformRef = useRef({ panX: 0, panY: 0, zoom: 1 });

  // State hook
  const state = useBoardPageState(props);

  // Board (pitch) selection from the TopBar dropdown. Switching a board resets
  // the drawing — confirm first, but only when there are elements to lose.
  const activeBoardId = getPitchBoardId(state.pitchSettings ?? DEFAULT_PITCH_SETTINGS);
  const handleSelectBoard = (board: PitchBoardPreset) => {
    const store = useBoardStore.getState();
    const apply = () => store.applyPitchBoard({ view: board.view, projection: board.projection });
    if (store.elements.length > 0 && activeBoardId !== board.id) {
      useUIStore.getState().showConfirmModal({
        title: t('pitchPanel.boardResetTitle'),
        description: t('pitchPanel.boardResetDesc'),
        confirmLabel: t('pitchPanel.boardResetConfirm'),
        danger: true,
        onConfirm: () => { apply(); useUIStore.getState().closeConfirmModal(); },
      });
    } else {
      apply();
    }
  };

  // ─── First element celebration ─────────────────────────────────────
  const [showCelebration, setShowCelebration] = useState(false);
  // Tutorial-driven: which toolbar dropdown to force open for the active step.
  const [tutorialMenu, setTutorialMenu] = useState<string | null>(null);
  const prevElementCount = useRef(0);
  useEffect(() => {
    if (prevElementCount.current === 0 && state.elements.length > 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2200);
      return () => clearTimeout(timer);
    }
    prevElementCount.current = state.elements.length;
  }, [state.elements.length]);
  
  // Handlers hook
  const handlers = useBoardPageHandlers({
    ...state,
    handleExportPNG: state.exportController.exportPNG,
    handleExportAllSteps: state.exportController.exportAllSteps,
    handleExportGIF: state.exportController.exportGIF,
    handleExportPDF: state.exportController.exportPDF,
    handleExportSVG: state.exportController.exportSVG,
    stepsCount: state.boardDoc.steps.length,
    hideMenu: state.contextMenu.hideMenu,
    menuElementId: state.contextMenu.menuState.elementId,
    clearSelection: state.clearSelection,
  });

  // Animation playback
  useAnimationPlayback({
    isPlaying: state.isPlaying,
    isLooping: state.isLooping,
    stepDuration: state.stepDuration,
    stepsCount: state.stepsData.length,
    pause: state.pause,
    goToStep: state.goToStep,
    nextStep: state.nextStep,
    setAnimationProgress: state.setAnimationProgress,
  });

  // Interpolation helpers
  const interpolation = useInterpolation({
    isPlaying: state.isPlaying,
    progress01: state.animationProgress,
    currentStepIndex: state.currentStepIndex,
    steps: state.boardDoc.steps,
  });

  // Stage event handlers
  const stageHandlers = useStageEventHandlers({
    drawingController: state.drawingController,
    canvasEventsController: state.canvasEventsController,
    activeTool: state.activeTool,
    clearSelection: state.clearSelection,
    marqueeStart: state.canvasEventsController.marqueeStart,
    // ✅ ETAP 1: Stable getter for viewport transform (no re-render on pan/zoom)
    getViewportTransform: () => viewportTransformRef.current,
  });

  // Context menu handler
  const contextMenuHandler = useContextMenuHandler({
    elements: state.elements,
    selectedIds: state.selectedIds,
    selectElement: state.selectElement,
    clearSelection: state.clearSelection,
    showMenu: state.contextMenu.showMenu,
  });

  // Viewport sync (responsive breakpoints)
  useViewportSync();

  // ─── Register thumbnail generator (Sprint G) ──────────────────────
  useEffect(() => {
    setThumbnailGenerator(async () => {
      const stage = state.stageRef.current;
      if (!stage) return null;
      try {
        const dataUrl = stage.toDataURL({ mimeType: 'image/png', pixelRatio: 0.25 });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return blob;
      } catch {
        return null;
      }
    });
    return () => setThumbnailGenerator(null);
  }, [state.stageRef]);

  // Tutorial trigger (Sprint F): show once per user.
  // New boards include an initial lineup, so this cannot depend on elements.length.
  // Not when print mode, cheat sheet, or help sidebar are active
  useEffect(() => {
    const canShow = !state.isPrintMode
      && !state.cheatSheetVisible
      && !state.helpSidebarOpen;
    const shouldShow = canShow
      && (state.tutorialForceVisible || !state.tutorialCompleted);
    state.setShowTutorial(shouldShow);
  }, [
    state.tutorialCompleted, state.tutorialForceVisible, state.isPrintMode,
    state.cheatSheetVisible, state.helpSidebarOpen, state.setShowTutorial,
  ]);

  const handleTutorialDismiss = () => {
    setTutorialMenu(null);
    onCloseProjectsDrawer();
    onCloseSettingsModal();
    state.setTutorialCompleted(true);
    state.setShowTutorial(false);
    // UX-C: restore user's original Squad Bench preference after tutorial
    if (tutorialSquadPreference !== null) {
      state.setSquadVisible(tutorialSquadPreference);
      tutorialSquadPreference = null;
    }
  };

  const handleTutorialComplete = () => {
    setTutorialMenu(null);
    onCloseProjectsDrawer();
    onCloseSettingsModal();
    state.setTutorialCompleted(true);
    state.setShowTutorial(false);
    // UX-C: restore user's original Squad Bench preference after tutorial
    if (tutorialSquadPreference !== null) {
      state.setSquadVisible(tutorialSquadPreference);
      tutorialSquadPreference = null;
    }
  };

  // UX-C: track original Squad Bench preference for tutorial restore
  let tutorialSquadPreference: boolean | null = null;

  // Reveal the real element each tutorial step describes, so the coach sees the
  // actual panel open — not just a label floating over a collapsed strip.
  const handleTutorialStepShow = (step: TutorialStep) => {
    // Open the real toolbar dropdown for steps that describe one, so the coach
    // sees the actual menu — not a mock. null closes any open tutorial menu.
    const menuForDemo: Record<string, string> = {
      shortcuts: 'players',
      arrows: 'arrows',
      equipment: 'equipment',
      export: 'export',
    };
    setTutorialMenu(menuForDemo[step.demo] ?? null);

    // Full-screen overlays (Projects drawer + Settings modal): open only on the
    // step that describes them, and make sure they're closed on every other step.
    if (step.demo === 'save') onOpenProjectsDrawer();
    else onCloseProjectsDrawer();
    if (step.demo === 'team') onOpenSettingsModal();
    else onCloseSettingsModal();

    switch (step.demo) {
      case 'orientation': {
        if (!state.inspectorOpen) state.setInspectorOpen(true);
        // Select a player so the Inspector shows the real orientation/vision
        // controls instead of the empty quick-actions panel.
        const firstPlayer = state.elements.find((el: any) => el.type === 'player');
        if (firstPlayer) state.selectElement(firstPlayer.id, false);
        break;
      }
      case 'squad':
        // UX-C: save original preference, temporarily show bench
        if (tutorialSquadPreference === null) {
          tutorialSquadPreference = state.squadVisible;
        }
        if (!state.squadVisible) state.setSquadVisible(true);
        break;
      case 'steps':
        if (state.bottomBarHeight < 140) state.setBottomBarHeight(140);
        break;
      default:
        break;
    }
  };

  const handleRestartTutorial = () => {
    state.replayTutorial();
    state.setHelpSidebarOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      {/* Top Bar */}
      <BoardTopBarSection
        tutorialMenu={tutorialMenu}
        projectName={state.boardDoc.name}
        isSaved={state.isSaved}
        isSyncing={state.isSaving}
        stepInfo={state.boardDoc.steps.length > 1 ? `Step ${state.currentStepIndex + 1}/${state.boardDoc.steps.length}` : undefined}
        authIsPro={state.authIsPro}
        authIsAuthenticated={state.authIsAuthenticated}
        userInitials={state.authUser?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || (state.authIsAuthenticated ? 'U' : '?')}
        focusMode={state.focusMode}
        theme={state.theme}
        isOnline={state.isOnline}
        onExport={(format) => {
          switch (format) {
            case 'png': state.exportController.exportPNG(); break;
            case 'png-all': state.exportController.exportAllSteps(); break;
            case 'jpg': state.exportController.exportJPG(); break;
            case 'pdf': state.exportController.exportPDF(); break;
            case 'gif': state.exportController.exportGIF(); break;
          }
        }}
        onToggleFocus={state.toggleFocusMode}
        onToggleTheme={state.toggleTheme}
        onOpenPalette={state.openCommandPalette}
        onOpenHelp={() => {
            // Mutex: close Inspector on mobile when opening CheatSheet
            if (!state.cheatSheetVisible && state.inspectorOpen && (state.breakpoint === 'sm' || state.breakpoint === 'md')) {
              state.setInspectorOpen(false);
            }
            state.toggleCheatSheet();
          }}
        onSelectArrowTool={(type) => {
          const tool = type === 'pass'
            ? 'arrow-pass'
            : type === 'run'
              ? 'arrow-run'
              : type === 'shoot'
                ? 'arrow-shoot'
                : 'arrow-dribble';
          state.setActiveTool(tool);
        }}
        onSelectZoneTool={(shape) => {
          state.setActiveTool(
            shape === 'ellipse' ? 'zone-ellipse' : shape === 'polygon' ? 'zone-polygon' : 'zone'
          );
        }}
        onAddEquipment={state.addEquipmentAtCursor}
        onAddBall={(variant) => (variant === 'cluster' ? state.addBallGroupAtCursor() : state.addBallAtCursor())}
        onAddPlayer={(team) => state.addPlayerAtCursor(team)}
        onOpenSquadSettings={() => onOpenSettingsModal('squad')}
        onOpenProjects={onOpenProjectsDrawer}
        onSelectBoard={handleSelectBoard}
        activeBoardId={activeBoardId}
        onRenameProject={onRenameProject}
        onToggleInspector={state.toggleInspector}
        onOpenAccount={state.authIsAuthenticated ? onOpenSettingsModal : onOpenAuthModal}
        onUpgrade={onOpenPricingModal}
        onLogout={state.authIsAuthenticated ? state.signOut : undefined}
        onOpenSettings={() => onOpenSettingsModal('preferences')}
        // DEV-ONLY: "Test login" plan switcher in the account menu.
        // Remove this prop (and useAuthStore.devLogin) once done testing.
        onDevLogin={import.meta.env.DEV ? state.devLogin : undefined}
        // DEV-ONLY: "Clear dev data" button in the account menu.
        // Remove this prop (and useAuthStore.devClearData) once done testing.
        onClearDevData={import.meta.env.DEV ? state.devClearData : undefined}
      />

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDrop={(e) => {
          e.preventDefault();
          try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data && data.name !== undefined && data.number !== undefined) {
              const stage = state.stageRef.current;
              const rect = stage?.container().getBoundingClientRect();
              const { panX, panY, zoom } = viewportTransformRef.current;
              const dropPosition = rect && zoom > 0
                ? {
                    x: (e.clientX - rect.left - panX) / zoom,
                    y: (e.clientY - rect.top - panY) / zoom,
                  }
                : undefined;
              state.addPlayerFromSquad(data.team, data.name, data.number, dropPosition, data.isGoalkeeper === true || data.number === 1);
            }
          } catch { /* not a squad player drop */ }
        }}
      >
        {/* Canvas area */}
      <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden p-2 sm:p-3 relative">
          <BoardCanvasSection
            stageRef={state.stageRef}
            canvasWidth={state.canvasWidth}
            canvasHeight={state.canvasHeight}
            zoom={state.effectiveZoom}
            pitchConfig={state.pitchConfig}
            pitchSettings={state.pitchSettings}
            teamSettings={state.teamSettings ?? { home: { primaryColor: '#3b82f6', secondaryColor: '#1e40af', name: 'Home' }, away: { primaryColor: '#ef4444', secondaryColor: '#b91c1c', name: 'Away' } }}
            playerOrientationSettings={state.playerOrientationSettings}
            gridVisible={state.gridVisible}
            layerVisibility={state.layerVisibility}
            hiddenByGroup={state.hiddenByGroup}
            elements={state.elements}
            selectedIds={state.selectedIds}
            isElementLocked={state.isElementLocked}
            isPlaying={state.isPlaying}
            activeTool={state.activeTool}
            isPrintMode={state.isPrintMode}
            marqueeStart={state.canvasEventsController.marqueeStart}
            marqueeEnd={state.canvasEventsController.marqueeEnd}
            drawingStart={state.drawingController.drawingStart}
            drawingEnd={state.drawingController.drawingEnd}
            freehandPoints={state.drawingController.freehandPoints}
            polygonPoints={state.drawingController.polygonPoints}
            polygonCursor={state.drawingController.polygonCursor}
            animationProgress={state.animationProgress}
            nextStepElements={interpolation.nextStepElements}
            emptyStateOverlay={
              <EmptyStateOverlay
                isVisible={state.elements.length === 0}
                showCelebration={showCelebration}
                onAddPlayer={() => state.addPlayerAtCursor('home')}
                onAddBall={state.addBallAtCursor}
                onAddArrow={() => state.addArrowAtCursor(state.defaultArrowType)}
                onOpenPalette={state.openCommandPalette}
              />
            }
            onStageClick={stageHandlers.handleStageClick}
            onStageMouseDown={stageHandlers.handleStageMouseDown}
            onStageMouseMove={stageHandlers.handleStageMouseMove}
            onStageMouseUp={stageHandlers.handleStageMouseUp}
            onStageDblClick={stageHandlers.handleStageDblClick}
            onContextMenu={contextMenuHandler}
            onElementSelect={handlers.handleElementSelect}
            onElementDragEnd={handlers.handleElementDragEnd}
            onElementDragStart={(id, mouseX, mouseY) => state.canvasEventsController.startMultiDrag(id, mouseX ?? 0, mouseY ?? 0)}
            onResizeZone={state.resizeZone}
            onUpdateZonePoints={state.updateZonePoints}
            onResizeEquipment={state.setEquipmentScale}
            onUpdateArrowEndpoint={state.updateArrowEndpoint}
            onPlayerQuickEdit={handlers.handlePlayerQuickEdit}
            onTextDoubleClick={handlers.handleTextDoubleClick}
            pushHistory={state.pushHistory}
            onOrientationPreview={handlers.handleOrientationPreview}
            onOrientationCommit={handlers.handleOrientationCommit}
            getInterpolatedPosition={interpolation.getInterpolatedPosition}
            getInterpolatedZone={interpolation.getInterpolatedZone}
            getInterpolatedArrowEndpoints={interpolation.getInterpolatedArrowEndpoints}
            useNewCanvas={state.USE_NEW_CANVAS}
            activeCanvasInteraction={state.activeCanvasInteraction}
            viewportTransformRef={viewportTransformRef}
          />

          {!state.authIsPro && !state.isPrintMode && (
            <div
              className="pointer-events-none absolute bottom-5 right-6 z-[2] select-none rounded-md border border-border/60 bg-surface/70 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-muted/70 shadow-sm backdrop-blur"
              aria-hidden="true"
            >
              TMC STUDIO
            </div>
          )}

          {/* Shortcuts Hint (one-time) */}
          {!state.focusMode && (
            <ShortcutsHint
              isVisible={!state.hasSeenShortcutsHint && !state.cheatSheetVisible}
              onDismiss={() => state.setHasSeenShortcutsHint(true)}
              onClick={() => {
                state.setCheatSheetVisible(true);
                state.setHasSeenShortcutsHint(true);
              }}
            />
          )}

          {/* Floating Cheat Sheet — trigger always visible outside focus mode */}
          {!state.focusMode && (
            <CheatSheetOverlay
              isVisible={state.cheatSheetVisible}
              onClose={state.toggleCheatSheet}
              showAnimationShortcuts={ANIMATION_ENABLED}
            />
          )}

          {/* Floating Help Button (Sprint E) */}
          {!state.focusMode && (
            <FloatingHelpButton
              onClick={state.toggleHelpSidebar}
              isPrintMode={state.isPrintMode}
            />
          )}

          {/* Help Sidebar (Sprint E) */}
          <HelpSidebar
            isOpen={state.helpSidebarOpen}
            onClose={() => state.setHelpSidebarOpen(false)}
            onZoomFit={state.zoomFit}
            onToggleFocus={state.toggleFocusMode}
            onTogglePrint={state.togglePrintMode}
            saveStatus={state.projectSaveStatus}
            isPrintMode={state.isPrintMode}
            onRestartTutorial={handleRestartTutorial}
            plan={state.plan}
            onOpenPricing={props.onOpenPricingModal}
            onOpenTeamPanel={() => {} /* TODO: gdy TeamPanel istnieje */}
            onOpenSettings={props.onOpenSettingsModal}
            onOpenAuthModal={props.onOpenAuthModal}
          />

          {/* Tutorial Overlay (Sprint F + H1) — role-aware, controlled by state.showTutorial */}
          {state.showTutorial && (
            <TutorialOverlay
              isVisible={true}
              onDismiss={handleTutorialDismiss}
              onComplete={handleTutorialComplete}
              onStepShow={handleTutorialStepShow}
              plan={state.plan}
            />
          )}

          {/* Zoom Widget */}
          <ZoomWidget
            zoom={state.zoom}
            locked={state.viewportLocked}
            onZoomIn={state.zoomIn}
            onZoomOut={state.zoomOut}
            onZoomFit={state.zoomFit}
            onToggleLock={() => state.toggleViewportLock?.()}
          />

          {/* Edit overlays (text + player number) */}
          <BoardEditOverlays
            text={{
              elementExists: !!state.editOverlay.text.element,
              value: state.editOverlay.text.value,
              onChange: state.editOverlay.text.setValue,
              onKeyDown: state.editOverlay.text.onKeyDown,
              onBlur: state.editOverlay.text.save,
              style: state.editOverlay.overlay.getTextStyle(),
              inputStyle: state.editOverlay.text.element ? {
                fontSize: state.editOverlay.text.element.fontSize,
                fontWeight: state.editOverlay.text.element.bold ? 'bold' : 'normal',
                fontFamily: state.editOverlay.text.element.fontFamily,
              } : null,
            }}
            player={{
              elementExists: !!state.editOverlay.player.element,
              value: state.editOverlay.player.value,
              onChange: state.editOverlay.player.setValue,
              onKeyDown: state.editOverlay.player.onKeyDown,
              onBlur: state.editOverlay.player.save,
              style: state.editOverlay.overlay.getPlayerStyle(),
            }}
          />

          {/* Context Menu */}
          <CanvasContextMenuOverlay
            visible={state.contextMenu.menuState.visible}
            x={state.contextMenu.menuState.x}
            y={state.contextMenu.menuState.y}
            header={getContextMenuHeader(state.elements.find(el => el.id === state.contextMenu.menuState.elementId) ?? null, t)}
            items={getCanvasContextMenuItems(
              state.elements.find(el => el.id === state.contextMenu.menuState.elementId) ?? null,
              {
                ...handlers.contextMenuActions,
                isAutoNumbering: state.isAutoNumbering,
              },
              state.selectedIds.length,
              t
            )}
            onClose={state.contextMenu.hideMenu}
          />
        </div>

        {/* Right Inspector */}
        {!state.focusMode && (
        <RightInspector
          isOpen={state.inspectorOpen}
          width={state.inspectorWidth}
          onWidthChange={state.setInspectorWidth}
          activeTab={state.inspectorActiveTab}
          onActiveTabChange={state.setInspectorActiveTab}
          onToggle={() => {
            // Mutex: close CheatSheet when Inspector opens
            if (!state.inspectorOpen && state.cheatSheetVisible) {
              state.setCheatSheetVisible(false);
            }
            state.toggleInspector();
          }}
          labelInputRef={state.labelInputRef}
          breakpoint={state.breakpoint}
          selectedCount={state.selectedIds.length}
          selectedElement={state.inspectorElement}
          elements={state.elementsList}
          layerVisibility={state.layerVisibility}
          groups={state.groups}
          onUpdateElement={handlers.handleUpdateElement}
          onSetArrowDefault={handlers.handleSetArrowDefault}
          onSetZoneDefault={handlers.handleSetZoneDefault}
          onToggleSelectedLock={state.toggleSelectedLock}
          onSelectElement={(id) => state.selectElement(id, false)}
          onToggleLayerVisibility={state.toggleLayerVisibility}
          onSelectGroup={state.selectGroup}
          onToggleGroupLock={state.toggleGroupLock}
          onToggleGroupVisibility={state.toggleGroupVisibility}
          onRenameGroup={state.renameGroup}
          onQuickAction={handlers.handleQuickAction}
          playerOrientationSettings={state.playerOrientationSettings}
          onUpdatePlayerOrientation={state.updatePlayerOrientationSettings}
          isAutoNumbering={state.isAutoNumbering}
          onToggleAutoNumbering={handlers.contextMenuActions.onToggleAutoNumbering}
          onRenumberArrows={() => {
            useBoardStore.getState().renumberAllArrowsWithHistory();
          }}
          onUpdateSelectedElements={(u) => useBoardStore.getState().updateSelectedElements(u)}
        />
        )}
      </div>

      {/* Squad Bench — pełnowymiarowy pasek w normalnym flow, tuż nad animacją.
          Bierze tylko tyle wysokości, ile ma treści (cienki gdy zwinięty), więc
          obszar roboczy (wiersz flex-1) automatycznie się do niego dokleja —
          brak rezerwowanej pustej przestrzeni. */}
      <div className="w-full shrink-0 overflow-hidden border-t border-border bg-surface">
        <SquadBench
          squad={state.squad}
          visible={state.squadVisible}
          canAccess={state.authIsPro}
          freeLimit={5}
          premiumPerTeamLimit={25}
          onToggle={state.toggleSquadVisible}
          onOpenSettings={() => onOpenSettingsModal('squad')}
          onDragStart={() => {}}
          teamSettings={state.teamSettings}
          onQuickAddPlayer={(name, number, team, isGoalkeeper) => state.addSquadPlayer(name, number, team, isGoalkeeper)}
          onRemovePlayer={(id) => state.removeSquadPlayer(id)}
        />
      </div>
      <SmartBottomBar
        elementCount={state.elements.length}
        canUndo={state.canUndo}
        canRedo={state.canRedo}
        onUndo={state.undo}
        onRedo={state.redo}
        onAddPlayer={() => state.addPlayerAtCursor('home')}
        onAddBall={state.addBallAtCursor}
        onAddArrow={() => state.addArrowAtCursor(state.defaultArrowType)}
        onOpenPalette={state.openCommandPalette}
        animationEnabled={ANIMATION_ENABLED}
        steps={state.stepsData}
        currentStepIndex={state.currentStepIndex}
        isPlaying={state.isPlaying}
        isLooping={state.isLooping}
        duration={state.stepDuration}
        onStepSelect={state.goToStep}
        onAddStep={state.addStep}
        onDeleteStep={state.removeStep}
        onRenameStep={state.renameStep}
        onPlay={state.play}
        onPause={state.pause}
        onPrevStep={state.prevStep}
        onNextStep={state.nextStep}
        onToggleLoop={state.toggleLoop}
        onDurationChange={state.setStepDuration}
        animationProgress={state.animationProgress}
        stepInfo={state.boardDoc.steps.length > 1 ? `Step ${state.currentStepIndex + 1}/${state.boardDoc.steps.length}` : undefined}
        height={state.bottomBarHeight}
        onHeightChange={state.setBottomBarHeight}
        collapsed={state.bottomBarCollapsed}
        onToggleCollapsed={state.toggleBottomBarCollapsed}
        version={appVersion}
        onNavigate={onNavigateFooter}
      />

      {/* Command Palette */}
      <CommandPaletteModal
        isOpen={state.commandPaletteOpen}
        onClose={state.closeCommandPalette}
        actions={handlers.commandActions}
      />

      {/* Toast */}
      <ToastHint message={state.activeToast?.message ?? null} />

      {/* Focus Mode Exit */}
      <FocusModeExitBar
        focusMode={state.focusMode}
        onExitFocusMode={state.toggleFocusMode}
      />
      
      {/* Offline Banner (PR-L5-MINI) */}
      <OfflineBanner isVisible={!state.isOnline} />
    </div>
  );
}
