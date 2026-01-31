/**
 * BoardPage - Main board page component
 * Pure composition - orchestrates all board-related sections
 */

import { 
  RightInspector, 
  BottomStepsBar, 
  CommandPaletteModal, 
  CheatSheetOverlay, 
  ShortcutsHint, 
  EmptyStateOverlay, 
  ToastHint, 
  ZoomWidget,
} from '@tmc/ui';
import { DEFAULT_PITCH_SETTINGS } from '@tmc/core';
import { getCanvasContextMenuItems, getContextMenuHeader } from '../../utils/canvasContextMenu';

import { BoardTopBarSection } from './BoardTopBarSection';
import { BoardCanvasSection } from './BoardCanvasSection';
import { BoardEditOverlays } from './BoardEditOverlays';
import { CanvasContextMenuOverlay, FocusModeExitBar } from './BoardOverlays';
import { useBoardPageState, type BoardPageProps } from '../routes/useBoardPageState';
import { useBoardPageHandlers } from './useBoardPageHandlers';
import { useAnimationPlayback, useInterpolation, useStageEventHandlers, useContextMenuHandler } from './useBoardPageEffects';

export { type BoardPageProps } from '../routes/useBoardPageState';

export function BoardPage(props: BoardPageProps) {
  const {
    onOpenProjectsDrawer,
    onOpenAuthModal,
    onOpenSettingsModal,
    onOpenPricingModal,
    onRenameProject,
  } = props;

  // State hook
  const state = useBoardPageState(props);
  
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
  });

  // Context menu handler
  const contextMenuHandler = useContextMenuHandler({
    elements: state.elements,
    selectedIds: state.selectedIds,
    selectElement: state.selectElement,
    clearSelection: state.clearSelection,
    showMenu: state.contextMenu.showMenu,
  });

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      {/* Top Bar */}
      <BoardTopBarSection
        projectName={state.boardDoc.name}
        isSaved={state.isSaved}
        isSyncing={state.isSaving}
        stepInfo={state.boardDoc.steps.length > 1 ? `Step ${state.currentStepIndex + 1}/${state.boardDoc.steps.length}` : undefined}
        authIsPro={state.authIsPro}
        authIsAuthenticated={state.authIsAuthenticated}
        userInitials={state.authUser?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || (state.authIsAuthenticated ? 'U' : '?')}
        focusMode={state.focusMode}
        theme={state.theme}
        onExport={state.exportController.exportPNG}
        onToggleFocus={state.toggleFocusMode}
        onToggleTheme={state.toggleTheme}
        onOpenPalette={state.openCommandPalette}
        onOpenHelp={state.toggleCheatSheet}
        onOpenProjects={onOpenProjectsDrawer}
        onRenameProject={onRenameProject}
        onToggleInspector={state.toggleInspector}
        onOpenAccount={state.authIsAuthenticated ? onOpenSettingsModal : onOpenAuthModal}
        onUpgrade={onOpenPricingModal}
        onLogout={state.authIsAuthenticated ? state.signOut : undefined}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center bg-bg p-4 overflow-auto relative">
          <BoardCanvasSection
            stageRef={state.stageRef}
            canvasWidth={state.canvasWidth}
            canvasHeight={state.canvasHeight}
            zoom={state.effectiveZoom}
            pitchConfig={state.pitchConfig}
            pitchSettings={state.pitchSettings}
            teamSettings={state.teamSettings ?? { home: { primaryColor: '#3b82f6', secondaryColor: '#1e40af', name: 'Home' }, away: { primaryColor: '#ef4444', secondaryColor: '#b91c1c', name: 'Away' } }}
            gridVisible={state.gridVisible}
            layerVisibility={state.layerVisibility}
            hiddenByGroup={state.hiddenByGroup}
            elements={state.elements}
            selectedIds={state.selectedIds}
            isPlaying={state.isPlaying}
            activeTool={state.activeTool}
            isPrintMode={state.isPrintMode}
            marqueeStart={state.canvasEventsController.marqueeStart}
            marqueeEnd={state.canvasEventsController.marqueeEnd}
            drawingStart={state.drawingController.drawingStart}
            drawingEnd={state.drawingController.drawingEnd}
            freehandPoints={state.drawingController.freehandPoints}
            animationProgress={state.animationProgress}
            nextStepElements={interpolation.nextStepElements}
            emptyStateOverlay={
              <EmptyStateOverlay
                isVisible={state.elements.length === 0}
                onAddPlayer={() => state.addPlayerAtCursor('home')}
                onAddBall={state.addBallAtCursor}
                onAddArrow={() => state.addArrowAtCursor('pass')}
                onOpenPalette={state.openCommandPalette}
              />
            }
            onStageClick={stageHandlers.handleStageClick}
            onStageMouseDown={stageHandlers.handleStageMouseDown}
            onStageMouseMove={stageHandlers.handleStageMouseMove}
            onStageMouseUp={stageHandlers.handleStageMouseUp}
            onContextMenu={contextMenuHandler}
            onElementSelect={handlers.handleElementSelect}
            onElementDragEnd={handlers.handleElementDragEnd}
            onElementDragStart={(id, mouseX, mouseY) => state.canvasEventsController.startMultiDrag(id, mouseX ?? 0, mouseY ?? 0)}
            onResizeZone={state.resizeZone}
            onUpdateArrowEndpoint={state.updateArrowEndpoint}
            onPlayerQuickEdit={handlers.handlePlayerQuickEdit}
            onTextDoubleClick={handlers.handleTextDoubleClick}
            pushHistory={state.pushHistory}
            getInterpolatedPosition={interpolation.getInterpolatedPosition}
            getInterpolatedZone={interpolation.getInterpolatedZone}
            getInterpolatedArrowEndpoints={interpolation.getInterpolatedArrowEndpoints}
            useNewCanvas={state.USE_NEW_CANVAS}
            activeCanvasInteraction={state.activeCanvasInteraction}
          />

          {/* Shortcuts Hint */}
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

          {/* Cheat Sheet */}
          {!state.focusMode && (
            <CheatSheetOverlay
              isVisible={state.cheatSheetVisible}
              onClose={state.toggleCheatSheet}
            />
          )}

          {/* Zoom Widget */}
          <ZoomWidget
            zoom={state.zoom}
            onZoomIn={state.zoomIn}
            onZoomOut={state.zoomOut}
            onZoomFit={state.zoomFit}
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
            header={getContextMenuHeader(state.elements.find(el => el.id === state.contextMenu.menuState.elementId) ?? null)}
            items={getCanvasContextMenuItems(
              state.elements.find(el => el.id === state.contextMenu.menuState.elementId) ?? null,
              handlers.contextMenuActions,
              state.selectedIds.length
            )}
            onClose={state.contextMenu.hideMenu}
          />
        </div>

        {/* Right Inspector */}
        {!state.focusMode && (
        <RightInspector
          isOpen={state.inspectorOpen}
          onToggle={state.toggleInspector}
          selectedCount={state.selectedIds.length}
          selectedElement={state.inspectorElement}
          elements={state.elementsList}
          layerVisibility={state.layerVisibility}
          groups={state.groups}
          onUpdateElement={handlers.handleUpdateElement}
          onSelectElement={(id) => state.selectElement(id, false)}
          onToggleLayerVisibility={state.toggleLayerVisibility}
          onSelectGroup={state.selectGroup}
          onToggleGroupLock={state.toggleGroupLock}
          onToggleGroupVisibility={state.toggleGroupVisibility}
          onRenameGroup={state.renameGroup}
          onQuickAction={handlers.handleQuickAction}
          teamSettings={state.teamSettings}
          onUpdateTeam={state.updateTeamSettings}
          pitchSettings={state.pitchSettings ?? DEFAULT_PITCH_SETTINGS}
          onUpdatePitch={state.updatePitchSettings}
          isPrintMode={state.isPrintMode}
          onTogglePrintMode={state.togglePrintMode}
        />
        )}
      </div>

      {/* Bottom Steps Bar */}
      <BottomStepsBar
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
    </div>
  );
}
