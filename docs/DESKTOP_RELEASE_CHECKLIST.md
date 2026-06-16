# Jak wydać aplikację desktop — BEZ TERMINALA

## Najpierw: kto czego dotyka

**Użytkownik (klient)** — nic technicznego:
1. Wchodzi na `tmcstudio.app/download`
2. Klika „Download" → pobiera `.dmg` (Mac) lub `.exe` (Windows)
3. Otwiera, przeciąga do Applications, gotowe.

**Ty** — tylko raz, żeby ten plik powstał. Plik buduje się **sam w chmurze GitHuba**.
Poniżej wszystko klikasz w aplikacji GitHub Desktop i na stronie GitHuba.

---

## Krok 0 — wydajemy z gałęzi `main` (produkcja)
Releasujemy kod produkcyjny, więc najpierw scal `develop` → `main`:
- W **GitHub Desktop**: Branch → **Merge into current branch** (przełącz na `main`,
  scal `develop`), potem **Push origin**.
- Albo na GitHubie: zrób **Pull Request** `develop` → `main` i **Merge**.
Workflow w Kroku 3 uruchamiasz wtedy na gałęzi `main`.

## Krok 1 — wyślij zmiany do GitHuba (GitHub Desktop)
1. Pobierz i zainstaluj **GitHub Desktop** (github.com/apps/desktop), zaloguj się.
2. Otwórz w nim repozytorium `TMC_Studio` (File → Add Local Repository → wskaż folder projektu).
3. Po lewej zobaczysz listę zmienionych plików. Na dole wpisz krótki opis
   (np. „Aplikacja desktop") i kliknij **Commit to main**.
4. Kliknij **Push origin** (u góry).

## Krok 2 — dodaj sekrety PRODUKCYJNE (strona GitHuba, w przeglądarce)
Aplikacja desktop ma łączyć się z **produkcyjną** bazą (tą samą co live `tmcstudio.app`),
NIE z deweloperską. Użyj wartości projektu PROD `pgacjczecyfnwsaadyvj`:

GitHub → repo `TMC_Studio` → **Settings** → **Secrets and variables** → **Actions**
→ **New repository secret**. Dodaj:
- `VITE_SUPABASE_URL` = `https://pgacjczecyfnwsaadyvj.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnYWNqY3plY3lmbndzYWFkeXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjI3NDAsImV4cCI6MjA4MzA5ODc0MH0.w2IADZBnckX80lRmNu53JrE95W-UcZ1_oQfenRGyHpg`

> Którą bazą gada desktop, decydują TE sekrety (przy buildzie), nie gałąź gita.
> Wartości pochodzą z `apps/web/.env.local.prod.bak` (i z produkcyjnego buildu).
> Uwaga: Stripe jest na razie w trybie TEST — płatności nie są jeszcze realne.

### Krok 2.5 — podpis i notaryzacja macOS

Jeśli `.dmg` ma otwierać się normalnie po pobraniu z internetu, dodaj też sekrety
Apple Developer ID. Bez nich build może być technicznie poprawny, ale Gatekeeper
pokaże komunikat „Apple nie może zweryfikować, czy TMC Studio nie zawiera
szkodliwego oprogramowania”.

Wymagane sekrety:
- `APPLE_CERTIFICATE` — base64 z eksportu certyfikatu `.p12` Developer ID Application
- `APPLE_CERTIFICATE_PASSWORD` — hasło ustawione przy eksporcie `.p12`
- `APPLE_SIGNING_IDENTITY` — nazwa z `security find-identity -v -p codesigning`
- `APPLE_ID` — e-mail konta Apple Developer
- `APPLE_PASSWORD` — app-specific password dla Apple ID
- `APPLE_TEAM_ID` — Team ID z Apple Developer
- `KEYCHAIN_PASSWORD` — dowolne silne hasło do tymczasowego keychaina w CI

## Krok 3 — zbuduj wersję (jeden przycisk na stronie)
GitHub → repo → zakładka **Actions** → po lewej **Desktop Release** →
przycisk **Run workflow** → w polu wpisz `v0.6.0` → **Run workflow**.
Poczekaj ~10–20 min (zielony ptaszek = gotowe). GitHub sam zbuduje `.dmg` i `.exe`.

## Krok 3.5 — TEST REALNY (z draftu, zanim ktokolwiek zobaczy)
Workflow tworzy **draft** release — widoczny tylko dla Ciebie.
GitHub → repo → **Releases** → otwórz draft → pobierz `.dmg` (Mac) / `.exe` (Windows)
→ zainstaluj u siebie i przetestuj na **produkcyjnej** bazie (logowanie, zapis, itd.).
Dopóki nie klikniesz Publish, użytkownicy NIC nie widzą.

## Krok 4 — opublikuj (dopiero gdy testy OK)
GitHub → repo → **Releases** → draft → **Edit** → **Publish release**.

✅ Od tej chwili `tmcstudio.app/download` pokazuje przyciski i pobiera te pliki.

---

## Kolejna wersja
Tylko Krok 1 (Commit + Push w GitHub Desktop, jeśli były zmiany) i Krok 3
z nowym numerem (np. `v0.6.1`), potem Krok 4. To wszystko.

> Dla osób, które wolą terminal, jest też `scripts/desktop.sh` — ale nie jest wymagany.
