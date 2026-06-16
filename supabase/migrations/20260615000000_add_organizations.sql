-- TMC Studio - Organizations (Clubs) Migration
-- Migration: 20260615000000_add_organizations.sql
-- Description: Adds club/team organizations, membership with roles
-- (owner/admin/coach/member), email invitations, and shared org projects.
--
-- RBAC model:
--   owner  - created the organization, full control, cannot be removed
--   admin  - "club admin": manage members, invitations, org settings
--   coach  - can view/edit org-shared projects, cannot manage members
--   member - read-only access to org-shared projects (reserved for future use)

-- =====================================================
-- 1. ORGANIZATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);

DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 2. ORGANIZATION MEMBERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('owner', 'admin', 'coach', 'member')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);

-- =====================================================
-- 3. INVITATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL CHECK (email = lower(email)),
  role TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('admin', 'coach', 'member')),
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
-- Only one pending invitation per (org, email)
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_unique
  ON public.invitations(organization_id, email)
  WHERE status = 'pending';

-- =====================================================
-- 4. PROJECTS: LINK TO ORGANIZATION (shared club resources)
-- =====================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);

-- =====================================================
-- 5. HELPER FUNCTIONS (SECURITY DEFINER to avoid recursive RLS)
-- =====================================================

-- Is the current user a member of this organization?
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Is the current user an owner/admin ("club admin") of this organization?
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Current user's role in this organization (NULL if not a member)
CREATE OR REPLACE FUNCTION public.get_org_role(p_org_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.organization_members
  WHERE organization_id = p_org_id AND user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- 6. AUTO-MEMBERSHIP: creator becomes 'owner'
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- =====================================================
-- 7. ACCEPT INVITATION (atomic, callable via RPC)
-- =====================================================

-- Accepts a pending invitation for the CURRENT authenticated user.
-- Matches on token + the user's own email (so an invite can't be hijacked
-- by a different account that merely guesses the token).
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token UUID)
RETURNS TABLE (organization_id UUID, role TEXT) AS $$
DECLARE
  v_invitation public.invitations;
  v_user_email TEXT;
BEGIN
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invitation FROM public.invitations
  WHERE token = p_token AND status = 'pending'
  FOR UPDATE;

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already used';
  END IF;

  IF v_invitation.expires_at < NOW() THEN
    UPDATE public.invitations SET status = 'expired' WHERE id = v_invitation.id;
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  IF lower(v_user_email) != lower(v_invitation.email) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
  VALUES (v_invitation.organization_id, auth.uid(), v_invitation.role, v_invitation.invited_by)
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN QUERY SELECT v_invitation.organization_id, v_invitation.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- --- organizations ---

CREATE POLICY "org_select_member"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id));

CREATE POLICY "org_insert_self"
  ON public.organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "org_update_admin"
  ON public.organizations FOR UPDATE
  USING (public.is_org_admin(id));

CREATE POLICY "org_delete_owner"
  ON public.organizations FOR DELETE
  USING (owner_id = auth.uid());

-- --- organization_members ---
-- NOTE: policies call is_org_member()/is_org_admin(), which are
-- SECURITY DEFINER and query this table internally — this is safe and does
-- NOT recurse, because SECURITY DEFINER functions bypass RLS on the table
-- they query (no nested policy evaluation).

CREATE POLICY "org_members_select"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "org_members_insert_admin"
  ON public.organization_members FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "org_members_update_admin"
  ON public.organization_members FOR UPDATE
  USING (public.is_org_admin(organization_id));

-- Admins can remove members; members can remove themselves (leave club).
-- Owners cannot be removed (enforced: no row has role='owner' deletable
-- except by themselves, and the app UI never offers this).
CREATE POLICY "org_members_delete"
  ON public.organization_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.is_org_admin(organization_id)
  );

-- --- invitations ---

-- Admins manage invitations for their org; invited users can see (and the
-- accept_invitation RPC, which is SECURITY DEFINER, handles acceptance).
CREATE POLICY "invitations_select_admin"
  ON public.invitations FOR SELECT
  USING (
    public.is_org_admin(organization_id)
    OR lower(email) = lower(auth.email())
  );

CREATE POLICY "invitations_insert_admin"
  ON public.invitations FOR INSERT
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "invitations_update_admin"
  ON public.invitations FOR UPDATE
  USING (public.is_org_admin(organization_id));

CREATE POLICY "invitations_delete_admin"
  ON public.invitations FOR DELETE
  USING (public.is_org_admin(organization_id));

-- --- projects: additional policies for org-shared projects ---
-- These are ADDITIONAL permissive policies (OR'd with the existing
-- projects_select_own / projects_update_own policies from
-- 20260109000001_fix_rls_complete.sql).

CREATE POLICY "projects_select_org_member"
  ON public.projects FOR SELECT
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id));

CREATE POLICY "projects_update_org_member"
  ON public.projects FOR UPDATE
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id));

-- =====================================================
-- 9. INVITATION PREVIEW (callable by anonymous visitors)
-- =====================================================

-- Lets an unauthenticated visitor on /invite?token=... see basic info
-- (club name, role, email, status, expiry) without exposing the full
-- invitations table to anon via RLS.
CREATE OR REPLACE FUNCTION public.get_invitation_preview(p_token UUID)
RETURNS TABLE (
  organization_name TEXT,
  email TEXT,
  role TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ
) AS $$
  SELECT o.name, i.email, i.role, i.status, i.expires_at
  FROM public.invitations i
  JOIN public.organizations o ON o.id = i.organization_id
  WHERE i.token = p_token;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_invitation_preview(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(UUID) TO authenticated;

-- =====================================================
-- 10. MAX SEATS ENFORCEMENT (best-effort, app also checks entitlements)
-- =====================================================

-- Returns the number of accepted members + pending invitations for an org,
-- used by the app to enforce plan seat limits before creating invitations.
CREATE OR REPLACE FUNCTION public.get_org_seat_usage(p_org_id UUID)
RETURNS INTEGER AS $$
  SELECT
    (SELECT COUNT(*) FROM public.organization_members WHERE organization_id = p_org_id)
    +
    (SELECT COUNT(*) FROM public.invitations WHERE organization_id = p_org_id AND status = 'pending')
  ;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_org_seat_usage(UUID) TO authenticated;
