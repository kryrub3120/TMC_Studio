
/**
 * useExportController Hook
 *
 * Handles all export operations (PNG, GIF, PDF, SVG)
 * Centralizes entitlement checks for premium exports
 *
 * Part of PR-REFACTOR-2: Extract export logic from App.tsx
 */

import { logger } from '../lib/logger';
import { trackExport } from '../lib/analytics';
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type Konva from 'konva';
import { useTranslation } from '@tmc/ui';
import { useBoardStore } from '../store';
import { useUIStore } from '../store/useUIStore';
import { useEntitlements } from './useEntitlements';
import {
  exportGIF as exportGIFUtil,
  exportPDF as exportPDFUtil,
  exportSVG as exportSVGUtil,
  exportJPG as exportJPGUtil,
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
  exportJPG: () => void;
  exportGIF: () => Promise<void>;
  exportPDF: () => Promise<void>;
  exportSVG: () => Promise<void>;
}

/**
 * Hook that provides export functionality with entitlement checking
 */
export function useExportController(params: UseExportControllerParams): ExportController {
  const { stageRef, canvasWidth, canvasHeight, onOpenPricingModal } = params;
  const { t } = useTranslation();

  // Store selectors
  const boardDoc = useBoardStore((s) => s.document);
  const currentStepIndex = useBoardStore((s) => s.currentStepIndex);
  const goToStep = useBoardStore((s) => s.goToStep);
  const stepDuration = useUIStore((s) => s.stepDuration);
  const showToast = useUIStore((s) => s.showToast);

  // Entitlements
  const { can } = useEntitlements();

  // I4: flaga przerwania długiej operacji eksportu po odmontowaniu widoku.
  // Pętla exportAllSteps sprawdza ją po każdym await i bezpiecznie przerywa.
  const isAbortedRef = useRef(false);
  useEffect(() => {
    isAbortedRef.current = false;
    return () => {
      isAbortedRef.current = true;
    };
  }, []);

  /**
   * Export current step as PNG — always at full board resolution
   */
  const exportPNG = useCallback(() => {
    if (!stageRef.current) {
      showToast(t('exportToast.canvasNotReady'));
      return;
    }

    // Compute pixel ratio for full-resolution export regardless of zoom
    const stageW = stageRef.current.width();
    const pr = Math.max(2, Math.ceil(canvasWidth / stageW));

    const dataUrl = stageRef.current.toDataURL({ pixelRatio: pr });
    const link = document.createElement('a');
    link.download = `${boardDoc.name || 'tactics'}.png`;
    link.href = dataUrl;
    link.click();
    trackExport('png');
    showToast(t('exportToast.pngExported'));
  }, [stageRef, boardDoc.name, showToast, canvasWidth, t]);

  /**
   * Export all steps as separate PNGs — always at full board resolution
   */
  const exportAllSteps = useCallback(async () => {
    if (!stageRef.current) {
      showToast(t('exportToast.canvasNotReady'));
      return;
    }

    const originalStep = currentStepIndex;
    const totalSteps = boardDoc.steps.length;

    // Compute pixel ratio from stage vs canvas dimensions
    const stageW = stageRef.current.width();
    const pr = Math.max(2, Math.ceil(canvasWidth / stageW));

    showToast(t('exportToast.exportingSteps', { count: totalSteps }));

    for (let i = 0; i < totalSteps; i++) {
      // Navigate to step
      goToStep(i);

      // Wait for render
      await new Promise((resolve) => setTimeout(resolve, 150));

      // I4: przerwij, jeśli widok został odmontowany w trakcie oczekiwania
      if (isAbortedRef.current || !stageRef.current) return;

      // Export PNG
      const dataUrl = stageRef.current?.toDataURL({ pixelRatio: pr });
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `${boardDoc.name || 'tactics'}-step-${i + 1}.png`;
        link.href = dataUrl;
        link.click();
      }

      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 100));

      // I4: przerwij, jeśli widok został odmontowany w trakcie oczekiwania
      if (isAbortedRef.current) return;
    }

    // Return to original step (tylko gdy nadal zamontowane)
    if (isAbortedRef.current) return;
    goToStep(originalStep);
    showToast(t('exportToast.exportedPngs', { count: totalSteps }));
  }, [stageRef, boardDoc.name, boardDoc.steps.length, currentStepIndex, goToStep, showToast, canvasWidth, t]);

  /**
   * Export animated GIF (Pro feature)
   */
  const exportGIF = useCallback(async () => {
    // Check entitlements
    const gifAllowed = can('exportGIF');
    if (gifAllowed !== true) {
      onOpenPricingModal();
      showToast(t('exportToast.gifPro'));
      return;
    }

    if (!stageRef.current) {
      showToast(t('exportToast.canvasNotReady'));
      return;
    }

    if (boardDoc.steps.length < 2) {
      showToast(t('exportToast.gifNeedSteps'));
      return;
    }

    const originalStep = currentStepIndex;
    showToast(t('exportToast.gifCreating'));

    const gifPR = Math.max(2, Math.ceil(canvasWidth / (stageRef.current?.width() ?? canvasWidth)));

    try {
      await exportGIFUtil(
        async () => {
          await new Promise((r) => setTimeout(r, 50));
          return stageRef.current?.toDataURL({ pixelRatio: gifPR }) ?? '';
        },
        goToStep,
        boardDoc.steps.length,
        { filename: boardDoc.name || 'tactics', stepDuration },
        (percent: number) => {
          if (percent === 50) showToast(t('exportToast.gifEncoding'));
        }
      );
      trackExport('gif');
      showToast(t('exportToast.gifExported'));
    } catch (error) {
      showToast(t('exportToast.gifFailed'));
      logger.error('GIF export error:', error);
    }

    goToStep(originalStep);
  }, [can, onOpenPricingModal, stageRef, boardDoc.name, boardDoc.steps.length, currentStepIndex, goToStep, stepDuration, showToast, canvasWidth, t]);

  /**
   * Export multi-page PDF (Pro feature)
   */
  const exportPDF = useCallback(async () => {
    // Check entitlements
    const pdfAllowed = can('exportPDF');
    if (pdfAllowed !== true) {
      onOpenPricingModal();
      showToast(t('exportToast.pdfPro'));
      return;
    }

    if (!stageRef.current) {
      showToast(t('exportToast.canvasNotReady'));
      return;
    }

    const originalStep = currentStepIndex;
    showToast(t('exportToast.pdfCreating'));

    const pdfPR = Math.max(2, Math.ceil(canvasWidth / (stageRef.current?.width() ?? canvasWidth)));

    try {
      await exportPDFUtil(
        async () => {
          await new Promise((r) => setTimeout(r, 50));
          return stageRef.current?.toDataURL({ pixelRatio: pdfPR }) ?? '';
        },
        goToStep,
        boardDoc.steps.length,
        { filename: boardDoc.name || 'tactics' }
      );
      trackExport('pdf');
      showToast(t('exportToast.pdfExported'));
    } catch (error) {
      showToast(t('exportToast.pdfFailed'));
      logger.error('PDF export error:', error);
    }

    goToStep(originalStep);
  }, [can, onOpenPricingModal, stageRef, boardDoc.name, boardDoc.steps.length, currentStepIndex, goToStep, showToast, canvasWidth, t]);

  /**
   * Export as SVG
   */
  const exportSVG = useCallback(async () => {
    if (!stageRef.current) {
      showToast(t('exportToast.canvasNotReady'));
      return;
    }

    try {
      await exportSVGUtil(
        stageRef.current,
        canvasWidth,
        canvasHeight,
        { filename: boardDoc.name || 'tactics' }
      );
      trackExport('svg');
      showToast(t('exportToast.svgExported'));
    } catch (error) {
      showToast(t('exportToast.svgFailed'));
      logger.error('SVG export error:', error);
    }
  }, [stageRef, canvasWidth, canvasHeight, boardDoc.name, showToast, t]);

  /**
   * Export current step as JPG — always at full board resolution
   */
  const exportJPG = useCallback(() => {
    if (!stageRef.current) {
      showToast(t('exportToast.canvasNotReady'));
      return;
    }
    const stageW = stageRef.current.width();
    const pr = Math.max(2, Math.ceil(canvasWidth / stageW));
    exportJPGUtil(stageRef.current, { filename: boardDoc.name || 'tactics', pixelRatio: pr });
    showToast(t('exportToast.jpgExported'));
  }, [stageRef, boardDoc.name, showToast, canvasWidth, t]);

  return {
    exportPNG,
    exportAllSteps,
    exportJPG,
    exportGIF,
    exportPDF,
    exportSVG,
  };
}
