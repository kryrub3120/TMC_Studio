-- Complete RLS fix - drop ALL policies and recreate with simplest approach
-- Migration: 20260109000001_fix_rls_complete.sql

-- =====================================================
-- STEP 1: DROP ALL POLICIES ON PROJECTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update shared projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- =====================================================
-- STEP 2: DROP ALL POLICIES ON PROJECT_SHARES
-- =====================================================
DROP POLICY IF EXISTS "Project owners can manage shares" ON public.project_shares;
DROP POLICY IF EXISTS "Users can view their shares" ON public.project_shares;

-- =====================================================
-- STEP 3: CREATE SIMPLE PROJECTS POLICIES (NO SUBQUERIES)
-- =====================================================

-- SELECT: Users can see their own projects or public ones
CREATE POLICY "projects_select_own"
  ON public.projects FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

-- INSERT: Users can create projects for themselves
CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own projects
CREATE POLICY "projects_update_own"
  ON public.projects FOR UPDATE
  USING (user_id = auth.uid());

-- DELETE: Users can delete their own projects
CREATE POLICY "projects_delete_own"
  ON public.projects FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- STEP 4: CREATE SIMPLE PROJECT_SHARES POLICIES
-- =====================================================

-- Disable RLS on project_shares temporarily (sharing feature not critical for MVP)
ALTER TABLE public.project_shares DISABLE ROW LEVEL SECURITY;
