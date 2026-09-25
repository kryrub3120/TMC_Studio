-- Team scenario (launch stage E2): owner, member and outsider.
-- Runs against a local database only: `pnpm test:db` (supabase test db).
-- Everything happens in one transaction that is rolled back at the end.

begin;
create extension if not exists pgtap with schema extensions;

select plan(30);

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres, RLS bypassed)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'owner@test.local',    'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'member@test.local',   'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'outsider@test.local', 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', 'invitee@test.local',  'authenticated', 'authenticated');

insert into public.profiles (id, email)
  values
    ('11111111-1111-1111-1111-111111111111', 'owner@test.local'),
    ('22222222-2222-2222-2222-222222222222', 'member@test.local'),
    ('33333333-3333-3333-3333-333333333333', 'outsider@test.local'),
    ('44444444-4444-4444-4444-444444444444', 'invitee@test.local')
  on conflict (id) do nothing;

-- The on_organization_created trigger adds the owner as a member.
insert into public.organizations (id, name, owner_id)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'Test Club', '11111111-1111-1111-1111-111111111111');

-- Second club, only for the expired invitation: idx_invitations_pending_unique
-- allows one pending invitation per (organization, email).
insert into public.organizations (id, name, owner_id)
  values ('aaaaaaaa-0000-0000-0000-000000000002', 'Other Club', '11111111-1111-1111-1111-111111111111');

insert into public.organization_members (organization_id, user_id, role)
  values ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'member');

insert into public.projects (id, user_id, name, organization_id) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Club drill',        'aaaaaaaa-0000-0000-0000-000000000001'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Owner private',     null),
  ('bbbbbbbb-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Member own board',  null),
  ('bbbbbbbb-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 'Invitee club board', 'aaaaaaaa-0000-0000-0000-000000000001');

insert into public.invitations (id, organization_id, email, role, token, status, expires_at) values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'invitee@test.local', 'member',
   'dddddddd-0000-0000-0000-000000000001', 'pending', now() + interval '14 days'),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'invitee@test.local', 'member',
   'dddddddd-0000-0000-0000-000000000002', 'pending', now() - interval '1 day');

-- ---------------------------------------------------------------------------
-- Outsider: sees nothing of the organization
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","email":"outsider@test.local","role":"authenticated"}';

select is((select count(*)::int from public.organizations), 0, 'outsider: no organizations visible');
select is((select count(*)::int from public.organization_members), 0, 'outsider: no members visible');
select is((select count(*)::int from public.invitations), 0, 'outsider: no invitations visible');
select is(
  (select count(*)::int from public.projects where organization_id is not null), 0,
  'outsider: no organization projects visible');
