/**
 * Export utilities for TMC Studio
 * Supports: PNG, GIF, PDF, SVG
 */

import GIF from 'gif.js';
import { jsPDF } from 'jspdf';

// GIF.js worker URL - use CDN
const GIF_WORKER_URL = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js';

export interface ExportOptions {
  filename: string;
  pixelRatio?: number;
  stepDuration?: number;
}

/**
 * Export single frame as PNG
 */
export function exportPNG(
  stage: { toDataURL: (opts: { pixelRatio: number }) => string },
  options: ExportOptions
): void {
  const dataUrl = stage.toDataURL({ pixelRatio: options.pixelRatio ?? 2 });
  const link = document.createElement('a');
  link.download = `${options.filename}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Export all steps as animated GIF
 */
export async function exportGIF(
  captureFrame: () => Promise<string>, // Returns data URL for current frame
  goToStep: (index: number) => void,
  totalSteps: number,
  options: ExportOptions,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const processFrames = async () => {
      const frames: HTMLImageElement[] = [];
      
      // Capture all frames
      for (let i = 0; i < totalSteps; i++) {
        goToStep(i);
        await new Promise((r) => setTimeout(r, 100)); // Wait for render
        
        const dataUrl = await captureFrame();
        const frameImg = new Image();
        frameImg.src = dataUrl;
        await new Promise((r) => { frameImg.onload = r; });
        frames.push(frameImg);
        
        onProgress?.((i + 1) / totalSteps * 50); // 0-50% for capture
      }
      
      if (frames.length === 0) {
        reject(new Error('No frames to export'));
        return;
      }
      
      // Create GIF
      const gif = new GIF({
        workers: 2,
        workerScript: GIF_WORKER_URL,
        quality: 10,
        width: frames[0].width,
        height: frames[0].height,
      });
      
      // Add frames
      const delayMs = (options.stepDuration ?? 0.8) * 1000;
      frames.forEach((frame) => {
        gif.addFrame(frame, { delay: delayMs });
      });
      
      gif.on('progress', (p: number) => {
        onProgress?.(50 + p * 50); // 50-100% for encoding
      });
      
      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${options.filename}.gif`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        resolve();
      });
      
      gif.render();
    };
    
    processFrames().catch(reject);
  });
}

/**
 * Export all steps as multi-page PDF
 */
export async function exportPDF(
  captureFrame: () => Promise<string>,
  goToStep: (index: number) => void,
  totalSteps: number,
  options: ExportOptions,
  onProgress?: (percent: number) => void
): Promise<void> {
  const frames: string[] = [];
  
  // Capture all frames
  for (let i = 0; i < totalSteps; i++) {
    goToStep(i);
    await new Promise((r) => setTimeout(r, 100));
    
    const dataUrl = await captureFrame();
    frames.push(dataUrl);
    onProgress?.((i + 1) / totalSteps * 100);
  }
  
  if (frames.length === 0) return;
  
  // Get dimensions from first frame
  const img = new Image();
  img.src = frames[0];
  await new Promise((r) => { img.onload = r; });
  
  const { width, height } = img;
  
  // Create PDF with landscape/portrait based on dimensions
  const orientation = width > height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [width, height],
  });
  
  // Add each frame as a page
  frames.forEach((dataUrl, index) => {
    if (index > 0) {
      pdf.addPage([width, height], orientation);
    }
    pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
  });
  
  pdf.save(`${options.filename}.pdf`);
}

/**
 * Export current view as SVG
 * Note: This is a simplified SVG export - elements are embedded as images
 */
export async function exportSVG(
  stage: { toDataURL: (opts: { pixelRatio: number }) => string },
  width: number,
  height: number,
  options: ExportOptions
): Promise<void> {
  const dataUrl = stage.toDataURL({ pixelRatio: options.pixelRatio ?? 2 });
  
  // Create SVG with embedded image
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <title>${options.filename}</title>
  <image x="0" y="0" width="${width}" height="${height}" xlink:href="${dataUrl}"/>
</svg>`;
  
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${options.filename}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
