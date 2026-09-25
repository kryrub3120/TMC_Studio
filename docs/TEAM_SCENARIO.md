# Team scenario — manual check on production

Launch stage E2. Automated coverage lives in `supabase/tests/database`
(`pnpm test:db`). This checklist covers what automation cannot: real Postmark
e-mails, sign-in with the invited address and Stripe-backed Team access.

Run after the migration `20260926000000_team_access_and_invitation_decline.sql`
is on production and the matching frontend is deployed.

## Accounts

| Role | Account | Plan |
|---|---|---|
| Owner | account A | Team (paid or test subscription) |
| Member | account B | Free |
| Outsider | account C | Free |

Use three different browsers or private windows, one per account.

## Steps

| # | Who | Action | Expected |
|---|---|---|---|
| 1 | A | Settings → Club → create a club | Club visible, A is owner, seat usage 1/5 |
| 2 | A | Invite B's e-mail | Seat usage 2/5; e-mail arrives in B's inbox in the invitation language |
| 3 | A | Invite C's e-mail, then invite a 4th and 5th address | 5/5; a 6th invitation is blocked with a clear message |
| 4 | C | Open C's invitation link while signed in as C | Accept and **Decline** buttons visible |
| 5 | C | Decline | "Invitation declined"; A sees one seat freed (4/5) |
| 6 | C | Open the same link again | "Invitation declined", no Accept button |
| 7 | B | Open B's link while signed out | Prompt to sign in with B's address |
| 8 | B | Sign in as a different account, open the link | "Sent to … but you are signed in as …", no Accept |
| 9 | B | Sign in as B, accept | "You're in!"; after reload B has Pro/Team features (no upgrade prompts) |
| 10 | A | Create a club project, save | Visible to B; B can edit it and the edit survives reload |
| 11 | C | Try to open the club project URL | Not found / no access |
| 12 | A | Remove B from the club | B, after reload: no club, back to Free limits, own projects still there |
| 13 | A | Delete the club | Club projects stay with their owners, detached from the club |

## Sentry

During the run, check Sentry for new issues tagged `module:save` or
`tmc.error_source` from the invite pages. There should be none.

## Record

| Date | Environment | Result | Notes |
|---|---|---|---|
| | production | | |
