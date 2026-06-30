# TMC Studio — Authentication Flow

> Kompletny opis mechanizmu logowania i zarządzania sesją w TMC Studio.
> **Last Updated:** 2026-06-29

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
| `isOAuthInProgress` | `boolean` | Google popup otwarty → status UI |
| `isInitialized` | `boolean` | Czy `initialize()` zakończone (UI startuje od razu) |
| `isAuthenticated` | `boolean` | maintained przez listenera; `= !!user` |
| `error` | `string \| null` | Błąd autha do pokazania w UI |
| `isMockUser` | `boolean` | DEV-ONLY: mock z devLogin() zamiast Supabase |
| `teamId` | `string \| null` | ID zespołu Team plan |
| `isPro` | `boolean` | `= user.subscription_tier === 'pro' \|\| user.subscription_tier === 'team'` |
| `isTeam` | `boolean` | `= user.subscription_tier === 'team'` |

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
      await prefetchProjects();  // Promise.allSettled z obsługą AbortError
    }
    if (hasAuthCallback && user) {
      cleanAuthCallbackUrl();
    }
  });
}
```

**Dlaczego singleton?** Wcześniej `initialize()` mogło być wywołane wielokrotnie (React Strict Mode w dev, re-mount komponentu). Każde wywołanie zakładało nowy listener → wielokrotne fetchowanie preferencji i projektów, race condition na stanie.
### A.7.1 Race condition email+password signIn (2026-06-29)

**Problem:** Po zalogowaniu email+password `signIn()` w useAuthStore wywoływał `getCurrentUser()` bezpośrednio po `supabaseSignIn()`. To tworzyło race condition z `onAuthStateChange` listenerem – oba procesy próbowały jednocześnie pobrać profil/preferencje/projekty, walcząc o wewnętrzne locki supabase-js (`locks.js`). Efekt: `AbortError: signal is aborted without reason`, profile nigdy nie były ładowane.

**Fix (2026-06-29):**
- `signIn()` nie woła już `getCurrentUser()` po `supabaseSignIn()`.
- Używa `authResponse.user` bezpośrednio z odpowiedzi Supabase.
- Pełny profil (preferencje, projekty, foldery) ładowany przez `onAuthStateChange` listener asynchronicznie.
- Prefetch używa `Promise.allSettled()` z jawnym ignorowaniem `AbortError`.

```typescript
// Before (race):
const authResponse = await supabaseSignIn(email, password);
const user = await getCurrentUser();  // ← race z listenerem!

// After (no race):
const authResponse = await supabaseSignIn(email, password);
const authUser = authResponse?.user ?? null;
set({ user: authUser ? { id: authUser.id, email: authUser.email ?? '' } : null,
      isAuthenticated: !!authUser });
// Listener w tle uzupełnia profil/preferencje/projekty.
```

**Skutki:** Brak AbortError przy logowaniu email+password.
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

## 12. Reset hasła (S-AUTH S1)

### Flow

```
AuthModal (forgot mode)
  → useAuthStore.sendResetLink(email)
    → supabase.auth.resetPasswordForEmail(email, redirectTo=/auth/reset-password)
      → Supabase wysyła email z linkiem zawierającym ?code=... (PKCE)
        → user klika link → /auth/reset-password?code=xxx
          → Supabase SDK detectSessionInUrl:true automatycznie wymienia kod na sesję
          → useAuthStore auto-init (setTimeout(100ms)) uruchamia listener
          → ResetPasswordPage: getSession() z retry (500/1500/3000ms) czeka na PKCE
            → formularz → auth.updateUser({ password })
              → redirect do /app
```

### Kluczowe decyzje

| Decyzja | Powód |
|---------|-------|
| `redirectTo` na `/auth/reset-password` (nie przez AuthCallbackPage) | PKCE exchange zachodzi na stronie resetu; Supabase SDK `detectSessionInUrl:true` obsługuje go automatycznie. AuthCallbackPage ma złożoną logikę OAuth popup — reset hasła nie potrzebuje postMessage, wykrywania popup ani fallback pollingu. |
| ResetPasswordPage czeka do 3.5s na PKCE completion | Race condition między React Router mount a Supabase SDK processing URL. Auto-init w useAuthStore startuje po 100ms, ale SDK może potrzebować czasu na wymianę kodu. Retry co 500/1500/3000ms pokrywa normalne warunki sieciowe. |
| Walidacja forgot mode tylko email (bez hasła) | Forgot mode nie pokazuje pola hasła |

### Pliki
- `apps/web/src/pages/ResetPasswordPage.tsx` — NOWY: formularz hasła z retry PKCE
- `apps/web/src/lib/supabase.ts` — `resetPasswordForEmail()`
- `apps/web/src/store/useAuthStore.ts` — `sendResetLink()`

### Produkcja: redirect allowlist

Supabase Auth weryfikuje `redirectTo` względem `site_url` i `additional_redirect_urls`.
Ponieważ `redirectTo` to `/auth/reset-password` pod tym samym originem, lokalny dev
działa bez zmian (`site_url=http://127.0.0.1:3000` → dozwala subpath).

**Dla produkcji** upewnij się, że w Supabase Dashboard → Authentication → Settings
→ Redirect URLs znajduje się:
- `https://tmcstudio.app/auth/reset-password` (lub właściwy domeny produkcyjnej)
- `https://tmcstudio.app/auth/callback` (już istnieje dla OAuth - zweryfikuj)

Supabase pozwala na `https://*.tmcstudio.app/**` jako wildcard, co pokrywa wszystkie
ścieżki. Jeśli używasz konkretnych URL-i, dodaj obie wyżej.

