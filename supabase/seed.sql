-- TMC Studio - Seed Data for Local Development
-- Used by: supabase db reset

-- =====================================================
-- Sample Templates (available without auth)
-- =====================================================

INSERT INTO public.templates (id, name, description, category, document, author_name, downloads_count, is_featured)
VALUES 
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '4-3-3 Attack',
    'Classic attacking formation with wide wingers',
    'formation',
    '{"version":"1.0.0","name":"4-3-3 Attack","steps":[{"id":"step-1","name":"Initial Setup","elements":[],"duration":0.8}]}',
    'TMC Studio',
    150,
    true
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'Counter Attack Pattern',
    'Quick transition from defense to attack',
    'attack',
    '{"version":"1.0.0","name":"Counter Attack","steps":[{"id":"step-1","name":"Defense","elements":[],"duration":0.8},{"id":"step-2","name":"Transition","elements":[],"duration":0.8}]}',
    'TMC Studio',
    89,
    true
  ),
  (
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    'Set Piece - Corner',
    'Near post corner kick routine',
    'set-piece',
    '{"version":"1.0.0","name":"Corner Kick","steps":[{"id":"step-1","name":"Setup","elements":[],"duration":0.8}]}',
    'TMC Studio',
    72,
    false
  ),
  (
    'd4e5f6a7-b8c9-0123-def0-456789012345',
    'Rondo 4v2',
    'Basic possession training drill',
    'training',
    '{"version":"1.0.0","name":"Rondo 4v2","steps":[{"id":"step-1","name":"Setup","elements":[],"duration":0.8}]}',
    'TMC Studio',
    234,
    true
  ),
  (
    'e5f6a7b8-c9d0-1234-ef01-567890123456',
    'High Press Trigger',
    'Pressing pattern when GK plays short',
    'defense',
    '{"version":"1.0.0","name":"High Press","steps":[{"id":"step-1","name":"Initial","elements":[],"duration":0.8},{"id":"step-2","name":"Trigger","elements":[],"duration":0.8}]}',
    'TMC Studio',
    167,
    true
  );

-- Note: User profiles and projects will be created dynamically
-- when users sign up via the handle_new_user() trigger

-- =====================================================
-- Test data for local development (optional)
-- Uncomment below if you want test users locally
-- =====================================================

-- Note: In local development, create users via Supabase Auth Studio
-- at http://127.0.0.1:54323 after running `supabase start`
