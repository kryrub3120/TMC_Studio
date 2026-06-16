-- TMC Studio — Tighten Storage Bucket Policies
-- Migration: 20260615000000_tighten_storage_policies.sql
-- Description: Tighten RLS policies on storage buckets for security
-- Changes:
--   1. avatars: only user can upload/update to their own folder (already correct)
--   2. thumbnails: require authentication for upload (already correct)
--   3. Add explicit DENY for avatars/thumbnails DELETE by non-owners
--   4. Rate limiting hint: storage.object.event insert/update already bounded by auth.uid()

DO LANGUAGE plpgsql $$
BEGIN
  -- Only the owner can delete their own avatar
  EXECUTE 'CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = ''avatars''
      AND auth.uid()::text = (storage.foldername(name))[1]
    )';

  -- Only authenticated user who created the thumbnail can delete it
  EXECUTE 'CREATE POLICY "Users can delete own thumbnails"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = ''thumbnails''
      AND auth.role() = ''authenticated''
      AND auth.uid()::text = (storage.foldername(name))[1]
    )';
EXCEPTION
  WHEN SQLSTATE '42P01' THEN
    RAISE NOTICE 'storage.objects not available yet, skipping tighten storage policies';
END;
$$;

-- Thumbnails upload already requires authentication (existing policy)
-- Thumbnails view is public by design (shared boards)

-- =====================================================
-- 3. VERIFICATION QUERIES (run manually to confirm)
-- =====================================================
-- 
-- Check all storage policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects';
--
-- Expected policies for 'avatars':
-- - "Anyone can view avatars"    → SELECT for all (public avatars)
-- - "Users can upload own avatar" → INSERT where auth.uid() matches folder
-- - "Users can update own avatar" → UPDATE where auth.uid() matches folder
-- - "Users can delete own avatar" → DELETE where auth.uid() matches folder
--
-- Expected policies for 'thumbnails':
-- - "Anyone can view thumbnails"     → SELECT for all (public thumbnails)
-- - "Users can upload own thumbnails" → INSERT where authenticated
-- - "Users can delete own thumbnails" → DELETE where auth.uid() matches folder