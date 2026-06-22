-- Add updated_at tracking to profiles.preferences for last-write-wins conflict resolution
-- B1.7: enable proper merge strategy when syncing across devices

-- Add updated_at column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferences_updated_at TIMESTAMPTZ DEFAULT now();

-- Update comment to reflect the current schema
COMMENT ON COLUMN profiles.preferences IS 'User preferences stored as JSONB: theme, gridVisible, snapEnabled, gridSize, defaultArrowType, stepDuration, arrowDefaults, zoneDefaults, bottomBar, inspector';

-- Create or replace trigger function to auto-update preferences_updated_at
CREATE OR REPLACE FUNCTION update_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.preferences_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure it's current
DROP TRIGGER IF EXISTS trg_profiles_preferences_updated_at ON profiles;
CREATE TRIGGER trg_profiles_preferences_updated_at
  BEFORE UPDATE OF preferences ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_preferences_timestamp();

-- RPC for atomic JSONB merge — used by beforeunload flush and updatePreferences.
-- Merges partial preferences into the existing JSONB column without overwriting
-- other keys (fixes the race where raw PATCH would nuke arrowDefaults/zoneDefaults).
CREATE OR REPLACE FUNCTION merge_preferences(p_user_id UUID, p_preferences JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE profiles
  SET preferences = COALESCE(preferences, '{}'::jsonb) || p_preferences
  WHERE id = p_user_id;
END;
$$;