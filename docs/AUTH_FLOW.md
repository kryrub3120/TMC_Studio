# TMC Studio - Authentication Flow

> Aktualny opis logowania, sesji i konfiguracji produkcyjnej.
> **Last updated:** 2026-08-09

## Status

Produkcyjny webowy Google OAuth używa **redirectu w tej samej karcie**. Jest to
domyślny i wspierany przepływ dla `https://tmcstudio.app`.

- Provider: Supabase Auth z OAuth 2.0 PKCE.
- Web: `VITE_AUTH_GOOGLE_SURFACE=redirect`.
- Callback: `/auth/callback` wymienia jednorazowy kod PKCE na sesję.
- Powrót: po udanej wymianie aplikacja przechodzi na `/board`.
- Popup: pozostaje wyłącznie eksperymentalną powierzchnią do testów; nie jest
  częścią produkcyjnego flow.

## Google OAuth - przebieg produkcyjny

```text
/board lub AuthModal
  -> signInWithGoogle()
  -> Supabase authorize (redirectTo: /auth/callback)
  -> Google consent screen
  -> Supabase callback
  -> https://tmcstudio.app/auth/callback?code=...&state=...
  -> AuthCallbackPage.exchangeCodeForSession(code)
  -> podstawowy stan zalogowanego uzytkownika
  -> /board
  -> onAuthStateChange laduje profil, preferencje i dane aplikacji w tle
```

Uzytkownik opuszcza aplikacje na czas logowania Google i wraca do niej w tej
samej karcie. Nie polegamy na `window.open`, `postMessage` ani odczycie
`popup.closed`, wiec polityka COOP przegladarki nie przerywa logowania.

### Callback PKCE

`apps/web/src/pages/AuthCallbackPage.tsx` jest jedynym miejscem webowego
callbacku OAuth. Odczytuje `code` z URL i wywoluje
`supabase.auth.exchangeCodeForSession(code)` dokladnie raz.

Wspolny klient Supabase ma `detectSessionInUrl` wlaczone tylko na
`/auth/reset-password`. Dzięki temu automatyczna obsluga SDK nie sciga sie z
jawnym exchange na `/auth/callback`.

Po otrzymaniu sesji callback ustawia minimalny stan uzytkownika i natychmiast
nawiguje do `/board`. Listener `onAuthStateChange` pobiera pelny profil oraz
preferencje asynchronicznie. Wazne: nie czeka na ten odczyt w callbacku SDK,
wiec wymiana PKCE nie jest blokowana przez dodatkowe zapytanie do bazy.

## Pozostale metody

| Metoda | Przebieg |
|---|---|
| Google OAuth | Redirect w tej samej karcie -> PKCE callback -> `/board` |
| Email i haslo | `signInWithPassword` -> listener sesji aktualizuje store |
| Reset hasla | Link prowadzi na `/auth/reset-password`; SDK obsluguje URL tej trasy |
| Rejestracja i potwierdzenie emaila | Supabase Auth oraz linki emailowe zgodne z allowlista redirectow |

Przy rejestracji aplikacja zapisuje w metadanych uzytkownika `locale` (`pl`,
`en` albo `es`). Redirect potwierdzenia i resetu hasla zawiera ten sam jezyk,
dlatego ekran po kliknieciu linku oraz tresc wiadomosci pozostaja spojne.

Szablony Auth znajduja sie w `supabase/templates/`. Ich wdrozenie oraz transport
SMTP przez Postmark opisuje `docs/EMAIL_DELIVERY_AND_TEMPLATES.md`.

## Konfiguracja

### Netlify

W produkcji musza byc ustawione co najmniej:

```env
VITE_SUPABASE_URL=https://pgacjczecyfnwsaadyvj.supabase.co
VITE_SUPABASE_ANON_KEY=<production-anon-key>
VITE_AUTH_GOOGLE_SURFACE=redirect
```

Runtime dla lokalnego developmentu, CI i Netlify to Node 22 (`.nvmrc`:
`22.15.0`). Nie zapisuj kluczy prywatnych w repozytorium ani w dokumentacji.

### Supabase URL Configuration

W projekcie produkcyjnym wymagane sa:

- Site URL: `https://tmcstudio.app`
- Redirect URL: `https://tmcstudio.app/auth/callback`
- Redirect URL dla lokalnego testu: `http://localhost:3000/auth/callback`
- Redirect URL: `https://tmcstudio.app/auth/reset-password`

Preview Netlify wymaga osobnego wpisu dla swojego originu, jezeli Google OAuth
ma byc na nim testowany. Callback ustawiany w Google Cloud dla providera
Supabase to:

`https://pgacjczecyfnwsaadyvj.supabase.co/auth/v1/callback`

## Weryfikacja po deployu

1. Otworz `https://tmcstudio.app/board` jako wylogowany uzytkownik.
2. Zaloguj sie przez Google i potwierdz, ze po powrocie widzisz `/board` oraz
   konto w TopBar.
3. Odswiez strone i sprawdz, ze sesja pozostaje aktywna.
4. Anuluj logowanie na ekranie Google i sprawdz, ze wracasz do aplikacji bez
   zablokowanego stanu ladowania.
5. Sprawdz login email/haslo i reset hasla.

Przed merge uruchom:

```bash
pnpm --filter @tmc/web typecheck
pnpm --filter @tmc/web test
pnpm --filter @tmc/web build
```

## Diagnostyka

| Objaw | Co sprawdzic |
|---|---|
| Callback zostaje na `/auth/callback` | Czy `code` jest obecny tylko raz, a redirect URL jest na allowliscie Supabase |
| Brak powrotu do sesji | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, storage przegladarki i log `[Auth] OAuth callback` |
| Google odrzuca redirect | Authorized redirect URI Google musi wskazywac callback Supabase, nie domeny aplikacji |
| Wolny powrot | Czas exchange i bledy sieci; profil jest ladowany w tle i nie powinien blokowac PKCE |

## Eksperymentalny popup

`VITE_AUTH_GOOGLE_SURFACE=popup` jest zachowany tylko dla kontrolowanych
testow. Uzywa statycznego `/auth/popup-callback.html`, ale rozne implementacje
COOP i blokady popupow przegladarek czynia ten wariant mniej niezawodnym.
Nie wlaczaj go w produkcji bez osobnej weryfikacji miedzy przegladarkami.

Historia poprzednich wariantow jest w `CHANGELOG.md` i `docs/archive/`.
