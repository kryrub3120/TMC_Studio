-- TMC Studio - Project Organization Migration
-- Migration: 20260109000002_add_project_organization.sql
-- Description: Adds folders, tags, and enhanced project organization features

-- =====================================================
-- 1. PROJECT FOLDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  color TEXT DEFAULT '#3b82f6' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon TEXT DEFAULT 'folder',
  description TEXT,
  parent_id UUID REFERENCES public.project_folders(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent circular references
  CONSTRAINT no_self_reference CHECK (id != parent_id)
);

-- Indexes for folders
CREATE INDEX IF NOT EXISTS idx_project_folders_user_id ON public.project_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_project_folders_parent_id ON public.project_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_project_folders_position ON public.project_folders(user_id, position);

-- =====================================================
-- 2. ADD FOLDER AND TAGS TO PROJECTS
-- =====================================================

-- Add folder_id column to projects
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.project_folders(id) ON DELETE SET NULL;

-- Add tags array to projects
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add favorite flag to projects
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Add position within folder
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_projects_folder_id ON public.projects(folder_id);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON public.projects USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_projects_is_favorite ON public.projects(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_projects_position ON public.projects(folder_id, position);

-- =====================================================
-- 3. PROJECT TAGS TABLE (for suggested/popular tags)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 50),
  color TEXT DEFAULT '#6b7280',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique tag name per user
  UNIQUE(user_id, name)
);

-- Index for tags
CREATE INDEX IF NOT EXISTS idx_project_tags_user_id ON public.project_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tags_usage_count ON public.project_tags(user_id, usage_count DESC);

-- =====================================================
-- 4. AUTO-UPDATE TIMESTAMPS
-- =====================================================

-- Auto-update updated_at for folders
DROP TRIGGER IF EXISTS project_folders_updated_at ON public.project_folders;
CREATE TRIGGER project_folders_updated_at
  BEFORE UPDATE ON public.project_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on folders
ALTER TABLE public.project_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;

-- Folders policies
CREATE POLICY "Users can view own folders"
  ON public.project_folders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own folders"
  ON public.project_folders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own folders"
  ON public.project_folders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own folders"
  ON public.project_folders FOR DELETE
  USING (user_id = auth.uid());

-- Tags policies
CREATE POLICY "Users can view own tags"
  ON public.project_tags FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own tags"
  ON public.project_tags FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tags"
  ON public.project_tags FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tags"
  ON public.project_tags FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to increment tag usage count
CREATE OR REPLACE FUNCTION public.increment_tag_usage(p_user_id UUID, p_tag_name TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.project_tags (user_id, name, usage_count)
  VALUES (p_user_id, p_tag_name, 1)
  ON CONFLICT (user_id, name) 
  DO UPDATE SET usage_count = project_tags.usage_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get projects with folder info (for sorting/filtering)
CREATE OR REPLACE FUNCTION public.get_user_projects_organized(p_user_id UUID)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  folder_id UUID,
  folder_name TEXT,
  tags TEXT[],
  is_favorite BOOLEAN,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.folder_id,
    f.name,
    p.tags,
    p.is_favorite,
    p.updated_at
  FROM public.projects p
  LEFT JOIN public.project_folders f ON p.folder_id = f.id
  WHERE p.user_id = p_user_id
  ORDER BY p.is_favorite DESC, p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. DEFAULT FOLDERS (Optional - create on user signup)
-- =====================================================

-- Function to create default folders for new user
CREATE OR REPLACE FUNCTION public.create_default_folders(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.project_folders (user_id, name, color, icon, position)
  VALUES 
    (p_user_id, 'Tactics', '#ef4444', 'target', 0),
    (p_user_id, 'Training', '#10b981', 'activity', 1),
    (p_user_id, 'Set Pieces', '#f59e0b', 'corner-down-right', 2)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
