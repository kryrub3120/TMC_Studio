/**
 * Type declarations for gifenc
 * @see https://github.com/mattdesl/gifenc
 */

declare module 'gifenc' {
  interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: {
        palette?: number[][];
        delay?: number;
        transparent?: boolean;
        transparentIndex?: number;
        dispose?: number;
      }
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    buffer: ArrayBuffer;
    stream: {
      reset(): void;
      bytes(): Uint8Array;
      writeByte(byte: number): void;
      writeBytes(bytes: number[] | Uint8Array): void;
    };
  }

  /**
   * Creates a new GIF encoder instance
   */
  export function GIFEncoder(options?: { auto?: boolean }): GIFEncoderInstance;

  /**
   * Quantize RGBA data to a 256-color palette
   */
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: {
      format?: 'rgb565' | 'rgba4444' | 'rgb444';
      oneBitAlpha?: boolean | number;
      clearAlpha?: boolean;
      clearAlphaColor?: number;
      clearAlphaThreshold?: number;
    }
  ): number[][];

  /**
   * Apply a palette to RGBA data to get indexed pixels
   */
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: 'rgb565' | 'rgba4444' | 'rgb444'
  ): Uint8Array;

  /**
   * Find the nearest color index in palette for a given RGB color
   */
  export function nearestColorIndex(
    palette: number[][],
    pixel: [number, number, number]
  ): number;

  /**
   * Find the nearest color index using a pre-computed color cache
   */
  export function nearestColorIndexWithDistance(
    palette: number[][],
    pixel: [number, number, number]
  ): [number, number];

  /**
   * Snap a color to the nearest in palette
   */
  export function snapColorToPalette(
    palette: number[][],
    pixel: [number, number, number]
  ): [number, number, number];

  /**
   * Prequantize RGBA data for better palette generation
   */
  export function prequantize(
    rgba: Uint8Array | Uint8ClampedArray,
    options?: {
      roundRGB?: number;
      roundAlpha?: number;
      oneBitAlpha?: boolean | number;
    }
  ): void;
}
