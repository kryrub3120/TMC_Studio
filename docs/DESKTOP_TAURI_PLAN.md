# TMC Studio — Desktop (macOS + Windows) z Tauri

_Utworzono: 2026-06-15 · Status: setup w toku_

## Cel

Udostępnić TMC Studio jako natywną aplikację desktopową na **macOS** i **Windows**,
żeby (1) testować jak działa na desktopie i (2) na stronie `tmcstudio.app` mieć sekcję
**Download** z wersją dla macOS i dla Windows.

## Decyzje

| Temat | Wybór | Dlaczego |
|---|---|---|
| Wrapper | **Tauri v2** | Lekkie binarki (~10 MB), systemowy webview (WKWebView/WebView2), nowoczesny, dobry do dystrybucji |
| Lokalizacja | `apps/web/src-tauri/` | Tauri opakowuje istniejącą aplikację web (Vite + React + Konva) — bez duplikowania kodu |
| Build macOS | Lokalnie na Macu + CI | `.dmg` można zbudować tylko na macOS |
| Build Windows | **GitHub Actions CI** | Nie trzeba maszyny z Windows — CI buduje oba systemy |
| Routing | `HashRouter` w Tauri, `BrowserRouter` w web | Tauri serwuje z `tauri://localhost`; hash-routing jest niezawodny dla offline assets |
| Strona download | `/download` na istniejącej stronie | Pobiera najnowszy release z GitHub API i podstawia linki do `.dmg` / `.exe` |

## Architektura

    apps/web/
    ├── src/                 # istniejąca aplikacja React (bez zmian poza routerem)
    ├── dist/                # build Vite — to ładuje Tauri jako frontend
    └── src-tauri/           # NOWE: natywna otoczka Rust/Tauri
        ├── Cargo.toml
        ├── build.rs
        ├── tauri.conf.json  # konfiguracja okna, bundla, ikon, komend build
        ├── capabilities/
        ├── icons/           # icon.icns (mac), icon.ico (win), *.png
        └── src/{main.rs,lib.rs}

Tauri w trybie produkcyjnym ładuje statyczny build z `apps/web/dist`.
W trybie dev ładuje `http://localhost:3000` (serwer Vite).

## Kolejność komend (ważne: monorepo)

Pakiety `@tmc/{board,core,presets,ui}` eksportują z `./dist`, więc **muszą być
zbudowane przed** buildem `apps/web`. Dlatego komendy Tauri używają Turbo:

- `beforeDevCommand`: `pnpm turbo run build --filter=@tmc/web^... && pnpm --filter=@tmc/web dev`
  (najpierw build zależności, potem serwer dev)
- `beforeBuildCommand`: `pnpm turbo run build --filter=@tmc/web`
  (Turbo dzięki `dependsOn: ^build` sam zbuduje zależności i web)

## Jak uruchomić na macOS (lokalnie)

Wymagania jednorazowo na Macu:

    # 1. Rust (jeśli nie ma)
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    # 2. Zależności projektu
    pnpm install

Tryb deweloperski (okno aplikacji z hot-reloadem):

    cd apps/web
    pnpm tauri:dev

Build instalatora `.dmg` lokalnie:

    cd apps/web
    pnpm tauri:build
    # wynik: apps/web/src-tauri/target/release/bundle/dmg/*.dmg
    #        apps/web/src-tauri/target/release/bundle/macos/*.app

## Jak wydać wersje na macOS + Windows (CI)

1. Ustaw sekrety repo (Settings → Secrets and variables → Actions):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (opcjonalnie później podpisywanie — patrz niżej)
2. Otaguj wydanie i wypchnij:

       git tag v0.6.0
       git push origin v0.6.0

3. Workflow `.github/workflows/desktop-release.yml` zbuduje:
   - macOS: `TMC Studio_<wersja>_universal.dmg` (Apple Silicon + Intel)
   - Windows: `TMC Studio_<wersja>_x64-setup.exe` + `.msi`
   i wrzuci je jako **draft release** na GitHub. Publikujesz release ręcznie.

## Strona Download

`/download` (`tmcstudio.app/download`) pobiera najnowszy release przez
`api.github.com` i automatycznie podstawia linki do `.dmg` (macOS) i `.exe`
(Windows), wykrywając system użytkownika. Fallback: link do strony Releases.

> CSP: dodano `https://api.github.com` do `connect-src` w `netlify.toml`,
> żeby fetch najnowszego release działał na produkcji.

## Znane ograniczenia / do zrobienia później

1. **Logowanie Google (OAuth)** — `signInWithGoogle` używa `redirectTo:
   window.location.origin`, co w Tauri to `tauri://localhost` i nie zadziała
   w embedded webview. Do testów działa **logowanie e-mail/hasło**. Pełny OAuth
   wymaga `tauri-plugin-deep-link` + custom scheme w Supabase (osobny krok).
2. **Podpisywanie kodu** — publiczne buildy macOS wymagają Apple Developer ID
   + notaryzacji. Bez sekretów Apple w GitHub Actions Gatekeeper zablokuje appkę
   albo pokaże ostrzeżenie; do testów można użyć prawy klik → Open / Privacy & Security.
   Windows bez certyfikatu nadal może pokazać SmartScreen.
3. **Auto-update** — można dodać `tauri-plugin-updater` + `latest.json` (osobny krok).
4. **Ikona** — wygenerowana z `favicon.svg`. Dla finalnego logo:
   `pnpm tauri icon ścieżka/do/logo.png` (nadpisze `src-tauri/icons/`).

---

