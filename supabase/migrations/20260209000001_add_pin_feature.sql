-- TMC Studio - Add Pin Feature
-- Migration: 20260209000001_add_pin_feature.sql
-- Description: Adds is_pinned field to projects and folders for L1 feature

-- =====================================================
-- 1. ADD is_pinned TO PROJECTS
-- =====================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Index for pinned projects (for faster filtering)
CREATE INDEX IF NOT EXISTS idx_projects_is_pinned ON public.projects(is_pinned) WHERE is_pinned = true;

-- =====================================================
-- 2. ADD is_pinned TO FOLDERS
-- =====================================================

ALTER TABLE public.project_folders
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Index for pinned folders (for faster filtering)
CREATE INDEX IF NOT EXISTS idx_project_folders_is_pinned ON public.project_folders(is_pinned) WHERE is_pinned = true;
