-- Allow organization deletion to cascade through the owner's membership.
-- Direct deletion or demotion of an owner remains blocked while the parent
-- organization still exists.

CREATE OR REPLACE FUNCTION public.prevent_owner_membership_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'owner' AND EXISTS (
      SELECT 1
      FROM public.organizations
      WHERE id = OLD.organization_id
    ) THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
