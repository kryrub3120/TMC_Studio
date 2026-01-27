
/**
 * useExportController Hook
 * 
 * Handles all export operations (PNG, GIF, PDF, SVG)
 * Centralizes entitlement checks for premium exports
 * 
 * Part of PR-REFACTOR-2: Extract export logic from App.tsx
 */

import { useCallback, type RefObject } from 'react';
import type Konva from 'konva';
import { useBoardStore } from '../store';
import { useUIStore } from '../store/useUIStore';
import { useEntitlements } from './useEntitlements';
import { 
  exportGIF as exportGIFUtil, 
  exportPDF as exportPDFUtil, 
  exportSVG as exportSVGUtil 
} from '../utils/exportUtils';

export interface UseExportControllerParams {
  stageRef: RefObject<Konva.Stage>;
  canvasWidth: number;
  canvasHeight: number;
  onOpenPricingModal: () => void;
}

export interface ExportController {
  exportPNG: () => void;
  exportAllSteps: () => Promise<void>;
  exportGIF: () => Promise<void>;
  exportPDF: () => Promise<void>;
  exportSVG: () => Promise<void>;
}

/**
 * Hook that provides export functionality with entitlement checking
 */
export function useExportController(params: UseExportControllerParams): ExportController {
  const { stageRef, canvasWidth, canvasHeight, onOpenPricingModal } = params;
  
  // Store selectors
  const boardDoc = useBoardStore((s) => s.document);
  const currentStepIndex = useBoardStore((s) => s.currentStepIndex);
  const goToStep = useBoardStore((s) => s.goToStep);
  const stepDuration = useUIStore((s) => s.stepDuration);
  const showToast = useUIStore((s) => s.showToast);
  
  // Entitlements
  const { can } = useEntitlements();
  
  /**
   * Export current step as PNG
   */
  const exportPNG = useCallback(() => {
    if (!stageRef.current) {
      showToast('Canvas not ready');
      return;
    }
    
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `${boardDoc.name || 'tactics'}.png`;
    link.href = dataUrl;
    link.click();
    showToast('PNG exported!');
  }, [stageRef, boardDoc.name, showToast]);
  
  /**
   * Export all steps as separate PNGs
   */
  const exportAllSteps = useCallback(async () => {
    if (!stageRef.current) {
      showToast('Canvas not ready');
      return;
    }
    
    const originalStep = currentStepIndex;
    const totalSteps = boardDoc.steps.length;
    
    showToast(`Exporting ${totalSteps} steps...`);
    
    for (let i = 0; i < totalSteps; i++) {
      // Navigate to step
      goToStep(i);
      
      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 150));
      
      // Export PNG
      const dataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 });
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `${boardDoc.name || 'tactics'}-step-${i + 1}.png`;
        link.href = dataUrl;
        link.click();
      }
      
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    
    // Return to original step
    goToStep(originalStep);
    showToast(`Exported ${totalSteps} PNGs!`);
  }, [stageRef, boardDoc.name, boardDoc.steps.length, currentStepIndex, goToStep, showToast]);
  
  /**
   * Export animated GIF (Pro feature)
   */
  const exportGIF = useCallback(async () => {
    // Check entitlements
    const gifAllowed = can('exportGIF');
    if (gifAllowed !== true) {
      onOpenPricingModal();
      showToast('GIF export is a Pro feature ⭐');
      return;
    }
    
    if (!stageRef.current) {
      showToast('Canvas not ready');
      return;
    }
    
    if (boardDoc.steps.length < 2) {
      showToast('Need at least 2 steps for GIF');
      return;
    }
    
    const originalStep = currentStepIndex;
    showToast('Creating GIF...');
    
    try {
      await exportGIFUtil(
        async () => {
          await new Promise((r) => setTimeout(r, 50));
          return stageRef.current?.toDataURL({ pixelRatio: 2 }) ?? '';
        },
        goToStep,
        boardDoc.steps.length,
        { filename: boardDoc.name || 'tactics', stepDuration },
        (percent: number) => {
          if (percent === 50) showToast('Encoding GIF...');
        }
      );
      showToast('GIF exported!');
    } catch (error) {
      showToast('GIF export failed');
      console.error('GIF export error:', error);
    }
    
    goToStep(originalStep);
  }, [can, onOpenPricingModal, stageRef, boardDoc.name, boardDoc.steps.length, currentStepIndex, goToStep, stepDuration, showToast]);
  
  /**
   * Export multi-page PDF (Pro feature)
   */
  const exportPDF = useCallback(async () => {
    // Check entitlements
    const pdfAllowed = can('exportPDF');
    if (pdfAllowed !== true) {
      onOpenPricingModal();
      showToast('PDF export is a Pro feature ⭐');
      return;
    }
    
    if (!stageRef.current) {
      showToast('Canvas not ready');
      return;
    }
    
    const originalStep = currentStepIndex;
    showToast('Creating PDF...');
    
    try {
      await exportPDFUtil(
        async () => {
          await new Promise((r) => setTimeout(r, 50));
          return stageRef.current?.toDataURL({ pixelRatio: 2 }) ?? '';
        },
        goToStep,
        boardDoc.steps.length,
        { filename: boardDoc.name || 'tactics' }
      );
      showToast('PDF exported!');
    } catch (error) {
      showToast('PDF export failed');
      console.error('PDF export error:', error);
    }
    
    goToStep(originalStep);
  }, [can, onOpenPricingModal, stageRef, boardDoc.name, boardDoc.steps.length, currentStepIndex, goToStep, showToast]);
  
  /**
   * Export as SVG
   */
  const exportSVG = useCallback(async () => {
    if (!stageRef.current) {
      showToast('Canvas not ready');
      return;
    }
    
    try {
      await exportSVGUtil(
        stageRef.current,
        canvasWidth,
        canvasHeight,
        { filename: boardDoc.name || 'tactics' }
      );
      showToast('SVG exported!');
    } catch (error) {
      showToast('SVG export failed');
      console.error('SVG export error:', error);
    }
  }, [stageRef, canvasWidth, canvasHeight, boardDoc.name, showToast]);
  
  return {
    exportPNG,
    exportAllSteps,
    exportGIF,
    exportPDF,
    exportSVG,
  };
}
