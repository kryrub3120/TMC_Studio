-- Drop preferences_updated_at column and trigger — never read by application code.
-- The cloud-wins strategy via merge_preferences RPC (JSONB-merge) does not need
-- timestamp-based conflict resolution.
-- Rollback: re-run 20260622000000_add_preferences_updated_at.sql

-- Drop trigger first
DROP TRIGGER IF EXISTS trg_profiles_preferences_updated_at ON profiles;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_preferences_timestamp();

-- Drop column
ALTER TABLE profiles DROP COLUMN IF EXISTS preferences_updated_at;