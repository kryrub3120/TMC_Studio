-- Deleting the auth user (what the delete-account function does last) must
-- remove everything the user owns, including a club without other members,
-- and leave other users untouched.

begin;
create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'leaving@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'staying@test.local', 'authenticated', 'authenticated');

insert into public.profiles (id, email)
  select id, email from auth.users where email like '%@test.local'
  on conflict (id) do nothing;

-- The leaving user owns a solo club, projects in and out of it, and a folder;
-- they invited someone to the club and are a member of another user's club.
insert into public.organizations (id, name, owner_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Solo Club', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Other Club', '22222222-2222-2222-2222-222222222222');
insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'member');
insert into public.invitations (organization_id, email, role, invited_by) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'someone@test.local', 'member', '11111111-1111-1111-1111-111111111111');
insert into public.projects (id, user_id, name, organization_id) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Mine', null),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Mine in club', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Theirs', null);
insert into public.project_folders (user_id, name) values
  ('11111111-1111-1111-1111-111111111111', 'My folder');

select lives_ok(
  $$ delete from auth.users where id = '11111111-1111-1111-1111-111111111111' $$,
  'deleting the auth user succeeds even when they own a club');

select is((select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 0, 'profile removed');
select is((select count(*)::int from public.projects where user_id = '11111111-1111-1111-1111-111111111111'), 0, 'projects removed');
select is((select count(*)::int from public.project_folders where user_id = '11111111-1111-1111-1111-111111111111'), 0, 'folders removed');
select is((select count(*)::int from public.organizations where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0, 'solo club removed');
select is((select count(*)::int from public.invitations where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0, 'club invitations removed');
select is((select count(*)::int from public.organization_members where user_id = '11111111-1111-1111-1111-111111111111'), 0, 'memberships in other clubs removed');
select is((select count(*)::int from public.organizations where id = 'aaaaaaaa-0000-0000-0000-000000000002'), 1, 'other user''s club untouched');
select is((select count(*)::int from public.projects where user_id = '22222222-2222-2222-2222-222222222222'), 1, 'other user''s projects untouched');

select * from finish();
rollback;
