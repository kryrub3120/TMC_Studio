-- Thumbnails live at thumbnails/<project_id>/thumbnail.png and are uploaded
-- with upsert. There was no UPDATE policy, so every re-save of an existing
-- thumbnail failed with "new row violates row-level security policy"
-- (Sentry JAVASCRIPT-9). INSERT allowed any signed-in user to write into any
-- project folder, and DELETE compared the folder to auth.uid(), which never
-- matches a project id. All three now check project ownership (or org
-- membership for org projects). storage.objects.name must be qualified inside
-- the subquery, otherwise it resolves to projects.name.

DROP POLICY IF EXISTS "Users can upload own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own thumbnails" ON storage.objects;

CREATE POLICY "Users can upload own thumbnails"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(objects.name))[1]
        AND (p.user_id = auth.uid()
             OR (p.organization_id IS NOT NULL AND public.is_org_member(p.organization_id)))
    )
  );

CREATE POLICY "Users can update own thumbnails"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(objects.name))[1]
        AND (p.user_id = auth.uid()
             OR (p.organization_id IS NOT NULL AND public.is_org_member(p.organization_id)))
    )
  )
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(objects.name))[1]
        AND (p.user_id = auth.uid()
             OR (p.organization_id IS NOT NULL AND public.is_org_member(p.organization_id)))
    )
  );

CREATE POLICY "Users can delete own thumbnails"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(objects.name))[1]
        AND p.user_id = auth.uid()
    )
  );