---

## 13. Email confirmation (S-AUTH S2)

### Flow

```
AuthModal (register mode)
  → useAuthStore.signUp(email, password)
    → supabase.auth.signUp() z emailRedirectTo=/auth/callback
      → Supabase wysyła confirmation email → successMessage "Check your email"
        ↓
User próbuje się zalogować przed potwierdzeniem
  → supabase.auth.signInWithPassword() → błąd
    → useAuthStore wykrywa email_not_confirmed
      → ustawia error = 'auth.errorEmailNotConfirmed'
        → AuthModal pokazuje yellow warning + "Resend confirmation" button
          → onResendConfirmation → supabase.auth.resend({ type: 'signup', email })
```

### Kluczowe decyzje

| Decyzja | Powód |
|---------|-------|
| Detekcja przez string match na błędzie | Supabase nie zwraca `user.email_confirmed_at` w błędzie logowania |
| Resend tylko dla login mode | Po signUp Supabase już wysłał maila — nie duplikujemy |

### Pliki
- `apps/web/src/lib/supabase.ts` — `resendConfirmationEmail()`
- `apps/web/src/store/useAuthStore.ts` — `resendConfirmation()`
- `packages/ui/src/AuthModal.tsx` — `onResendConfirmation` + UI

---

## 10. Pliki i odpowiedzialności

| Plik | Odpowiedzialność |
|---|---|
| `apps/web/src/lib/supabase.ts` | Klient Supabase, helpery auth (signIn, signOut, signInWithGoogle, getCurrentUser, getPreferences, onAuthStateChange, resetPasswordForEmail, resendConfirmationEmail) |
| `apps/web/src/store/useAuthStore.ts` | Stan autha (Zustand + persist), maszyna stanów, initialize(), popup flow (openOAuthPopup, waitForOAuthPopup, waitForOAuthSession), fallback polling, sendResetLink, resendConfirmation |
| `apps/web/src/pages/AuthCallbackPage.tsx` | Strona callback OAuth — wykonuje PKCE, wysyła postMessage (popup) lub navigate (redirect fallback) |
| `apps/web/src/app/AppShell.tsx` | `GoogleAuthStatus` — nieblokujący toast "Logowanie przez Google..." gdy `isOAuthInProgress` |
| `packages/ui/src/AuthModal.tsx` | Modal logowania — zamyka się od razu po starcie Google; forgot/resend confirmation UI |
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

## Z. Przedprodukcyjna checklista — S-AUTH

Przed wypuszczeniem S-AUTH na produkcję wykonaj kolejno:

### Z.1 Supabase Dashboard — redirect allowlist
Wejdź w Supabase Dashboard → Authentication → Settings → Redirect URLs.
- [ ] `https://<twoja-domena>.app/auth/callback` (już istnieje dla OAuth — zweryfikuj)
- [ ] `https://<twoja-domena>.app/auth/reset-password` (NOWY dla resetu hasła)
- [ ] Opcjonalnie wildcard: `https://<twoja-domena>.app/**` (pokrywa wszystkie ścieżki)

### Z.2 SMTP / email delivery
Reset hasła i confirmation email wymagają działającego SMTP.
- [ ] Supabase Dashboard → Authentication → Settings → SMTP — skonfiguruj (Postmark / SendGrid / inny)
- [ ] Ustaw `auth.email.enable_confirmations = true` w projekcie Supabase (domyślnie `false`)
- [ ] Zweryfikuj `max_frequency` — domyślnie `1s`, dla produkcji warto podnieść do `60s`

### Z.3 Test flow reset hasła end-to-end
1. [ ] Wyślij reset link z AuthModal (forgot mode)
2. [ ] Sprawdź, czy email dotarł (Postmark dashboard / Inbucket lokalnie)
3. [ ] Kliknij link — czy ląduje na `/auth/reset-password`?
4. [ ] Czy PKCE exchange wykonał się (sesja dostępna)?
5. [ ] Ustaw nowe hasło — czy `auth.updateUser()` działa?
6. [ ] Zaloguj się nowym hasłem

### Z.4 Test email confirmation flow
1. [ ] Zarejestruj nowe konto (signUp z emailem)
2. [ ] Sprawdź, czy confirmation email dotarł
3. [ ] Nie klikaj linku — spróbuj się zalogować → czy widzisz komunikat „Potwierdź email"?
4. [ ] Kliknij „Resend confirmation" → czy drugi email dotarł?
5. [ ] Kliknij link potwierdzający → czy lądujesz w aplikacji?

### Z.5 Test istniejących flowów (regresja)
- [ ] Google OAuth login (popup) — czy działa?
- [ ] email/password login — czy działa?
- [ ] Logout — czy czyści stan i board?
- [ ] Guest — czy nadal działa bez logowania?
- [ ] SignUp z nowym emailem — czy profil tworzy się poprawnie?

### Z.6 Ustawienia produkcji Supabase
- [ ] `auth.email.enable_confirmations = true` (jeśli chcesz wymagać potwierdzenia emaila)
- [ ] `auth.email.secure_password_change = true` (wymaga recent login do zmiany hasła)
- [ ] `minimum_password_length = 8` (lub więcej)
- [ ] `auth.email.max_frequency` — ograniczenie wysyłki (np. `60s`)
- [ ] `enable_refresh_token_rotation = true` (bezpieczeństwo)

---

## Historia zmian

| Data | Zmiana |
|---|---|
| 2026-06-22 | Dodano sekcje 12 (Reset hasła), 13 (Email confirmation), Z (Przedprodukcyjna checklista) |
| 2026-06-20 | Dokumentacja auth flow |