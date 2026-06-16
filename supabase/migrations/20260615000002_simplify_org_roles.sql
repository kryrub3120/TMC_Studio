-- TMC Studio - Simplify club roles to owner / member
-- Migration: 20260615000002_simplify_org_roles.sql
--
-- Product simplification: within a club, access is binary - you either
-- have access to the club's shared projects (member) or you own/manage the
-- club (owner). The previous admin/coach/member distinction added
-- complexity without a corresponding UI need (members never saw their role
-- affect what they could do).
--
-- This migration:
--   - Collapses existing 'admin' and 'coach' member rows to 'member'.
--   - Restricts organization_members.role to ('owner', 'member').
--   - Restricts invitations.role to ('member') - only owners send invites,
--     and invited people always join as plain members.
--   - Redefines is_org_admin() as "is this user the owner" (the only role
--     that can manage the club), since 'admin' no longer exists.

-- =====================================================
-- 1. COLLAPSE EXISTING ROLES
-- =====================================================

UPDATE public.organization_members
SET role = 'member'
WHERE role IN ('admin', 'coach');

UPDATE public.invitations
SET role = 'member'
WHERE role IN ('admin', 'coach');

-- =====================================================
-- 2. UPDATE CHECK CONSTRAINTS
-- =====================================================

ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_check;

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_role_check CHECK (role IN ('owner', 'member'));

ALTER TABLE public.organization_members
  ALTER COLUMN role SET DEFAULT 'member';

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_role_check;

ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_role_check CHECK (role IN ('member'));

ALTER TABLE public.invitations
  ALTER COLUMN role SET DEFAULT 'member';

-- =====================================================
-- 3. REDEFINE is_org_admin(): owner-only management
-- =====================================================
-- "Admin" now simply means "the club owner" - the only role with
-- management permissions (invite/remove members, rename club, etc.).

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
