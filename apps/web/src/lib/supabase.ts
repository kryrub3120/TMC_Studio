/**
 * Supabase Client Configuration
 * TMC Studio - Cloud backend integration
 */

/// <reference types="vite/client" />

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { BoardDocument } from '@tmc/core';

// Environment variables (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Validate environment
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials not found. Cloud features will be disabled.\n' +
    'To enable, create apps/web/.env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

// Create Supabase client (untyped for flexibility, types will be generated later)
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Fix AbortError in Navigator Locks API during OAuth redirects
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'tmc-auth-token',
        flowType: 'pkce',
      },
    })
  : null;

// Check if Supabase is available
export const isSupabaseEnabled = (): boolean => {
  return supabase !== null;
};

// =====================================================
// AUTH HELPERS
// =====================================================

export type User = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'team';
};

/** Get current authenticated user */
export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Try to fetch existing profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // If no profile exists, create one (for OAuth users)
  if (!profile) {
    console.log('Creating profile for new OAuth user:', user.id);
    const newProfile = {
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      subscription_tier: 'free' as const,
    };
    
    const { data: created, error } = await supabase
      .from('profiles')
      .upsert(newProfile)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating profile:', error);
      // Return basic user even without profile
      return {
        id: user.id,
        email: user.email ?? '',
        full_name: newProfile.full_name ?? undefined,
        avatar_url: newProfile.avatar_url ?? undefined,
        subscription_tier: 'free',
      };
    }
    
    profile = created;
  }
  
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name ?? undefined,
    avatar_url: profile.avatar_url ?? undefined,
    subscription_tier: profile.subscription_tier ?? 'free',
  };
}

/** Sign up with email and password */
export async function signUp(email: string, password: string, fullName?: string) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });
  
  if (error) throw error;
  return data;
}

/** Sign in with email and password */
export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

/** Sign out */
export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Sign in with OAuth (Google) */
export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Redirect to home page - Supabase handles token extraction
      redirectTo: window.location.origin,
    },
  });
  
  if (error) throw error;
  return data;
}

// =====================================================
// PROJECTS API
// =====================================================

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  document: BoardDocument;
  thumbnail_url: string | null;
  is_public: boolean;
  is_template: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectInsert {
  name?: string;
  description?: string | null;
  document: BoardDocument;
  thumbnail_url?: string | null;
  is_public?: boolean;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  document?: BoardDocument;
  thumbnail_url?: string | null;
  is_public?: boolean;
}

/** Get all projects for current user */
export async function getProjects(): Promise<Project[]> {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  
  return (data ?? []) as Project[];
}

/** Get single project by ID */
export async function getProject(id: string): Promise<Project | null> {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }
  
  return data as Project;
}

/** Create new project */
export async function createProject(project: ProjectInsert): Promise<Project | null> {
  if (!supabase) return null;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...project, user_id: user.id })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }
  
  return data as Project;
}

/** Update existing project */
export async function updateProject(id: string, updates: ProjectUpdate): Promise<Project | null> {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }
  
  return data as Project;
}

/** Delete project */
export async function deleteProject(id: string): Promise<boolean> {
  if (!supabase) return false;
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting project:', error);
    return false;
  }
  
  return true;
}

// =====================================================
// TEMPLATES API
// =====================================================

export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: 'attack' | 'defense' | 'set-piece' | 'training' | 'formation' | 'other' | null;
  document: BoardDocument;
  thumbnail_url: string | null;
  author_id: string | null;
  author_name: string | null;
  downloads_count: number;
  is_featured: boolean;
  created_at: string;
}

/** Get all templates */
export async function getTemplates(category?: string): Promise<Template[]> {
  if (!supabase) return [];
  
  let query = supabase
    .from('templates')
    .select('*')
    .order('downloads_count', { ascending: false });
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
  
  return (data ?? []) as Template[];
}

/** Get featured templates */
export async function getFeaturedTemplates(): Promise<Template[]> {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('is_featured', true)
    .order('downloads_count', { ascending: false })
    .limit(6);
  
  if (error) {
    console.error('Error fetching featured templates:', error);
    return [];
  }
  
  return (data ?? []) as Template[];
}

// =====================================================
// STORAGE HELPERS
// =====================================================

/** Upload project thumbnail */
export async function uploadThumbnail(projectId: string, file: Blob): Promise<string | null> {
  if (!supabase) return null;
  
  const fileName = `${projectId}/thumbnail.png`;
  
  const { error } = await supabase.storage
    .from('thumbnails')
    .upload(fileName, file, { upsert: true });
  
  if (error) {
    console.error('Error uploading thumbnail:', error);
    return null;
  }
  
  const { data } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(fileName);
  
  return data.publicUrl;
}

/** Upload user avatar */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  if (!supabase) return null;
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;
  
  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });
  
  if (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
  
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);
  
  return data.publicUrl;
}

// =====================================================
// AUTH STATE LISTENER
// =====================================================

/** Subscribe to auth state changes */
export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!supabase) {
    callback(null);
    return () => {};
  }
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (session?.user) {
        const user = await getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    }
  );
  
  return () => subscription.unsubscribe();
}