## Release i auto-update (uzupełnienie)

### Dlaczego „There aren't any releases here"

Release **nie powstaje sam**. Workflow `desktop-release.yml` startuje dopiero po
wypchnięciu taga `v*`. Dopóki nie ma taga — nie ma buildu i nie ma release.

### Pierwsze wydanie (krok po kroku, na Macu)

1. **Zaktualizuj lockfile** (doszły zależności desktop + updater):
   ```bash
   pnpm install
   git add -A && git commit -m "feat(desktop): Tauri app + auto-updater + download page"
   ```

2. **Wygeneruj klucze updatera (jednorazowo)** — podpisują aktualizacje:
   ```bash
   cd apps/web
   pnpm tauri signer generate -w ~/.tauri/tmc-studio.key
   ```
   Komenda wypisze **public key** i zapisze **private key** do pliku.
   - Wklej public key do `apps/web/src-tauri/tauri.conf.json` w
     `plugins.updater.pubkey` (zamiast `PASTE_TAURI_UPDATER_PUBLIC_KEY_HERE`).
   - Zacommituj zmianę w tauri.conf.json.

3. **Ustaw sekrety repo** (GitHub → Settings → Secrets and variables → Actions):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `TAURI_SIGNING_PRIVATE_KEY` — zawartość pliku `~/.tauri/tmc-studio.key`
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — hasło podane przy generowaniu (jeśli puste, ustaw pusty sekret)

4. **Otaguj i wypchnij**:
   ```bash
   git tag v0.6.0
   git push origin v0.6.0
   ```
   Workflow (10–20 min) zbuduje macOS + Windows i utworzy **draft release** z:
   - instalatorami (`.dmg`, `.exe`/`.msi`),
   - artefaktami updatera + **`latest.json`** (podpisany).

5. **Opublikuj draft** na GitHub (Releases → Edit → Publish).
   Dopiero opublikowany release jest widoczny dla:
   - strony `/download` (pobiera najnowszy),
   - **auto-updatera** (czyta `releases/latest/download/latest.json`).

### Jak działa auto-update w aplikacji

Przy starcie aplikacja sprawdza `latest.json`. Jeśli jest nowsza wersja:
- pokazuje **popup w prawym dolnym rogu** („New version available · vX"),
- po kliknięciu **Install & restart** pobiera (pasek postępu), instaluje i
  **sam się restartuje** na nowej wersji.
- Na Windows tryb `passive` — instalacja z minimalną interakcją.

### Jak wydać kolejną wersję (test updatera)

1. Podbij wersję w **`apps/web/package.json`** (np. `0.6.1`).
   Tauri czyta wersję z tego pliku (`"version": "../package.json"`),
   więc to jedyne miejsce do zmiany.
2. `git commit` → `git tag v0.6.1` → `git push origin v0.6.1`.
3. Opublikuj nowy draft release.
4. Uruchomiona wcześniej aplikacja `v0.6.0` przy następnym starcie pokaże popup
   aktualizacji do `v0.6.1`.

### Uwaga o podpisach systemowych (osobne od updatera)

Klucz updatera ≠ podpis Apple/Windows. Bez certyfikatów Apple/Windows instalator
nadal pokaże ostrzeżenie systemu przy pierwszej instalacji (Gatekeeper/SmartScreen).
Updater działa niezależnie i nie wymaga certyfikatów Apple/Windows.

---

## STAN OBECNY: updater UŚPIONY (żadnych kluczy do testów)

Żeby zacząć testować od razu, auto-updater jest **wyłączony w configu**:
- `bundle.createUpdaterArtifacts = false`
- brak `plugins.updater` w `tauri.conf.json`

Kod updatera (Rust + popup `UpdatePrompt`) **zostaje w projekcie**, ale jest nieaktywny —
`check()` nie znajduje configu i po cichu nic nie pokazuje. Build i CI **nie wymagają
żadnego klucza podpisu**.

### Pierwsze wydanie TERAZ (minimalna ścieżka)

1. `pnpm install` + commit (lockfile + nowe pliki).
2. Sekrety repo: tylko `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`
   (wartości są w `.env.local`).
3. `git tag v0.6.0 && git push origin v0.6.0`.
4. Workflow zbuduje macOS + Windows → **draft release** z instalatorami.
5. Opublikuj draft → strona `/download` zaczyna działać.

Instalatory bez sekretów Apple/Windows są niepodpisane → przy pierwszym uruchomieniu:
- macOS: prawy klik na aplikacji → **Open** albo Privacy & Security → Open Anyway,
- Windows: **More info → Run anyway** (SmartScreen).

### Włączenie auto-updatera PÓŹNIEJ (gdy zechcesz, darmowe)

Klucz updatera jest **darmowy i własny** (to nie cert Apple). Gdy będziesz gotów:
1. `cd apps/web && pnpm tauri signer generate -w ~/.tauri/tmc-studio.key`
2. W `tauri.conf.json`: ustaw `bundle.createUpdaterArtifacts = true` i dodaj z powrotem
   blok `plugins.updater` z `endpoints` (latest.json) i `pubkey` (z kroku 1).
3. Sekrety: `TAURI_SIGNING_PRIVATE_KEY` (treść pliku klucza) + `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
4. Wydaj nową wersję — od tej wersji aplikacja sama proponuje aktualizacje.

(Cert Apple Developer / Windows code-signing to osobna, płatna sprawa. Mac publiczny
download wymaga Apple Developer ID + notaryzacji, jeśli ma otwierać się bez blokady
Gatekeepera.)
