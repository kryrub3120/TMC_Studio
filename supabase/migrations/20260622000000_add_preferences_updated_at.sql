-- Add updated_at tracking to profiles.preferences for last-write-wins conflict resolution
-- B1.7: enable proper merge strategy when syncing across devices

-- Add updated_at column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferences_updated_at TIMESTAMPTZ DEFAULT now();

-- Update comment to reflect the current schema
COMMENT ON COLUMN profiles.preferences IS 'User preferences stored as JSONB: theme, gridVisible, snapEnabled, gridSize, defaultArrowType, stepDuration, arrowDefaults, zoneDefaults, bottomBar, inspector';

-- Create or replace trigger function to auto-update preferences_updated_at
CREATE OR REPLACE FUNCTION update_preferences_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.preferences_updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to ensure it's current
DROP TRIGGER IF EXISTS trg_profiles_preferences_updated_at ON profiles;
CREATE TRIGGER trg_profiles_preferences_updated_at
  BEFORE UPDATE OF preferences ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_preferences_timestamp();

-- Remove any earlier insecure overload that trusted a client-supplied user id.
DROP FUNCTION IF EXISTS merge_preferences(UUID, JSONB);

-- RPC for atomic JSONB merge — used by the beforeunload flush.
-- SECURITY: the target row is derived from auth.uid() (the caller's JWT), never from a
-- client-supplied id, so a caller can only ever merge into their OWN preferences.
-- Merges partial preferences into the existing JSONB without overwriting other keys.
CREATE OR REPLACE FUNCTION merge_preferences(p_preferences JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET preferences = COALESCE(preferences, '{}'::jsonb) || p_preferences
  WHERE id = auth.uid();
END;
$$;

-- Lock down execution: authenticated users only, never anon/public.
REVOKE EXECUTE ON FUNCTION merge_preferences(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION merge_preferences(JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION merge_preferences(JSONB) TO authenticated;
