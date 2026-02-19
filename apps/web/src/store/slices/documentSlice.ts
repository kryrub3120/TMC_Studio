/**
 * Document Slice - Document metadata, cloud sync, autosave
 */

import { logger } from '../../lib/logger';
import type { StateCreator } from 'zustand';
import type {
  BoardDocument,
  BoardElement,
  Team,
  TeamSettings,
  TeamSetting,
  PitchSettings,
  PlayerOrientationSettings,
  Position,
} from '@tmc/core';
import {
  DEFAULT_PITCH_CONFIG,
  DEFAULT_PITCH_SETTINGS,
  DEFAULT_PLAYER_ORIENTATION_SETTINGS,
  createDocument,
  saveToLocalStorage,
  loadFromLocalStorage,
  isArrowElement,
} from '@tmc/core';
import {
  isSupabaseEnabled,
  createProject,
  updateProject,
  getProject,
  getProjects,
  getFolders,
  createFolder,
  type Project,
  type ProjectFolder,
} from '../../lib/supabase';
import type { AppState } from '../types';

export interface DocumentSlice {
  // State
  document: BoardDocument;
  cloudProjectId: string | null;
  isSaving: boolean;
  cloudProjects: Project[];
  cloudFolders: ProjectFolder[];
  autoSaveTimer: NodeJS.Timeout | null;
  isDirty: boolean;
  lastSavedAt: string | null;
  
  // Document actions
  saveDocument: () => void;
  loadDocument: () => boolean;
  newDocument: () => void;
  
  // Team settings
  updateTeamSettings: (team: Team, settings: Partial<TeamSetting>) => void;
  getTeamSettings: () => TeamSettings | undefined;
  
  // Pitch settings
  updatePitchSettings: (settings: Partial<PitchSettings>) => void;
  getPitchSettings: () => PitchSettings | undefined;
  
  // Player orientation settings
  updatePlayerOrientationSettings: (settings: Partial<PlayerOrientationSettings>) => void;
  getPlayerOrientationSettings: () => PlayerOrientationSettings;
  
  // Cloud actions
  saveToCloud: () => Promise<boolean>;
  loadFromCloud: (projectId: string) => Promise<boolean>;
  fetchCloudProjects: () => Promise<void>;
  fetchCloudFolders: () => Promise<void>;
  createCloudFolder: (name: string, color?: string) => Promise<boolean>;
  
  // Autosave actions
  markDirty: () => void;
  scheduleAutoSave: () => void;
  performAutoSave: () => Promise<void>;
  clearAutoSaveTimer: () => void;
}

export const createDocumentSlice: StateCreator<
  AppState,
  [],
  [],
  DocumentSlice