select throws_ok(
  $$ select public.get_org_seat_usage('aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501', null, 'outsider: cannot read seat usage');
select throws_like(
  $$ select * from public.accept_invitation('dddddddd-0000-0000-0000-000000000001') $$,
  '%different email%', 'outsider: cannot accept an invitation sent to someone else');

update public.projects set name = 'hijacked' where id = 'bbbbbbbb-0000-0000-0000-000000000001';
delete from public.organization_members where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001';
reset role;
select is(
  (select name from public.projects where id = 'bbbbbbbb-0000-0000-0000-000000000001'), 'Club drill',
  'outsider: cannot edit an organization project');
select is(
  (select count(*)::int from public.organization_members where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 2,
  'outsider: cannot remove members');

-- ---------------------------------------------------------------------------
-- Member: sees and edits club projects, cannot manage the club
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","email":"member@test.local","role":"authenticated"}';

select is((select count(*)::int from public.organizations), 1, 'member: sees the organization');
select is((select count(*)::int from public.organization_members), 2, 'member: sees both members');
select is((select count(*)::int from public.invitations), 0, 'member: does not see invitations');
select is(
  (select count(*)::int from public.projects where id = 'bbbbbbbb-0000-0000-0000-000000000001'), 1,
  'member: sees the club project');
select is(
  (select count(*)::int from public.projects where id = 'bbbbbbbb-0000-0000-0000-000000000002'), 0,
  'member: does not see the owner''s private project');
select is(
  public.get_org_seat_usage('aaaaaaaa-0000-0000-0000-000000000001'), 3,
  'member: seat usage counts 2 members + 1 pending invitation');

update public.projects set name = 'Club drill v2' where id = 'bbbbbbbb-0000-0000-0000-000000000001';
select throws_ok(
  $$ update public.projects set user_id = '22222222-2222-2222-2222-222222222222'
     where id = 'bbbbbbbb-0000-0000-0000-000000000001' $$,
  '42501', null, 'member: cannot take ownership of a club project');
select throws_ok(
  $$ update public.projects set organization_id = null
     where id = 'bbbbbbbb-0000-0000-0000-000000000001' $$,
  '42501', null, 'member: cannot detach a club project from the club');
update public.organizations set name = 'Renamed by member' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select throws_ok(
  $$ insert into public.invitations (organization_id, email, role)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'x@test.local', 'member') $$,
  '42501', null, 'member: cannot invite');
reset role;
select is(
  (select name from public.projects where id = 'bbbbbbbb-0000-0000-0000-000000000001'), 'Club drill v2',
  'member: can edit a club project');
select is(
  (select name from public.organizations where id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Test Club',
  'member: cannot rename the organization');

-- ---------------------------------------------------------------------------
-- Invitations: expired and valid
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","email":"invitee@test.local","role":"authenticated"}';

select is((select count(*)::int from public.invitations), 2, 'invitee: sees own invitations');
select throws_like(
  $$ select * from public.accept_invitation('dddddddd-0000-0000-0000-000000000002') $$,
  '%expired%', 'invitee: expired invitation is rejected');
select lives_ok(
  $$ select * from public.accept_invitation('dddddddd-0000-0000-0000-000000000001') $$,
  'invitee: valid invitation is accepted');
select throws_like(
  $$ select * from public.accept_invitation('dddddddd-0000-0000-0000-000000000001') $$,
  '%already used%', 'invitee: an invitation cannot be used twice');
select is((select count(*)::int from public.organizations), 1, 'invitee: sees the organization after accepting');
reset role;

-- ---------------------------------------------------------------------------
-- Member removed: loses the club, keeps own projects
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","email":"owner@test.local","role":"authenticated"}';
delete from public.organization_members
  where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
    and user_id = '22222222-2222-2222-2222-222222222222';
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","email":"member@test.local","role":"authenticated"}';
select is((select count(*)::int from public.organizations), 0, 'removed member: no longer sees the organization');
select is(
  (select count(*)::int from public.projects where organization_id is not null), 0,
  'removed member: no longer sees club projects');
select is(
  (select count(*)::int from public.projects where id = 'bbbbbbbb-0000-0000-0000-000000000003'), 1,
  'removed member: keeps own projects');
reset role;

-- ---------------------------------------------------------------------------
-- Owner deletes the organization: cascade, club projects stay with the owner
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","email":"owner@test.local","role":"authenticated"}';
delete from public.organizations where id = 'aaaaaaaa-0000-0000-0000-000000000001';
reset role;
select is(
  (select count(*)::int from public.organization_members where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 0,
  'owner deletes organization: memberships cascade');
select is(
  (select organization_id from public.projects where id = 'bbbbbbbb-0000-0000-0000-000000000001'), null,
  'owner deletes organization: club project stays with its owner, detached');
select is(
  (select user_id::text || '/' || coalesce(organization_id::text, 'none')
   from public.projects where id = 'bbbbbbbb-0000-0000-0000-000000000004'),
  '44444444-4444-4444-4444-444444444444/none',
  'owner deletes organization: a member''s club project stays with the member, detached');

select * from finish();
rollback;
