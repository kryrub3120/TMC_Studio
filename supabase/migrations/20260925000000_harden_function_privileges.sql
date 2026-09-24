-- Harden SECURITY DEFINER functions exposed through PostgREST (/rest/v1/rpc/*).
-- Findings: Supabase advisor 2026-09-24 (lints 0011, 0028, 0029).
--
-- Real exposures fixed here:
--   * get_user_projects_organized(p_user_id) returned ANY user's project names
--     and tags to anyone, including anonymous callers.
--   * create_default_folders(p_user_id) / increment_tag_usage(p_user_id, ...)
--     let any caller write rows into another user's account.
--   * get_org_seat_usage(p_org_id) disclosed seat counts of any organization.
--
-- Kept callable on purpose:
--   * get_invitation_preview(p_token)  -> anon + authenticated (invite page
--     is shown before sign-in; access is gated by the secret token).
--   * is_org_member / is_org_admin     -> anon + authenticated, because RLS
--     policies with role "public" call them; they only answer for auth.uid().
--   * accept_invitation, transfer_ownership, get_org_role, get_org_seat_usage
--     -> authenticated only (all check auth.uid()).
--
-- Trigger functions are never called through the API. Revoking EXECUTE does
-- not stop triggers from firing.

BEGIN;

-- 1. Pin search_path on every public function (lint 0011).
ALTER FUNCTION public.accept_invitation(uuid)                  SET search_path = public, pg_temp;
ALTER FUNCTION public.create_default_folders(uuid)             SET search_path = public, pg_temp;
ALTER FUNCTION public.get_invitation_preview(uuid)             SET search_path = public, pg_temp;
ALTER FUNCTION public.get_org_role(uuid)                       SET search_path = public, pg_temp;
ALTER FUNCTION public.get_org_seat_usage(uuid)                 SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_projects_organized(uuid)        SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_organization()                SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user()                        SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_tag_usage(uuid, text)          SET search_path = public, pg_temp;
ALTER FUNCTION public.is_org_admin(uuid)                       SET search_path = public, pg_temp;
ALTER FUNCTION public.is_org_member(uuid)                      SET search_path = public, pg_temp;
ALTER FUNCTION public.prevent_owner_membership_change()        SET search_path = public, pg_temp;
ALTER FUNCTION public.transfer_ownership(uuid, uuid)           SET search_path = public, pg_temp;
ALTER FUNCTION public.update_projects_count()                  SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at()                      SET search_path = public, pg_temp;

-- 2. Internal-only functions: nobody may call them through the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_organization()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_projects_count()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_owner_membership_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_default_folders(uuid)      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_projects_organized(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_tag_usage(uuid, text)   FROM PUBLIC, anon, authenticated;

-- 3. Signed-in only.
REVOKE EXECUTE ON FUNCTION public.accept_invitation(uuid)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.transfer_ownership(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_org_role(uuid)             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_org_seat_usage(uuid)       FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.accept_invitation(uuid)        TO authenticated;
GRANT  EXECUTE ON FUNCTION public.transfer_ownership(uuid, uuid) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_org_role(uuid)             TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_org_seat_usage(uuid)       TO authenticated;

-- 4. Seat usage only for members of that organization.
CREATE OR REPLACE FUNCTION public.get_org_seat_usage(p_org_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_org_member(p_org_id) THEN
    RAISE EXCEPTION 'Not a member of this organization' USING ERRCODE = '42501';
  END IF;

  RETURN (
    (SELECT COUNT(*) FROM public.organization_members WHERE organization_id = p_org_id)
    +
    (SELECT COUNT(*) FROM public.invitations WHERE organization_id = p_org_id AND status = 'pending')
  )::integer;
END;
$$;

-- 5. Explicitly keep what must stay reachable.
GRANT EXECUTE ON FUNCTION public.get_invitation_preview(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid)           TO anon, authenticated;

COMMIT;
