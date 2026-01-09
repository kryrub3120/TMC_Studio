/**
 * Export Service - Singleton for handling all export operations
 * 
 * Wraps exportUtils functions and provides additional helper methods.
 * Supports PNG, GIF, PDF, and SVG exports with progress tracking.
 */

import type Konva from 'konva';
import { exportPNG, exportGIF, exportPDF, exportSVG } from '../utils/exportUtils';

export interface ExportProgressCallback {
  (percent: number): void;
}

class ExportService {
  /**
   * Export single frame as PNG
   */
  async exportSinglePNG(
    stage: Konva.Stage,
    filename: string,
    pixelRatio = 2
  ): Promise<void> {
    exportPNG(stage, { filename, pixelRatio });
  }
  
  /**
   * Export all steps as individual PNG files
   */
  async exportAllStepsPNG(
    stage: Konva.Stage,
    goToStep: (index: number) => void,
    totalSteps: number,
    filename: string,
    pixelRatio = 2
  ): Promise<void> {
    for (let i = 0; i < totalSteps; i++) {
      goToStep(i);
      // Wait for Konva to render
      await this.delay(150);
      
      exportPNG(stage, {
        filename: `${filename}-step-${i + 1}`,
        pixelRatio,
      });
      
      // Small delay between downloads
      await this.delay(100);
    }
  }
  
  /**
   * Export animated GIF
   */
  async exportAnimatedGIF(
    captureFrame: () => Promise<string>,
    goToStep: (index: number) => void,
    totalSteps: number,
    filename: string,
    stepDuration = 0.8,
    onProgress?: ExportProgressCallback
  ): Promise<void> {
    if (totalSteps < 2) {
      throw new Error('Need at least 2 steps to create an animated GIF');
    }
    
    await exportGIF(
      captureFrame,
      goToStep,
      totalSteps,
      { filename, stepDuration },
      onProgress
    );
  }
  
  /**
   * Export multi-page PDF
   */
  async exportMultiPagePDF(
    captureFrame: () => Promise<string>,
    goToStep: (index: number) => void,
    totalSteps: number,
    filename: string,
    onProgress?: ExportProgressCallback
  ): Promise<void> {
    await exportPDF(
      captureFrame,
      goToStep,
      totalSteps,
      { filename },
      onProgress
    );
  }
  
  /**
   * Export SVG
   */
  async exportToSVG(
    stage: Konva.Stage,
    width: number,
    height: number,
    filename: string,
    pixelRatio = 2
  ): Promise<void> {
    await exportSVG(stage, width, height, { filename, pixelRatio });
  }
  
  /**
   * Helper: Create frame capture function from Konva stage
   */
  createFrameCapture(stage: Konva.Stage, pixelRatio = 2): () => Promise<string> {
    return async () => {
      return Promise.resolve(stage.toDataURL({ pixelRatio }));
    };
  }
  
  /**
   * Helper: Delay utility for async operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const exportService = new ExportService();
