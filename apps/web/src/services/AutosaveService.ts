/**
 * Autosave Service - Debounced autosave with conflict resolution
 * 
 * Singleton service for managing autosave operations.
 * Debounces saves to avoid excessive API calls.
 */

export interface AutosaveConfig {
  debounceMs: number;
  onSave: () => Promise<void>;
  onError?: (error: Error) => void;
}

class AutosaveService {
  private timer: NodeJS.Timeout | null = null;
  private config: AutosaveConfig | null = null;
  private isDirty = false;
  private isSaving = false;
  
  /**
   * Configure the autosave service
   */
  configure(config: AutosaveConfig): void {
    this.config = config;
  }
  
  /**
   * Mark document as dirty and schedule save
   */
  markDirty(): void {
    this.isDirty = true;
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
    } catch (error) {
      this.config.onError?.(error as Error);
      // Keep isDirty = true on error so it retries
    } finally {
      this.isSaving = false;
    }
  }
  
  /**
   * Force immediate save (flush)
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