> = (set, get) => {
  // Initialize with saved document or new document
  const savedDoc = loadFromLocalStorage();
  const initialDoc = savedDoc ?? createDocument('Untitled Board');

  return {
    document: initialDoc,
    cloudProjectId: null,
    isSaving: false,
    cloudProjects: [],
    cloudFolders: [],
    autoSaveTimer: null,
    isDirty: false,
    lastSavedAt: null,
    
    saveDocument: () => {
      const { document, elements } = get();
      const updatedDoc: BoardDocument = {
        ...document,
        steps: [
          {
            ...document.steps[0],
            elements: structuredClone(elements),
          },
          ...document.steps.slice(1),
        ],
        updatedAt: new Date().toISOString(),
      };
      saveToLocalStorage(updatedDoc);
      set({ document: updatedDoc });
    },
    
    loadDocument: () => {
      const doc = loadFromLocalStorage();
      if (!doc) return false;
      
      const elements = doc.steps[0]?.elements ?? [];
      set({
        document: doc,
        elements,
        selectedIds: [],
        history: [{ elements, selectedIds: [] }],
        historyIndex: 0,
      });
      return true;
    },
    
    newDocument: () => {
      const doc = createDocument('Untitled Board');
      const elements = doc.steps[0]?.elements ?? [];
      set({
        document: doc,
        elements,
        selectedIds: [],
        history: [{ elements, selectedIds: [] }],
        historyIndex: 0,
        cloudProjectId: null,
        currentStepIndex: 0,
      });
    },
    
    updateTeamSettings: (team, settings) => {
      const { document } = get();
      const currentSettings = document.teamSettings ?? {
        home: { name: 'Home', primaryColor: '#ef4444', secondaryColor: '#ffffff' },
        away: { name: 'Away', primaryColor: '#3b82f6', secondaryColor: '#ffffff' },
      };
      
      const updatedTeamSettings = {
        ...currentSettings,
        [team]: {
          ...currentSettings[team],
          ...settings,
        },
      };
      
      set({
        document: {
          ...document,
          teamSettings: updatedTeamSettings,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    
    getTeamSettings: () => get().document.teamSettings,
    
    updatePitchSettings: (settings) => {
      const { document, elements } = get();
      const currentSettings = document.pitchSettings ?? DEFAULT_PITCH_SETTINGS;
      
      const updatedPitchSettings = {
        ...currentSettings,
        ...settings,
      };
      
      // Check if orientation changed - transform element positions
      let transformedElements = elements;
      let newSteps = document.steps;
      
      if (settings.orientation && settings.orientation !== currentSettings.orientation) {
        const padding = DEFAULT_PITCH_CONFIG.padding;
        
        // FROM dimensions (current orientation)
        // Note: DEFAULT_PITCH_CONFIG.width/height ARE the inner pitch dimensions
        // (the playable field area). Padding is added around them to create canvas.
        const fromInnerW = currentSettings.orientation === 'portrait'
          ? DEFAULT_PITCH_CONFIG.height
          : DEFAULT_PITCH_CONFIG.width;
        const fromInnerH = currentSettings.orientation === 'portrait'
          ? DEFAULT_PITCH_CONFIG.width
          : DEFAULT_PITCH_CONFIG.height;
        
        // TO dimensions (new orientation)
        const toInnerW = settings.orientation === 'portrait'
          ? DEFAULT_PITCH_CONFIG.height
          : DEFAULT_PITCH_CONFIG.width;
        const toInnerH = settings.orientation === 'portrait'
          ? DEFAULT_PITCH_CONFIG.width
          : DEFAULT_PITCH_CONFIG.height;
        
        // Transform point: fromCenter → rotate 90° → toCenter
        const transformInnerPoint = (x: number, y: number) => {
          // 1. Move to fromCenter
          const dx = x - fromInnerW / 2;
          const dy = y - fromInnerH / 2;
          
          // 2. Rotate 90°
          let rx: number, ry: number;
          if (settings.orientation === 'portrait') {
            // CCW
            rx = -dy;
            ry = dx;
          } else {
            // CW
            rx = dy;
            ry = -dx;
          }
          
          // 3. Move to toCenter
          return {
            x: rx + toInnerW / 2,
            y: ry + toInnerH / 2,
          };
        };
        
        const transformStagePoint = (p: Position): Position => {
          const relX = p.x - padding;
          const relY = p.y - padding;
          const t = transformInnerPoint(relX, relY);
          return { x: t.x + padding, y: t.y + padding };
        };
        
        // Transform single element
        const transformBoardElement = (el: BoardElement): BoardElement => {
          // Compute rotation delta once (used for all rotating elements)
          // Landscape → Portrait: -90° (CCW)
          // Portrait → Landscape: +90° (CW)
          const rotationDelta = settings.orientation === 'portrait' ? -90 : 90;
          
          // A) Position elements (except zone, arrow, drawing)
          if ('position' in el && el.position && el.type !== 'zone') {
            const next: any = {
              ...el,
              position: transformStagePoint(el.position as Position),
            };
            
            // Unified rotation rule: rotate ANY element with numeric 'rotation' property
            if ('rotation' in el && typeof (el as any).rotation === 'number') {
              next.rotation = ((el as any).rotation + rotationDelta + 360) % 360;
            }
            
            // Orientation transform: players always get transformed (even with undefined orientation —
            // createPlayer omits the field, so 'orientation' in el is false, but we must still rotate).
            // Default orientation 0 (north) must be explicitly rotated so cones align after pitch flip.
            if (el.type === 'player') {
              const currentOrientation = (el as any).orientation ?? 0;
              next.orientation = ((currentOrientation + rotationDelta) % 360 + 360) % 360;
            } else if ('orientation' in el && (el as any).orientation !== undefined) {
              // Other element types with explicit orientation (future extensibility)
              next.orientation = (((el as any).orientation + rotationDelta) % 360 + 360) % 360;
            }
            
            // Text exception: force rotation to 0 (text must remain readable/upright)
            if (el.type === 'text') {
              if ('rotation' in next) {
                next.rotation = 0;
              }
            }
            
            return next;
          }

          
          // B) Zone - transform center + swap + recalculate top-left
          if (el.type === 'zone') {
            const p = el.position as Position;
            const w = el.width ?? 0;
            const h = el.height ?? 0;
            
            const center = { x: p.x + w / 2, y: p.y + h / 2 };
            const newCenter = transformStagePoint(center);
            
            const newW = h;
            const newH = w;
            
            return {
              ...el,
              position: { x: newCenter.x - newW / 2, y: newCenter.y - newH / 2 },
              width: newW,
              height: newH,
            } as any;
          }
          
          // C) Arrow - transform both endpoints
          if (isArrowElement(el)) {
            return {
              ...el,
              startPoint: transformStagePoint(el.startPoint),
              endPoint: transformStagePoint(el.endPoint),
            } as any;
          }
          
          // D) Drawing - transform all points in the flat array [x1, y1, x2, y2, ...]
          if (el.type === 'drawing') {
            const transformedPoints: number[] = [];
            for (let i = 0; i < el.points.length; i += 2) {
              const x = el.points[i];
              const y = el.points[i + 1];
              const transformed = transformStagePoint({ x, y });
              transformedPoints.push(transformed.x, transformed.y);
            }
            return {
              ...el,
              points: transformedPoints,
            } as any;
          }
          
          return el;
        };
        
        // Transform ALL steps to maintain consistency
        const { currentStepIndex } = get();
        newSteps = document.steps.map((step) => ({
          ...step,
          elements: step.elements.map(transformBoardElement),
        }));
        
        transformedElements = newSteps[currentStepIndex]?.elements ?? [];
      }
      
      set({
        elements: structuredClone(transformedElements),
        document: {
          ...document,
          steps: newSteps,
          pitchSettings: updatedPitchSettings,
          updatedAt: new Date().toISOString(),
        },
      });
      
      if (transformedElements !== elements) {
        get().pushHistory();
      }
    },
    
    getPitchSettings: () => get().document.pitchSettings,
    
    updatePlayerOrientationSettings: (settings) => {
      const { document } = get();
      const currentSettings = document.playerOrientationSettings ?? DEFAULT_PLAYER_ORIENTATION_SETTINGS;
      
      const updatedSettings = {
        ...currentSettings,
        ...settings,
      };
      
      set({
        document: {
          ...document,
          playerOrientationSettings: updatedSettings,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    
    getPlayerOrientationSettings: () => {
      const settings = get().document.playerOrientationSettings ?? DEFAULT_PLAYER_ORIENTATION_SETTINGS;
      // Normalize: docs saved before showVision field existed have showVision=undefined.
      // Contract: showVision must be an explicit boolean; undefined is treated as false (opt-in).
      return settings.showVision === undefined
        ? { ...settings, showVision: false }
        : settings;
    },
    
    saveToCloud: async () => {
      if (!isSupabaseEnabled()) return false;
      
      // PR-L5-MINI: Check if online before attempting save
      const { useUIStore } = await import('../useUIStore');
      const isOnline = useUIStore.getState().isOnline;
      
      if (!isOnline) {
        logger.debug('[Cloud save] Skipped - offline');
        return false;
      }
      
      const { document, elements, cloudProjectId, currentStepIndex } = get();
      set({ isSaving: true });
      
      try {
        const cloneElements = (els: BoardElement[]) => structuredClone(els);
        
        const updatedSteps = document.steps.map((step, idx) => ({
          ...step,
          elements: idx === currentStepIndex 
            ? cloneElements(elements)
            : cloneElements(step.elements),
        }));
        
        const updatedDoc: BoardDocument = {
          ...document,
          steps: updatedSteps,
          updatedAt: new Date().toISOString(),
        };
        
        if (cloudProjectId) {
          const project = await updateProject(cloudProjectId, {
            name: document.name,
            document: updatedDoc,
          });
          if (!project) throw new Error('Failed to update project');
        } else {
          const project = await createProject({
            name: document.name,
            document: updatedDoc,
          });
          if (!project) throw new Error('Failed to create project');
          set({ cloudProjectId: project.id });
        }
        
        set({ isSaving: false, document: updatedDoc });
        return true;
      } catch (error) {
        logger.error('Cloud save error:', error);
        set({ isSaving: false });
        
        // PR-L5-MINI: Show save failure toast (rate-limited)
        const { useUIStore } = await import('../useUIStore');
        useUIStore.getState().showSaveFailureToast();
        
        return false;
      }
    },
    
    loadFromCloud: async (projectId: string) => {
      if (!isSupabaseEnabled()) return false;
      
      try {
        const project = await getProject(projectId);
        if (!project) return false;
        
        const doc = project.document;
        const elements = doc.steps[0]?.elements ?? [];
        
        set({
          document: doc,
          elements,
          selectedIds: [],
          cloudProjectId: projectId,
          history: [{ elements: structuredClone(elements), selectedIds: [] }],
          historyIndex: 0,
          currentStepIndex: 0,
        });
        
        return true;
      } catch (error) {
        logger.error('Cloud load error:', error);
        return false;
      }
    },
    
    fetchCloudProjects: async () => {
      if (!isSupabaseEnabled()) return;
      
      try {
        const projects = await getProjects();
        set({ cloudProjects: projects });
      } catch (error) {
        logger.error('Fetch projects error:', error);
      }
    },
    
    fetchCloudFolders: async () => {
      if (!isSupabaseEnabled()) return;
      
      try {
        const folders = await getFolders();
        set({ cloudFolders: folders });
      } catch (error) {
        logger.error('Fetch folders error:', error);
      }
    },
    
    createCloudFolder: async (name: string, color = '#3b82f6') => {
      if (!isSupabaseEnabled()) return false;
      
      try {
        const folder = await createFolder({ name, color });
        if (folder) {
          await get().fetchCloudFolders();
          return true;
        }
        return false;
      } catch (error) {
        logger.error('Create folder error:', error);
        return false;
      }
    },
    
    markDirty: () => {
      set({ isDirty: true });
      get().scheduleAutoSave();
    },
    
    scheduleAutoSave: () => {
      const state = get();
      
      if (state.autoSaveTimer) {
        clearTimeout(state.autoSaveTimer);
      }
      
      const timer = setTimeout(() => {
        get().performAutoSave();
      }, 2000);
      
      set({ autoSaveTimer: timer });
    },
    
    performAutoSave: async () => {
      const state = get();
      if (!state.isDirty) return;
      
      logger.debug('[Autosave] Saving...');
      
      state.saveDocument();
      
      if (isSupabaseEnabled()) {
        try {
          await state.saveToCloud();
          logger.debug('[Autosave] Saved to cloud');
        } catch (error) {
          logger.error('[Autosave] Cloud save failed:', error);
        }
      }
      
      set({ 
        isDirty: false,
        lastSavedAt: new Date().toISOString(),
      });
    },
    
    clearAutoSaveTimer: () => {
      const timer = get().autoSaveTimer;
      if (timer) {
        clearTimeout(timer);
        set({ autoSaveTimer: null });
      }
    },
  };
};
