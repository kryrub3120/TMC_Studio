-- TMC Studio - Organization Ownership Transfer
-- Migration: 20260615000001_org_ownership_transfer.sql
--
-- Fixes a gap in 20260615000000_add_organizations.sql: previously an owner
-- could remove themselves from organization_members (via "leave" or
-- self-delete), leaving the club without an owner.
--
-- Adds:
--   - transfer_ownership(): atomically hands the 'owner' role to another
--     member (the previous owner becomes a regular 'member').
--   - A trigger that blocks deleting the 'owner' membership row outright,
--     so the UI must use transfer_ownership (or delete the whole club)
--     instead of "leave".

-- =====================================================
-- 1. TRANSFER OWNERSHIP (atomic, callable via RPC)
-- =====================================================

CREATE OR REPLACE FUNCTION public.transfer_ownership(p_org_id UUID, p_new_owner_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = p_org_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the current owner can transfer ownership';
  END IF;

  IF p_new_owner_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You are already the owner';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = p_new_owner_user_id
  ) THEN
    RAISE EXCEPTION 'The selected member no longer belongs to this club';
  END IF;

  -- Previous owner becomes a regular member (only one owner per club).
  UPDATE public.organization_members
  SET role = 'member'
  WHERE organization_id = p_org_id AND user_id = auth.uid();

  -- New owner.
  UPDATE public.organization_members
  SET role = 'owner'
  WHERE organization_id = p_org_id AND user_id = p_new_owner_user_id;

  UPDATE public.organizations
  SET owner_id = p_new_owner_user_id
  WHERE id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.transfer_ownership(UUID, UUID) TO authenticated;

-- =====================================================
-- 2. GUARD: cannot remove (or relabel away) the owner's membership row
-- =====================================================
-- Forces the UI to go through transfer_ownership() (or delete the whole
-- organization, which cascades) instead of leaving the club ownerless.

CREATE OR REPLACE FUNCTION public.prevent_owner_membership_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' THEN
      RAISE EXCEPTION 'The club owner cannot be removed. Transfer ownership first, or delete the club.';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
      RAISE EXCEPTION 'Use transfer_ownership() to change the club owner.';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS guard_owner_membership ON public.organization_members;
CREATE TRIGGER guard_owner_membership
  BEFORE UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_owner_membership_change();
