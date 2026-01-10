-- Add preferences column to profiles table for cloud sync
-- This allows users to sync theme, grid, snap settings across devices

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN profiles.preferences IS 'User preferences stored as JSONB: { theme, gridVisible, snapEnabled, cheatSheetVisible }';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON profiles USING gin(preferences);
