-- Team scenario (launch stage E2).
--
-- 1. Members of a club get Team access. accept_invitation only adds a row to
--    organization_members, while the app derived the plan from the user's own
--    subscription_tier / profiles.team_id, so invited members stayed on Free.
--    get_my_club_access() returns the club that grants access: one the caller
--    belongs to whose owner has an active Team subscription.
-- 2. An invited person can decline an invitation (status 'declined'). A
--    declined invitation no longer counts toward the seat limit.
-- 3. Club members can delete thumbnails of club projects, matching the
--    INSERT/UPDATE policies from 20260925011411.

BEGIN;

-- 1. Club access -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_club_access()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT m.organization_id
  FROM public.organization_members m
  JOIN public.organizations o ON o.id = m.organization_id
  JOIN public.profiles owner_profile ON owner_profile.id = o.owner_id
  WHERE auth.uid() IS NOT NULL
    AND m.user_id = auth.uid()
    AND owner_profile.subscription_tier = 'team'
    AND (owner_profile.subscription_expires_at IS NULL
         OR owner_profile.subscription_expires_at > now())
  ORDER BY m.created_at
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_club_access() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_club_access() TO authenticated;

-- 2. Decline an invitation ---------------------------------------------------

ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_status_check;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_status_check
  CHECK (status IN ('pending', 'accepted', 'revoked', 'expired', 'declined'));

CREATE OR REPLACE FUNCTION public.decline_invitation(p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_email text;
  v_invitation public.invitations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO v_invitation FROM public.invitations
  WHERE token = p_token AND status = 'pending'
  FOR UPDATE;

  IF v_invitation.id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already used';
  END IF;

  IF lower(v_user_email) IS DISTINCT FROM lower(v_invitation.email) THEN
    RAISE EXCEPTION 'This invitation was sent to a different email address';
  END IF;

  UPDATE public.invitations SET status = 'declined' WHERE id = v_invitation.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decline_invitation(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.decline_invitation(uuid) TO authenticated;

-- 3. Thumbnails: club members may delete club project thumbnails -------------

DROP POLICY IF EXISTS "Users can delete own thumbnails" ON storage.objects;

CREATE POLICY "Users can delete own thumbnails"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(objects.name))[1]
        AND (p.user_id = auth.uid()
             OR (p.organization_id IS NOT NULL AND public.is_org_member(p.organization_id)))
    )
  );

COMMIT;
