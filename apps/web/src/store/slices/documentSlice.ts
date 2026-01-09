/**
 * Document Slice - Document metadata, cloud sync, autosave
 */

import type { StateCreator } from 'zustand';
import type {
  BoardDocument,
  BoardElement,
  Team,
  TeamSettings,
  TeamSetting,
  PitchSettings,
  Position,
} from '@tmc/core';
import {
  DEFAULT_PITCH_CONFIG,
  DEFAULT_PITCH_SETTINGS,
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
      if (settings.orientation && settings.orientation !== currentSettings.orientation) {
        const padding = DEFAULT_PITCH_CONFIG.padding;
        const currentWidth = currentSettings.orientation === 'portrait' 
          ? DEFAULT_PITCH_CONFIG.height
          : DEFAULT_PITCH_CONFIG.width;
        const currentHeight = currentSettings.orientation === 'portrait'
          ? DEFAULT_PITCH_CONFIG.width
          : DEFAULT_PITCH_CONFIG.height;
        
        transformedElements = elements.map((el) => {
          if ('position' in el && el.position) {
            const pos = el.position as Position;
            const relX = pos.x - padding;
            const relY = pos.y - padding;
            
            let newRelX: number, newRelY: number;
            
            if (settings.orientation === 'portrait') {
              newRelX = relY;
              newRelY = currentWidth - relX;
            } else {
              newRelX = currentHeight - relY;
              newRelY = relX;
            }
            
            return {
              ...el,
              position: {
                x: newRelX + padding,
                y: newRelY + padding,
              },
            };
          }
          
          if (isArrowElement(el)) {
            const transformPoint = (p: Position): Position => {
              const relX = p.x - padding;
              const relY = p.y - padding;
              
              if (settings.orientation === 'portrait') {
                return { x: relY + padding, y: currentWidth - relX + padding };
              } else {
                return { x: currentHeight - relY + padding, y: relX + padding };
              }
            };
            
            return {
              ...el,
              startPoint: transformPoint(el.startPoint),
              endPoint: transformPoint(el.endPoint),
            };
          }
          
          return el;
        });
      }
      
      set({
        elements: transformedElements,
        document: {
          ...document,
          pitchSettings: updatedPitchSettings,
          updatedAt: new Date().toISOString(),
        },
      });
      
      if (transformedElements !== elements) {
        get().pushHistory();
      }
    },
    
    getPitchSettings: () => get().document.pitchSettings,
    
    saveToCloud: async () => {
      if (!isSupabaseEnabled()) return false;
      
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
        console.error('Cloud save error:', error);
        set({ isSaving: false });
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
        console.error('Cloud load error:', error);
        return false;
      }
    },
    
    fetchCloudProjects: async () => {
      if (!isSupabaseEnabled()) return;
      
      try {
        const projects = await getProjects();
        set({ cloudProjects: projects });
      } catch (error) {
        console.error('Fetch projects error:', error);
      }
    },
    
    fetchCloudFolders: async () => {
      if (!isSupabaseEnabled()) return;
      
      try {
        const folders = await getFolders();
        set({ cloudFolders: folders });
      } catch (error) {
        console.error('Fetch folders error:', error);
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
        console.error('Create folder error:', error);
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
      
      console.log('[Autosave] Saving...');
      
      state.saveDocument();
      
      if (isSupabaseEnabled()) {
        try {
          await state.saveToCloud();
          console.log('[Autosave] Saved to cloud');
        } catch (error) {
          console.error('[Autosave] Cloud save failed:', error);
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
