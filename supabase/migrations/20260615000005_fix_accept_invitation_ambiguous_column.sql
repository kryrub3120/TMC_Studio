-- TMC Studio — Fix ambiguous column reference in accept_invitation
-- Migration: 20260615000005_fix_accept_invitation_ambiguous_column.sql
--
-- The accept_invitation function RETURNS TABLE (organization_id UUID, role TEXT)
-- which creates output parameter names that collide with column names in the
-- ON CONFLICT clause. Fix: qualify columns with the table name.
--
-- Applies to: production (function exists there with the bug)

-- =====================================================
-- 1. RECREATE accept_invitation with qualified column refs
-- =====================================================

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token UUID)
RETURNS TABLE (out_organization_id UUID, out_role TEXT) AS $$
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

  -- Qualified column names to avoid ambiguity with RETURN TABLE parameters
  INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
  VALUES (v_invitation.organization_id, auth.uid(), v_invitation.role, v_invitation.invited_by)
  ON CONFLICT (organization_id, user_id)
    DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN QUERY SELECT v_invitation.organization_id, v_invitation.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. RECREATE handle_new_organization with qualified refs too
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