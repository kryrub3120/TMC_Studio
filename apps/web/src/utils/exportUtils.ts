/**
 * Export utilities for TMC Studio
 * Supports: PNG, GIF, PDF, SVG
 */

import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { jsPDF } from 'jspdf';

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
 * Get image data from data URL
 */
async function getImageData(dataUrl: string): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({
        data: imageData.data,
        width: canvas.width,
        height: canvas.height,
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Export all steps as animated GIF using gifenc (synchronous, no workers)
 */
export async function exportGIF(
  captureFrame: () => Promise<string>,
  goToStep: (index: number) => void,
  totalSteps: number,
  options: ExportOptions,
  onProgress?: (percent: number) => void
): Promise<void> {
  if (totalSteps < 2) {
    throw new Error('Need at least 2 steps for GIF');
  }

  // Capture all frames first
  const frames: { data: Uint8ClampedArray; width: number; height: number }[] = [];
  
  for (let i = 0; i < totalSteps; i++) {
    goToStep(i);
    await new Promise((r) => setTimeout(r, 100)); // Wait for render
    
    const dataUrl = await captureFrame();
    const frameData = await getImageData(dataUrl);
    frames.push(frameData);
    
    onProgress?.((i + 1) / totalSteps * 50); // 0-50% for capture
  }

  if (frames.length === 0) {
    throw new Error('No frames to export');
  }

  const { width, height } = frames[0];
  const delayMs = Math.round((options.stepDuration ?? 0.8) * 1000);
  
  // Create GIF encoder
  const gif = GIFEncoder();

  // Process each frame
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    
    // Convert RGBA to RGB array for quantize
    const rgba = frame.data;
    
    // Quantize colors (reduce to 256 color palette)
    const palette = quantize(rgba, 256);
    
    // Apply palette to get indexed pixels
    const indexed = applyPalette(rgba, palette);
    
    // Write frame (delay in centiseconds)
    gif.writeFrame(indexed, width, height, {
      palette,
      delay: Math.round(delayMs / 10), // gifenc uses centiseconds
    });
    
    onProgress?.(50 + (i + 1) / frames.length * 50); // 50-100% for encoding
  }

  // Finish and download
  gif.finish();
  
  const output = gif.bytes();
  // Create blob from the Uint8Array (copy to ensure clean ArrayBuffer)
  const blob = new Blob([new Uint8Array(output)], { type: 'image/gif' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = `${options.filename}.gif`;
  link.href = url;
  link.click();
  
  URL.revokeObjectURL(url);
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
