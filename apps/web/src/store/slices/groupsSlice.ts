/**
 * Groups Slice - Element groups management
 */

import type { StateCreator } from 'zustand';
import type { AppState, Group } from '../types';

export interface GroupsSlice {
  // State
  groups: Group[];
  
  // Actions
  createGroup: () => void;
  ungroupSelection: () => void;
  selectGroup: (groupId: string) => void;
  toggleGroupLock: (groupId: string) => void;
  toggleGroupVisibility: (groupId: string) => void;
  renameGroup: (groupId: string, name: string) => void;
  
  // Computed
  getGroups: () => Group[];
}

export const createGroupsSlice: StateCreator<
  AppState,
  [],
  [],
  GroupsSlice
> = (set, get) => ({
  groups: [],
  
  createGroup: () => {
    const { selectedIds, groups } = get();
    if (selectedIds.length < 2) return;
    
    const groupNumber = groups.length + 1;
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name: `Group ${groupNumber}`,
      memberIds: [...selectedIds],
      locked: false,
      visible: true,
    };
    
    set((state) => ({
      groups: [...state.groups, newGroup],
    }));
  },
  
  ungroupSelection: () => {
    const { selectedIds, groups } = get();
    if (selectedIds.length === 0) return;
    
    const groupsToRemove = groups.filter((g) =>
      g.memberIds.some((id) => selectedIds.includes(id))
    );
    
    if (groupsToRemove.length === 0) return;
    
    set((state) => ({
      groups: state.groups.filter((g) => !groupsToRemove.includes(g)),
    }));
  },
  
  selectGroup: (groupId) => {
    const { groups } = get();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    
    set({ selectedIds: [...group.memberIds] });
  },
  
  toggleGroupLock: (groupId) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, locked: !g.locked } : g
      ),
    }));
  },
  
  toggleGroupVisibility: (groupId) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, visible: !g.visible } : g
      ),
    }));
  },
  
  renameGroup: (groupId, name) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, name } : g
      ),
    }));
  },
  
  getGroups: () => get().groups,
});
