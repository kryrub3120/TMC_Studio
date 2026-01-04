/**
 * Type declarations for gif.js
 */

declare module 'gif.js' {
  interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    background?: string;
    repeat?: number;
    transparent?: number | null;
    dither?: boolean;
  }

  interface FrameOptions {
    delay?: number;
    copy?: boolean;
    dispose?: number;
  }

  class GIF {
    constructor(options?: GIFOptions);
    addFrame(
      image: HTMLImageElement | HTMLCanvasElement | CanvasRenderingContext2D | ImageData,
      options?: FrameOptions
    ): void;
    on(event: 'start', callback: () => void): void;
    on(event: 'progress', callback: (progress: number) => void): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: 'abort', callback: () => void): void;
    render(): void;
    abort(): void;
    running: boolean;
  }

  export default GIF;
}
