/**
 * Autosave Service - Debounced autosave with conflict resolution
 * 
 * Singleton service for managing autosave operations.
 * Debounces saves to avoid excessive API calls.
 * Supports thumbnail throttling (Sprint G).
 */

import { useUIStore } from '../store/useUIStore';

export interface AutosaveConfig {
  debounceMs: number;
  onSave: () => Promise<void>;
  onError?: (error: Error) => void;
  /** Optional: generate thumbnail during autosave (throttled) */
  onGenerateThumbnail?: () => Promise<void>;
  /** Minimum interval (ms) between thumbnail generation. Default: 30000 (30s). */
  thumbnailThrottleMs?: number;
}

class AutosaveService {
  private timer: NodeJS.Timeout | null = null;
  private config: AutosaveConfig | null = null;
  private isDirty = false;
  private isSaving = false;
  /** Timestamp of last thumbnail generation */
  private lastThumbnailGeneration: number = 0;
  
  /**
   * Configure the autosave service
   */
  configure(config: AutosaveConfig): void {
    this.config = config;
    this.lastThumbnailGeneration = 0;
  }
  
  /**
   * Mark document as dirty and schedule save.
   * Also updates project save status in UI store.
   */
  markDirty(): void {
    this.isDirty = true;
    try { useUIStore.getState().setProjectSaveStatus('unsaved'); } catch { /* skip */ }
    this.scheduleSave();
  }
  
  /**
   * Check if document is dirty
   */
  get dirty(): boolean {
    return this.isDirty;
  }
  
  /**
   * Check if currently saving
   */
  get saving(): boolean {
    return this.isSaving;
  }
  
  /**
   * Schedule a debounced save
   */
  private scheduleSave(): void {
    if (!this.config) return;
    
    // Clear existing timer
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    // Schedule new save
    this.timer = setTimeout(() => {
      this.executeSave();
    }, this.config.debounceMs);
  }
  
  /**
   * Execute the save operation
   */
  private async executeSave(): Promise<void> {
    if (!this.isDirty || !this.config || this.isSaving) return;
    
    this.isSaving = true;
    
    try {
      await this.config.onSave();
      this.isDirty = false;
      
      // Generate thumbnail if throttled interval has elapsed
      if (this.config.onGenerateThumbnail) {
        const throttleMs = this.config.thumbnailThrottleMs ?? 30000;
        const now = Date.now();
        if (now - this.lastThumbnailGeneration >= throttleMs) {
          this.lastThumbnailGeneration = now;
          // Fire-and-forget thumbnail generation (non-blocking)
          this.config.onGenerateThumbnail().catch(() => {
            // Silently ignore thumbnail failures — they are non-critical
          });
        }
      }
    } catch (error) {
      this.config.onError?.(error as Error);
      // Keep isDirty = true on error so it retries
    } finally {
      this.isSaving = false;
    }
  }
  
  /**
   * Force immediate save (flush) — always generates thumbnail
   */
  async flush(): Promise<void> {
    // Cancel pending timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    // Execute save if dirty
    if (this.isDirty && this.config) {
      await this.executeSave();
      // Force thumbnail on manual save
      if (this.config.onGenerateThumbnail) {
        this.lastThumbnailGeneration = 0; // Reset throttle for next autosave
        try {
          await this.config.onGenerateThumbnail();
        } catch {
          // Silently ignore
        }
      }
    }
  }
  
  /**
   * Force thumbnail generation regardless of throttle (used for first save)
   */
  async forceThumbnail(): Promise<void> {
    if (this.config?.onGenerateThumbnail) {
      this.lastThumbnailGeneration = 0;
      try {
        await this.config.onGenerateThumbnail();
      } catch {
        // Silently ignore
      }
    }
  }
  
  /**
   * Dispose the service (cleanup timers)
   */
  dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.config = null;
    this.isDirty = false;
    this.isSaving = false;
  }
}

// Export singleton instance
export const autosaveService = new AutosaveService();
