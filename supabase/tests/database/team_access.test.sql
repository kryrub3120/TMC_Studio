-- Club access, invitation decline and club thumbnails (launch stage E2).
-- Runs against a local database only: `pnpm test:db`.

begin;
create extension if not exists pgtap with schema extensions;

select plan(17);

-- ---------------------------------------------------------------------------
-- Fixtures: two clubs. "Team Club" owner pays for Team, "Free Club" owner does not.
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'owner@test.local',     'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'member@test.local',    'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'outsider@test.local',  'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', 'invitee@test.local',   'authenticated', 'authenticated'),
  ('55555555-5555-5555-5555-555555555555', 'freeowner@test.local', 'authenticated', 'authenticated'),
  ('66666666-6666-6666-6666-666666666666', 'freemember@test.local','authenticated', 'authenticated');

insert into public.profiles (id, email)
  select id, email from auth.users where email like '%@test.local'
  on conflict (id) do nothing;

update public.profiles set subscription_tier = 'team', subscription_expires_at = now() + interval '30 days'
  where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set subscription_tier = 'free'
  where id = '55555555-5555-5555-5555-555555555555';

insert into public.organizations (id, name, owner_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Team Club', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Free Club', '55555555-5555-5555-5555-555555555555');

insert into public.organization_members (organization_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'member'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '66666666-6666-6666-6666-666666666666', 'member');

insert into public.invitations (organization_id, email, role, token) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'invitee@test.local', 'member', 'dddddddd-0000-0000-0000-000000000001');

insert into public.projects (id, user_id, name, organization_id) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Club drill', 'aaaaaaaa-0000-0000-0000-000000000001');

insert into storage.objects (bucket_id, name) values
  ('thumbnails', 'bbbbbbbb-0000-0000-0000-000000000001/thumbnail.png');

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
select ok(not has_function_privilege('anon', 'public.get_my_club_access()', 'execute'),
  'anon cannot call get_my_club_access');
select ok(not has_function_privilege('anon', 'public.decline_invitation(uuid)', 'execute'),
  'anon cannot call decline_invitation');
select ok(has_function_privilege('authenticated', 'public.decline_invitation(uuid)', 'execute'),
  'signed-in users can call decline_invitation');

-- ---------------------------------------------------------------------------
-- Club access
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","email":"member@test.local","role":"authenticated"}';
select is(public.get_my_club_access(), 'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  'member of a Team club gets club access');

set local request.jwt.claims = '{"sub":"66666666-6666-6666-6666-666666666666","email":"freemember@test.local","role":"authenticated"}';
select is(public.get_my_club_access(), null, 'member of a club without Team gets no club access');

set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","email":"outsider@test.local","role":"authenticated"}';
select is(public.get_my_club_access(), null, 'outsider gets no club access');
reset role;

update public.profiles set subscription_expires_at = now() - interval '1 day'
  where id = '11111111-1111-1111-1111-111111111111';
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","email":"member@test.local","role":"authenticated"}';
select is(public.get_my_club_access(), null, 'member loses club access when the owner''s Team plan expired');
reset role;
update public.profiles set subscription_expires_at = now() + interval '30 days'
  where id = '11111111-1111-1111-1111-111111111111';

-- ---------------------------------------------------------------------------
-- Decline an invitation
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","email":"outsider@test.local","role":"authenticated"}';
select throws_like(
  $$ select public.decline_invitation('dddddddd-0000-0000-0000-000000000001') $$,
  '%different email%', 'outsider cannot decline someone else''s invitation');

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","email":"owner@test.local","role":"authenticated"}';
select is(public.get_org_seat_usage('aaaaaaaa-0000-0000-0000-000000000001'), 3,
  'seat usage before decline: 2 members + 1 pending invitation');

set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","email":"invitee@test.local","role":"authenticated"}';
select lives_ok($$ select public.decline_invitation('dddddddd-0000-0000-0000-000000000001') $$,
  'invitee declines the invitation');
select is((select status from public.invitations where token = 'dddddddd-0000-0000-0000-000000000001'), 'declined',
  'declined invitation has status declined');
select throws_like(
  $$ select public.decline_invitation('dddddddd-0000-0000-0000-000000000001') $$,
  '%already used%', 'a declined invitation cannot be declined again');
select throws_like(
  $$ select * from public.accept_invitation('dddddddd-0000-0000-0000-000000000001') $$,
  '%already used%', 'a declined invitation cannot be accepted');
select is((select count(*)::int from public.organizations), 0, 'invitee who declined does not join the club');

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","email":"owner@test.local","role":"authenticated"}';
select is(public.get_org_seat_usage('aaaaaaaa-0000-0000-0000-000000000001'), 2,
  'declined invitation frees the seat');
reset role;

-- ---------------------------------------------------------------------------
-- Thumbnails of club projects
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","email":"outsider@test.local","role":"authenticated"}';
select is_empty(
  $$ delete from storage.objects where bucket_id = 'thumbnails'
     and name = 'bbbbbbbb-0000-0000-0000-000000000001/thumbnail.png' returning name $$,
  'outsider cannot delete a club thumbnail');

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","email":"member@test.local","role":"authenticated"}';
select results_eq(
  $$ delete from storage.objects where bucket_id = 'thumbnails'
     and name = 'bbbbbbbb-0000-0000-0000-000000000001/thumbnail.png' returning name $$,
  $$ values ('bbbbbbbb-0000-0000-0000-000000000001/thumbnail.png'::text) $$,
  'club member can delete a club thumbnail');
reset role;

select * from finish();
rollback;
