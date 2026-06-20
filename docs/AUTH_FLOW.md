# TMC Studio — Authentication Flow

> Kompletny opis mechanizmu logowania i zarządzania sesją w TMC Studio.
> **Last Updated:** 2026-06-20

---

## Spis treści

1. [Architektura](#1-architektura)
2. [Supabase PKCE Flow](#2-supabase-pkce-flow)
3. [Google OAuth — Popup Flow](#3-google-oauth--popup-flow)
4. [AuthCallbackPage — obsługa powrotu](#4-authcallbackpage--obsługa-powrotu)
5. [useAuthStore — stan i maszyna stanów](#5-useauthstore--stan-i-maszyna-stanów)
6. [Inicjalizacja przy starcie aplikacji](#6-inicjalizacja-przy-starcie-aplikacji)
7. [onAuthStateChange — singleton listenera](#7-onauthstatechange--singleton-listenera)
8. [Polityka czyszczenia URL](#8-polityka-czyszczenia-url)
9. [Dev mock sessions](#9-dev-mock-sessions)
10. [Pliki i odpowiedzialności](#10-pliki-i-odpowiedzialności)
11. [Sekwencje przepływu](#11-sekwencje-przepływu)

---

## 1. Architektura

```
┌──────────────────────────────────────────────────────────┐
│                    Przeglądarka (Browser)                  │
│                                                           │
│  ┌──────────────────┐     ┌──────────────────────────┐   │
│  │  Główna karta     │     │  Popup OAuth (Google)    │   │
│  │  (tmcstudio.app)  │     │  (500×680, otwierany     │   │
│  │                   │     │   przez window.open)      │   │
│  │  ┌──────────────┐ │     │                          │   │
│  │  │ useAuthStore │ │     │  Google -> Supabase      │   │
│  │  │ (Zustand)    │◄├─────┤  PKCE: ?code=...         │   │
│  │  └──────────────┘ │     │  postMessage -> main     │   │
│  │         │         │     │  window.close()          │   │
│  │  ┌──────────────┐ │     └──────────────────────────┘   │
│  │  │   supabase   │ │                                    │
│  │  │   .ts (lib)  │ │          Supabase (cloud)          │
│  │  └──────┬───────┘ │           ┌──────────────┐        │
│  │         │         │           │  Auth (GoTrue) │        │
│  │  ┌──────────────┐ │           │  + PKCE        │        │
│  │  │ AuthCallback │ │           │  + Session     │        │
│  │  │ Page (lekkie)│ │           └──────────────┘        │
│  │  └──────────────┘ │                                    │
│  └──────────────────┘                                    │
└──────────────────────────────────────────────────────────┘
```

### Kluczowe decyzje architektoniczne

- **PKCE (Proof Key for Code Exchange)** — industry standard OAuth 2.0 flow, bezpieczniejszy od implicit grant.
- **Popup zamiast redirectu** — użytkownik nie opuszcza aplikacji podczas logowania. Główna karta pozostaje w pełni interaktywna.
- **PostMessage do komunikacji międzyokiennej** — popup po udanym PKCE wysyła `postMessage` do głównej karty i zamyka się.
- **Event-based init (non-blocking)** — `useAuthStore.initialize()` zwraca natychmiast, nie blokuje renderu UI.
- **Singleton listenera `onAuthStateChange`** — zakładany raz, unika duplikatów i kaskadowych fetchy.

---

## 2. Supabase PKCE Flow

Supabase używa **PKCE (Proof Key for Code Exchange)** do OAuth. Przebieg:

1. Aplikacja woła `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`.
2. Supabase generuje `code_verifier` (losowy sekret) i `code_challenge` (hash verifiera).
3. Przeglądarka przekierowuje do Google → użytkownik loguje się.
4. Google redirectuje z powrotem na `redirectTo` z `?code=...` i `?state=...`.
5. Supabase JS SDK na stronie callback odczytuje `?code=...`, łączy z zapisanym `code_verifier` i wymienia na session token.
6. Sesja (access_token + refresh_token) zapisywana jest w localStorage pod kluczem `tmc-auth-token`.

**Krytyczna zasada:** `?code=...` jest **jednorazowy**. Wycięcie go z URL przed zakończeniem kroku 5 powoduje nieodwracalne przerwanie logowania. Dlatego `cleanAuthCallbackUrl()` jest wywoływane **dopiero po potwierdzonej sesji** (na `onAuthStateChange` SIGNED_IN).

---

## 3. Google OAuth — Popup Flow

### 3.1. Akcja: `signInWithGoogle()` w `useAuthStore`

```
1. set({ isOAuthInProgress: true, isLoading: false })
2. const result = await supabaseSignInWithGoogle()  // supabase.ts
   → supabase zwraca { url } — Google Consent URL
3. const popup = openOAuthPopup()
   → window.open('', 'tmc-google-auth', features)
   → writeOAuthPopupShell(popup)  // wstrzykuje HTML/loading spinner
4. popup.location.href = result.url  // przekierowuje popup do Google
5. await waitForOAuthPopup(popup)    // czeka na postMessage z popupa
   → timeout: 120s
   → sprawdza popup.closed co 500ms
   → nasłuchuje window 'message' event
6. await waitForOAuthSession()       // polluje supabase.auth.getSession()
   → delays: [0, 150, 350, 700, 1200, 2000, 3000, 5000] ms
7. getCurrentUser(session.user)      // pobiera profil z DB
8. set({ user, isAuthenticated: true, ... })
9. loadPreferences() + fetchCloudProjects() + fetchCloudFolders()
10. set({ isOAuthInProgress: false })
```

### 3.2. Funkcja `openOAuthPopup()`

```typescript
const width = 500;
const height = 680;
const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
const features = 'width=500,height=680,left=...,top=...,popup=yes,...';
const popup = window.open('', 'tmc-google-auth', features);
```

- Wstrzykuje HTML z loading spinnerem i brandingiem TMC Studio (`writeOAuthPopupShell`).
- Ustawia `sessionStorage.setItem('tmc-oauth-popup', '1')` — pozwala `AuthCallbackPage` wykryć, że działa w popupie.

### 3.3. Funkcja `waitForOAuthPopup()`

Zwraca Promise, który resolve'uje się gdy:
- Popup wyśle `postMessage({ type: 'tmc:auth-popup-result', status: 'success', elapsed })`.
- Reject przy: timeout 120s, zamknięciu popupa przez użytkownika, błędzie z popupa.

### 3.4. Dlaczego pollujemy sesję po postMessage?

`postMessage` oznacza, że popup zakończył PKCE i sesja powinna być dostępna. Ale w praktyce:
- Supabase JS SDK na głównej karcie musi jeszcze zsynchronizować się z nową sesją (odczytać localStorage zapisany przez SDK w popupie, ale popup jest zamknięty).
- `waitForOAuthSession()` polluje co 150-5000ms, aż `getSession()` zwróci użytkownika.
- W praktyce sesja jest dostępna po 0-700ms od postMessage.

---

## 4. AuthCallbackPage — obsługa powrotu

**Scenariusze:**

| Scenariusz | Detekcja | Zachowanie |
|---|---|---|
| **Popup** | `window.name === 'tmc-google-auth'` lub `sessionStorage.getItem('tmc-oauth-popup')` | Wykonuje PKCE, wysyła `postMessage` do openera, zamyka okno |
| **Fallback (redirect)** | Brak flag popupa | Wykonuje PKCE, `navigate('/app', { replace: true })` przez React Router |

### Kod (uproszczony):

```typescript
export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    const startedAt = performance.now();
    const isPopup = window.name === 'tmc-google-auth' ||
      window.sessionStorage.getItem('tmc-oauth-popup') === '1';

    if (!isPopup) {
      void import('../App');  // preload edytora w tle
    }

    const finish = (status, error?) => {
      if (done) return;
      done = true;

      if (isPopup && window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'tmc:auth-popup-result', ... }, origin);
        window.setTimeout(() => window.close(), 150);
        return;
      }
      navigate('/app', { replace: true });
    };

    // Safety net: 10s timeout
    const safety = setTimeout(() => finish('error', 'OAuth callback timed out'), 10000);

    async function handleCallback() {
      const { data: { session }, error } = await supabase.auth.getSession();
      const elapsed = Math.round(performance.now() - startedAt);

      if (error || !session?.user) {
        logger.error(`[Auth] OAuth callback failed after ${elapsed}ms`, error);
        finish('error', 'No session');
        return;
      }

      logger.log(`[Auth] OAuth callback completed in ${elapsed}ms`);

      // Szybkie ustawienie sesji z metadata — pełny profil w tle
      useAuthStore.setState({
        user: {
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name,
          avatar_url: session.user.user_metadata?.avatar_url,
          subscription_tier: 'free',  // listener zaktualizuje z DB
        },
        isAuthenticated: true,
      });
      finish('success');
    }

    handleCallback();
  }, [navigate]);
}
```

### Log czasu callbacku

`[Auth] OAuth callback completed in XXXms` — pojawia się w konsoli po zakończeniu PKCE. Pomaga diagnozować, gdzie leży wąskie gardło:
- Jeśli > 5000ms — problem po stronie Google / Supabase PKCE.
- Jeśli < 1000ms — nasz flow działa sprawnie.

---

## 5. useAuthStore — stan i maszyna stanów

### Kluczowe pola stanu

| Pole | Typ | Opis |
|---|---|---|
| `user` | `User \| null` | Zalogowany użytkownik (pełny profil z DB) |
| `isLoading` | `boolean` | Flaga ogólnego ładowania |
| `isOAuthInProgress` | `boolean` | **Google popup otwarty** → status UI |
| `isInitialized` | `boolean` | Czy `initialize()` zakończone (UI startuje od razu) |
| `isAuthenticated` | `boolean` = `!!user` i listenerconfirmed Po przerwaniu logowania Google OAuth z popupem, czyścimy również flagę isOAuthInProgress w stanie, aby zapewnić konsystentny stan UI | maintained przez listenera |
| `error` | `string \| null` | Błąd autha do pokazania w UI |
| `isMockUserisDevCloudActive() && !supabase (DEV-ONLY) fałszowanie poziomów premium`,
jest flagą wskazującą czy bieżący użytkownik został zalogowany przez dedykowane API developerskie |
| `teamId` | `string \| ``null` | ID zespołu Team plan |
| `isPro` | `boolean` = `user.subscription_tier === 'pro' \|\| 'team'` |
| `isTeam` | `boolean` = `user.subscription_tier === ''team'`help w rozpoznaniu poziomu uprawnień w kontekście planów |

```
PLAN MAP:
user = null, isAuthenticated = false → GUEST
user != null, isAuthenticated = true, isPro = false → FREE
user != null, isAuthenticated = true, isPro = true, isTeam = false → PRO
user != null, isAuthenticated = true, isTeam = true → TEAM
```

### Flagi komponentów

```
GUEST: auth modal dostępny z ograniczoną ilością wywołań
FREE: wszystko jak guest ale bez ograniczeń
PRO: wszystko! + możliwość miesięcznej/rocznej subskrypcji
TEAM: zarządzanie zespołem
```

---

## 7. onAuthStateChange — singleton listenera

`onAuthStateChange` to funkcja z `supabase.ts`, która nasłuchuje zdarzeń:
- `SIGNED_IN` — użytkownik właśnie się zalogował.
- `SIGNED_OUT` — wylogowanie.
- `TOKEN_REFRESHED` — odświeżenie tokena.
- `USER_UPDATED` — zmiana profilu.

W `useAuthStore.initialize()` listener jest zakładany **tylko raz** (strażnik `authUnsubscribe`):

```typescript
if (!authUnsubscribe) {
  authUnsubscribe = onAuthStateChange(async (user) => {
    set({ user, isAuthenticated: !!user, isPro: ..., isTeam: ..., teamId: ... });
    if (user) {
      await loadPreferences();
      await prefetchProjects();
    }
    if (hasAuthCallback && user) {
      cleanAuthCallbackUrl();
    }
  });
}
```

**Dlaczego singleton?** Wcześniej `initialize()` mogło być wywołane wielokrotnie (React Strict Mode w dev, re-mount komponentu). Każde wywołanie zakładało nowy listener → wielokrotne fetchowanie preferencji i projektów, race condition na stanie.

---

## 8. Polityka czyszczenia URL

### Parametry OAuth callback

```typescript
const AUTH_CALLBACK_PARAMS = ['code', 'state', 'error', 'error_code', 'error_description'];
```

### Zasady

1. **`?code=...` NIGDY nie jest czyszczone przed zakończeniem PKCE.**
   - W poprzedniej wersji `cleanAuthCallbackUrl()` było wołane po 400 ms → wycinało `?code` → łamało PKCE → użytkownik nigdy nie był logowany.
   - Teraz czyszczenie następuje DOPIERO po potwierdzonej sesji (`onAuthStateChange` SIGNED_IN).

2. **`?error=...` jest czyszczone od razu.**
   - W przypadku błędu OAuth nie czekamy na PKCE.

3. **Hash z `access_token` lub `error`** jest czyszczony po sesji (legacy dla bardzo starych URL-i Supabase).

4. **Metoda:** `window.history.replaceState(null, '', next)` — bez reloadu strony.

---

## 9. Dev mock sessions

DEV-ONLY: `useAuthStore.devLogin(tier)` tworzy fałszywą sesję dla lokalnego developmentu bez Supabase.

- `isMockUser = true` — `initialize()` pomija Supabase całkowicie.
- Dane zapisywane w `devCloud` (lokalny mock localStorage zamiast Supabase).
- Guard: jeśli `devCloud` jest nieaktywny i Supabase też → mock session jest czyszczona (zapobiega desync).

---

## 10. Pliki i odpowiedzialności

| Plik | Odpowiedzialność |
|---|---|
| `apps/web/src/lib/supabase.ts` | Klient Supabase, helpery auth (signIn, signOut, signInWithGoogle, getCurrentUser, getPreferences, onAuthStateChange) |
| `apps/web/src/store/useAuthStore.ts` | Stan autha (Zustand + persist), maszyna stanów, initialize(), popup flow (openOAuthPopup, waitForOAuthPopup, waitForOAuthSession), fallback polling |
| `apps/web/src/pages/AuthCallbackPage.tsx` | Strona callback OAuth — wykonuje PKCE, wysyła postMessage (popup) lub navigate (redirect fallback) |
| `apps/web/src/app/AppShell.tsx` | `GoogleAuthStatus` — nieblokujący toast "Logowanie przez Google..." gdy `isOAuthInProgress` |
| `packages/ui/src/AuthModal.tsx` | Modal logowania — zamyka się od razu po starcie Google |
| `apps/web/src/lib/logger.ts` | Logger strukturalny z poziomami debug/log/error |

---

## 11. Sekwencje przepływu

### Sekwencja 1: Google Login (popup) — sukces

```
User → klik "Zaloguj przez Google" w AuthModal
       │
       ▼
AuthModal → zamyka się, isOAuthInProgress = true
       │
       ▼
AppShell → pokazuje GoogleAuthStatus ("Logowanie przez Google...")
       │
       ▼
useAuthStore.signInWithGoogle()
  → supabase.auth.signInWithOAuth() → zwraca { url }
  → window.open('', 'tmc-google-auth', ...) → popup z loading spinnerem
  → popup.location.href = url → Google Consent Screen
       │
       ▼ (popup)
User loguje się w Google
  → Google redirects na /auth/callback?code=...&state=...
       │
       ▼ (popup)
AuthCallbackPage wykrywa isPopup = true
  → supabase.auth.getSession() → wymiana kodu na sesję (PKCE)
  → log: [Auth] OAuth callback completed in XXXms
  → window.opener.postMessage({ type: 'tmc:auth-popup-result', status: 'success' })
  → setTimeout(() => window.close(), 150)
       │
       ▼ (główna karta)
waitForOAuthPopup resolve → postMessage odebrany
  → waitForOAuthSession() → polluje getSession()
  → sesja znaleziona → getCurrentUser() → user profile
  → set({ user, isAuthenticated: true })
  → loadPreferences(), prefetchProjects()
  → isOAuthInProgress = false
       │
       ▼
AppShell → GoogleAuthStatus znika
TopBar → pokazuje awatar/email użytkownika
```

### Sekwencja 2: Google Login — popup zamknięty przez użytkownika

```
User → zamyka popup przed zalogowaniem
       │
       ▼
waitForOAuthPopup → closedPoll wykrywa popup.closed = true
  → reject(new Error('Google login window was closed'))
       │
       ▼
catch → log error, popup?.close()
  → set({ isOAuthInProgress: false, error: '...' })
```

### Sekwencja 3: Session restore na starcie

```
App → AppShell mount → useAuthStore.initialize()
       │
       ▼
isMockUser? → tak → skip Supabase (DEV-ONLY)
       │
       ▼
supabase dostępny? → nie → offline mode
       │
       ▼
set({ isInitialized: true, isLoading: false }) → UI startuje natychmiast
       │
       ▼
hasAuthCallbackInUrl()? → tak → czekamy na listenera + fallback polling
       │
       ▼
authUnsubscribe null? → tak → zakładamy singleton listenera
       │
       ▼
!hasAuthCallback? → tak → supabase.auth.getSession()
  → sesja istnieje? → tak → getCurrentUser() → set({ user, isAuthenticated })
  → nie → user = null, guest mode
```

### Sekwencja 4: Fallback polling (gdy listener nie zdąży)

Gdy użytkownik wyląduje na `/auth/callback` z `?code=` (np. czysty redirect, bez popupa), listener `onAuthStateChange` może odpalić się z opóźnieniem. Fallback:

```typescript
[400, 1000, 2000, 3500, 5000].forEach((delay) => {
  setTimeout(async () => {
    const applied = await applyOAuthSession();
    if (applied && hasAuthCallbackInUrl()) {
      cleanAuthCallbackUrl();
    }
  }, delay);
});
```

- `applyOAuthSession()` sprawdza `isAuthenticated` → jeśli już zalogowany (przez listenera) → zwraca `true` i nic nie robi.
- Gdy sesja znaleziona → ustawia stan, ładuje preferencje.
- `cleanAuthCallbackUrl()` dopiero po applied === true.

---

## Historia zmian

| Data | Zmiana |
|---|---|
| 2026-06-18 | Pierwsza wersja — popup flow z postMessage |
| 2026-06-18 | Hotfix v1: bezpośredni redirect na /app (wycofany) |
| 2026-06-18 | Hotfix v2: przywrócony /auth/callback, naprawiony cleanAuthCallbackUrl |
| 2026-06-20 | Dokumentacja auth flow |