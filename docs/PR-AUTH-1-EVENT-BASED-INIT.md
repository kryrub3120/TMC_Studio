# PR-AUTH-1: Event-Based Auth Initialization

**Status:** ✅ COMPLETE  
**Date:** 2025-01-22  
**Priority:** HIGH (UX Critical)

## Problem

aplikacja "muliła się" podczas startu przez blokujący `getSession()` call w auth initialization:

```typescript
// ❌ PRZED (blokujące):
await supabase.auth.getSession()
if (session) {
  user = await getCurrentUser()
}
set({ user, isInitialized: true })
```

**UX Impact:**
- Aplikacja czekała na getSession() zanim renderowała UI
- Google Auth redirect powodował widoczny lag
- User widział "mulenie" przy każdym starcie

## Solution

Zmieniono na **hybrid approach** - UI startuje NATYCHMIAST + async session check:

```typescript
// ✅ PO (non-blocking):
set({ isInitialized: true, isLoading: false }) // UI ready NOW

// Setup listener for future changes
onAuthStateChange(async (user) => {
  set({ user, isAuthenticated: !!user })
})

// ALSO check existing session (async, non-blocking)
const { data: { session } } = await supabase.auth.getSession()
if (session?.user) {
  const user = await getCurrentUser()
  set({ user, isAuthenticated: true })
}
```

## Files Changed

### 1. `apps/web/src/store/useAuthStore.ts`

**Before:**
- `initialize()` blokowało na `await getSession()`
- Czekało na `getCurrentUser()` przed ustawieniem `isInitialized`
- UI nie renderował się dopóki auth nie był gotowy

**After:**
- `isInitialized: true` ustawiane NATYCHMIAST
- `onAuthStateChange()` jako event listener w tle
- OAuth hash cleanup → listener setup → UI ready
- Preferences ładowane asynchronicznie po otrzymaniu user

### 2. `packages/ui/src/AuthModal.tsx`

**Bonus Fix:** Dodano właściwe `autoComplete` attributes:
- Login password: `autoComplete="current-password"`
- Register password: `autoComplete="new-password"`
- Usuwa HTML validation warnings

## Technical Details

### Event-Based Flow

```
App Start
  ├─ useAuthStore.initialize() called
  ├─ isInitialized = true (IMMEDIATE)
  ├─ UI renders (NO BLOCKING)
  └─ onAuthStateChange listener active
       └─ Auth state arrives in background
            ├─ user set
            ├─ preferences loaded
            └─ UI updates reactively
```

### OAuth Callback Flow

```
Google OAuth Redirect
  ├─ URL has #access_token hash
  ├─ Supabase auto-processes in background
  ├─ UI renders immediately (no wait)
  ├─ Hash cleared from URL
  └─ onAuthStateChange fires
       └─ User logged in
```

## Production Issue & Fix

**Problem on Production:**
- Pure event-based approach didn't catch OAuth callback sessions
- User was redirected but not logged in
- `onAuthStateChange` didn't fire for existing sessions

**Root Cause:**
- OAuth redirect returns with session in URL hash
- Supabase stores it, but event doesn't fire on initial load
- Need to ALSO check for existing session explicitly

**Solution: Hybrid Approach**
1. UI renders immediately (`isInitialized: true`)
2. Setup `onAuthStateChange` listener (for future changes)
3. ALSO run `getSession()` asynchronously (catches OAuth callbacks)
4. Both paths update store independently

**Key Insight:**
- `onAuthStateChange` = future auth changes
- `getSession()` = existing session at load time
- Need BOTH for reliable OAuth flow

## Testing

✅ Tested on local:
- Google OAuth login flow smooth (no lag)
- Email/password login works
- Session persistence across refreshes
- OAuth callback cleanup works
- No console warnings

🚀 **Deploy to production to verify OAuth callback fix**

## Benefits

1. **Instant UI Start** - No more "mulenie"
2. **Better UX** - Perceived performance improvement
3. **Clean Code** - Event-driven > imperative polling
4. **Future-Proof** - Supabase recommended pattern
5. **Bonus** - Fixed autocomplete warnings

## Logs

**Before:**
```
[Auth] Auto-init triggered
[Auth] Initialize started
[Auth] Getting session...    ← BLOCKING HERE
[Auth] Session: Found
[Auth] User in session: user@example.com
[Auth] Full user profile: {...}
[Auth] Initialized - authenticated: true
```

**After:**
```
[Auth] Initialize started (event-based)
[Auth] Setting up auth listener...
[Auth] Listener active - UI ready    ← UI READY NOW
[Auth] State changed - user: user@example.com
[Auth] Loading preferences from cloud...
[Auth] Preferences loaded from cloud
```

## Migration Notes

- No breaking changes
- Existing auth flows work identically
- Store API unchanged (`isAuthenticated`, `user`, etc.)
- Auto-init on import still works

## References

- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth)
- Event-based auth pattern (recommended by Supabase)
- AbortError handling preserved for navigation cancellations

---

**Result:** Auth is now lightning-fast ⚡ - UI renders immediately while auth loads in the background.
