/**
 * Keyboard Service - Centralized keyboard shortcut management
 * 
 * Singleton service for registering and handling keyboard shortcuts.
 * Supports modifier keys, conditional execution, and categorization.
 */

export interface ShortcutDefinition {
  key: string;
  code?: string; // Optional e.code for key-position specific shortcuts (e.g. formations)
  modifiers?: Array<'ctrl' | 'meta' | 'shift' | 'alt'>;
  action: () => void;
  description: string;
  category: 'elements' | 'edit' | 'view' | 'tools' | 'export' | 'navigation' | 'steps';
  when?: () => boolean; // Optional condition for execution
}

class KeyboardService {
  private shortcuts: Map<string, ShortcutDefinition> = new Map();
  
  /**
   * Register a keyboard shortcut
   * @returns Cleanup function to unregister the shortcut
   */
  register(shortcut: ShortcutDefinition): () => void {
    const key = shortcut.code 
      ? this.normalizeKeyWithCode(shortcut)
      : this.normalizeKey(shortcut);
    this.shortcuts.set(key, shortcut);
    return () => this.shortcuts.delete(key);
  }
  
  /**
   * Register multiple shortcuts at once
   * @returns Cleanup function to unregister all shortcuts
   */
  registerMany(shortcuts: ShortcutDefinition[]): () => void {
    shortcuts.forEach(shortcut => {
      const key = shortcut.code 
        ? this.normalizeKeyWithCode(shortcut)
        : this.normalizeKey(shortcut);
      this.shortcuts.set(key, shortcut);
    });
    
    return () => {
      shortcuts.forEach(shortcut => {
        const key = shortcut.code 
          ? this.normalizeKeyWithCode(shortcut)
          : this.normalizeKey(shortcut);
        this.shortcuts.delete(key);
      });
    };
  }
  
  /**
   * Handle keyboard event
   * @returns true if event was handled, false otherwise
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    // First try code-based matching (for formation shortcuts)
    if (event.code) {
      const codeKey = this.normalizeKeyWithCode({
        key: event.key,
        code: event.code,
        modifiers: this.getActiveModifiers(event),
      });
      
      const codeShortcut = this.shortcuts.get(codeKey);
      if (codeShortcut && (!codeShortcut.when || codeShortcut.when())) {
        event.preventDefault();
        codeShortcut.action();
        return true;
      }
    }
    
    // Then try regular key-based matching
    const key = this.normalizeKey({
      key: event.key,
      modifiers: this.getActiveModifiers(event),
    });
    
    const shortcut = this.shortcuts.get(key);
    
    // Check if shortcut exists and conditions are met
    if (shortcut && (!shortcut.when || shortcut.when())) {
      event.preventDefault();
      shortcut.action();
      return true;
    }
    
    return false;
  }
  
  /**
   * Get all registered shortcuts
   */
  getAll(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values());
  }
  
  /**
   * Get shortcuts by category
   */
  getByCategory(category: ShortcutDefinition['category']): ShortcutDefinition[] {
    return this.getAll().filter(shortcut => shortcut.category === category);
  }
  
  /**
   * Clear all shortcuts (useful for testing)
   */
  clear(): void {
    this.shortcuts.clear();
  }
  
  /**
   * Normalize shortcut definition to a unique key string
   */
  private normalizeKey(
    shortcut: Pick<ShortcutDefinition, 'key' | 'modifiers'>
  ): string {
    const key = shortcut.key.toLowerCase();
    const modifiers = (shortcut.modifiers || [])
      .map(m => m.toLowerCase())
      .sort()
      .join('+');
    
    return modifiers ? `${modifiers}+${key}` : key;
  }
  
  /**
   * Normalize shortcut with code (for position-specific keys like formations)
   */
  private normalizeKeyWithCode(
    shortcut: Pick<ShortcutDefinition, 'key' | 'code' | 'modifiers'>
  ): string {
    if (!shortcut.code) {
      return this.normalizeKey(shortcut);
    }
    
    const code = shortcut.code.toLowerCase();
    const modifiers = (shortcut.modifiers || [])
      .map(m => m.toLowerCase())
      .sort()
      .join('+');
    
    return modifiers ? `${modifiers}+code:${code}` : `code:${code}`;
  }
  
  /**
   * Extract active modifiers from keyboard event
   */
  private getActiveModifiers(event: KeyboardEvent): Array<'ctrl' | 'meta' | 'shift' | 'alt'> {
    const modifiers: Array<'ctrl' | 'meta' | 'shift' | 'alt'> = [];
    
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.metaKey) modifiers.push('meta');
    if (event.shiftKey) modifiers.push('shift');
    if (event.altKey) modifiers.push('alt');
    
    return modifiers;
  }
}

// Export singleton instance
export const keyboardService = new KeyboardService();
