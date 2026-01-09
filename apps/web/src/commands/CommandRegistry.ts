/**
 * CommandRegistry - Central command dispatcher (PLACEHOLDER)
 * 
 * TODO: Implement full command registry
 * All UI interactions should go through cmd.intent.* or cmd.effect.*
 * 
 * Intent commands: frequent, no side-effects (drag, resize)
 * Effect commands: commit history + autosave (pointerUp, add, delete)
 */

import { autosaveService } from '../services';

/**
 * Intent Commands - PLACEHOLDER
 */
export const intentCommands = {
  moveStart: (elementIds: string[]) => {
    // TODO: call store.beginContinuous()
    console.log('cmd.intent.moveStart', elementIds);
  },
  
  moveDelta: (elementId: string, position: { x: number; y: number }) => {
    // TODO: call store.updateElement (no history)
    console.log('cmd.intent.moveDelta', elementId, position);
  },
  
  resizeStart: (zoneId: string) => {
    // TODO: call store.beginContinuous()
    console.log('cmd.intent.resizeStart', zoneId);
  },
  
  resizeDelta: (zoneId: string, width: number, height: number) => {
    // TODO: call store.resizeZone (no history)
    console.log('cmd.intent.resizeDelta', zoneId, width, height);
  },
};

/**
 * Effect Commands - PLACEHOLDER
 */
export const effectCommands = {
  moveEnd: (label?: string) => {
    // TODO: call store.endContinuous() + autosave
    console.log('cmd.effect.moveEnd', label);
    autosaveService.markDirty();
  },
  
  resizeEnd: (label?: string) => {
    // TODO: call store.endContinuous() + autosave
    console.log('cmd.effect.resizeEnd', label);
    autosaveService.markDirty();
  },
  
  addElements: (elements: any[], label?: string) => {
    // TODO: call store actions + commitHistory + autosave
    console.log('cmd.effect.addElements', elements, label);
    autosaveService.markDirty();
  },
  
  deleteElements: (elementIds: string[], label?: string) => {
    // TODO: call store actions + commitHistory + autosave
    console.log('cmd.effect.deleteElements', elementIds, label);
    autosaveService.markDirty();
  },
  
  commitHistory: (label: string) => {
    // TODO: call store.commitHistory + autosave
    console.log('cmd.effect.commitHistory', label);
    autosaveService.markDirty();
  },
};

/**
 * CommandRegistry - Export as cmd.*
 */
export const cmd = {
  intent: intentCommands,
  effect: effectCommands,
};
