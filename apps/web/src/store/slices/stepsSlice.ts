/**
 * Steps Slice - Animation steps management
 */

import type { StateCreator } from 'zustand';
import type { BoardElement, Step } from '@tmc/core';
import type { AppState } from '../types';

export interface StepsSlice {
  // State
  currentStepIndex: number;
  
  // Actions
  addStep: () => void;
  removeStep: (index: number) => void;
  duplicateStep: (index: number) => void;
  renameStep: (index: number, newName: string) => void;
  goToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Computed
  getSteps: () => { id: string; name: string; index: number }[];
  getTotalSteps: () => number;
}

export const createStepsSlice: StateCreator<
  AppState,
  [],
  [],
  StepsSlice
> = (set, get) => ({
  currentStepIndex: 0,
  
  addStep: () => {
    const { document, currentStepIndex, elements } = get();
    
    // Deep clone helper
    const cloneElements = (els: BoardElement[]) => structuredClone(els);
    
    // Deep clone ALL steps
    const updatedSteps = document.steps.map((step) => ({
      ...step,
      elements: cloneElements(step.elements),
    }));
    
    // Save current elements to current step first
    if (updatedSteps[currentStepIndex]) {
      updatedSteps[currentStepIndex] = {
        ...updatedSteps[currentStepIndex],
        elements: cloneElements(elements),
      };
    }
    
    // Create new step with copy of current elements
    const newStepIndex = currentStepIndex + 1;
    const newStep: Step = {
      id: `step-${Date.now()}`,
      name: `Step ${updatedSteps.length + 1}`,
      elements: cloneElements(elements),
      duration: 0.8,
    };
    
    // Insert new step after current
    updatedSteps.splice(newStepIndex, 0, newStep);
    
    const newDoc = {
      ...document,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    };
    
    const newElements = cloneElements(elements);
    
    set({
      document: newDoc,
      currentStepIndex: newStepIndex,
      elements: newElements,
      selectedIds: [],
      history: [{ elements: cloneElements(newElements), selectedIds: [] }],
      historyIndex: 0,
    });
  },
  
  removeStep: (index) => {
    const { document } = get();
    if (document.steps.length <= 1) return;
    
    const updatedSteps = document.steps.filter((_, i) => i !== index);
    const newIndex = Math.min(index, updatedSteps.length - 1);
    const newElements = updatedSteps[newIndex]?.elements ?? [];
    
    const newDoc = {
      ...document,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    };
    
    set({
      document: newDoc,
      currentStepIndex: newIndex,
      elements: structuredClone(newElements),
      selectedIds: [],
      history: [{ elements: structuredClone(newElements), selectedIds: [] }],
      historyIndex: 0,
    });
  },
  
  duplicateStep: (index) => {
    const { document } = get();
    const stepToDuplicate = document.steps[index];
    if (!stepToDuplicate) return;
    
    const newStep: Step = {
      ...stepToDuplicate,
      id: `step-${Date.now()}`,
      name: `${stepToDuplicate.name} (copy)`,
      elements: structuredClone(stepToDuplicate.elements),
    };
    
    const updatedSteps = [...document.steps];
    updatedSteps.splice(index + 1, 0, newStep);
    
    const newDoc = {
      ...document,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    };
    
    set({
      document: newDoc,
      currentStepIndex: index + 1,
      elements: structuredClone(newStep.elements),
      selectedIds: [],
      history: [{ elements: structuredClone(newStep.elements), selectedIds: [] }],
      historyIndex: 0,
    });
  },
  
  renameStep: (index, newName) => {
    const { document } = get();
    if (index < 0 || index >= document.steps.length) return;
    
    const updatedSteps = [...document.steps];
    updatedSteps[index] = {
      ...updatedSteps[index],
      name: newName,
    };
    
    const newDoc = {
      ...document,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    };
    
    set({ document: newDoc });
  },
  
  goToStep: (index) => {
    const { document, currentStepIndex, elements } = get();
    if (index < 0 || index >= document.steps.length) return;
    if (index === currentStepIndex) return;
    
    // Deep clone helper
    const cloneElements = (els: BoardElement[]) => structuredClone(els);
    
    // Deep clone ALL steps
    const updatedSteps = document.steps.map((step) => ({
      ...step,
      elements: cloneElements(step.elements),
    }));
    
    // Save current elements to current step
    if (updatedSteps[currentStepIndex]) {
      updatedSteps[currentStepIndex] = {
        ...updatedSteps[currentStepIndex],
        elements: cloneElements(elements),
      };
    }
    
    // Load new step elements
    const newElements = cloneElements(updatedSteps[index]?.elements ?? []);
    
    const newDoc = {
      ...document,
      steps: updatedSteps,
    };
    
    set({
      document: newDoc,
      currentStepIndex: index,
      elements: newElements,
      selectedIds: [],
      history: [{ elements: cloneElements(newElements), selectedIds: [] }],
      historyIndex: 0,
    });
  },
  
  nextStep: () => {
    const { currentStepIndex, document } = get();
    if (currentStepIndex < document.steps.length - 1) {
      get().goToStep(currentStepIndex + 1);
    }
  },
  
  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      get().goToStep(currentStepIndex - 1);
    }
  },
  
  getSteps: () => {
    const { document } = get();
    return document.steps.map((step, index) => ({
      id: step.id,
      name: step.name ?? `Step ${index + 1}`,
      index,
    }));
  },
  
  getTotalSteps: () => get().document.steps.length,
});
