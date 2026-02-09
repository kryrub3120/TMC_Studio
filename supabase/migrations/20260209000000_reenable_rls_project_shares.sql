-- Re-enable RLS on project_shares table
-- Migration: 20260209000000_reenable_rls_project_shares.sql
-- Description: Security fix - re-enable Row Level Security on project_shares
-- Context: RLS was disabled in 20260109000001 as temporary measure
-- Since sharing feature is not used in V1, we re-enable with deny-by-default

-- =====================================================
-- RE-ENABLE RLS ON PROJECT_SHARES
-- =====================================================

-- Re-enable RLS (with no policies = deny by default)
-- This is secure: if sharing is not implemented, nobody needs access
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

-- Note: No policies created yet since sharing feature is not in V1
-- When sharing is implemented, add appropriate policies here:
-- - Project owners can create/delete shares
-- - Users can view shares targeting them
-- - Users can view shares they own
