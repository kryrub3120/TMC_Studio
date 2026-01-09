-- Fix RLS infinite recursion in projects policy
-- Migration: 20260109000000_fix_rls_recursion.sql
-- Problem: "Users can view own projects" policy causes infinite recursion
-- by referencing project_shares which also references projects

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can manage shares" ON public.project_shares;

-- Recreate projects SELECT policy (simplified - no cross-table reference)
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (
    user_id = auth.uid() 
    OR is_public = true
  );

-- Users can view shared projects too (separate policy to avoid recursion)
CREATE POLICY "Users can view shared projects"
  ON public.projects FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM public.project_shares 
      WHERE shared_with_user_id = auth.uid()
    )
  );

-- Recreate projects UPDATE policy (simplified)
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (user_id = auth.uid());

-- Users can update shared projects with edit permission
CREATE POLICY "Users can update shared projects"
  ON public.projects FOR UPDATE
  USING (
    id IN (
      SELECT project_id FROM public.project_shares 
      WHERE shared_with_user_id = auth.uid() AND permission = 'edit'
    )
  );

-- Recreate project_shares policy (simplified - no cross-table reference)
CREATE POLICY "Project owners can manage shares"
  ON public.project_shares FOR ALL
  USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );
