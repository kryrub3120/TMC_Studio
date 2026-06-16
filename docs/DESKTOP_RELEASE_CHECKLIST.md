# Jak wydać aplikację desktop — BEZ TERMINALA

## Najpierw: kto czego dotyka

**Użytkownik (klient)** — nic technicznego:
1. Wchodzi na `tmcstudio.app/download`
2. Klika „Download" → pobiera `.dmg` (Mac) lub `.exe` (Windows)
3. Otwiera, przeciąga do Applications, gotowe.

**Ty** — tylko raz, żeby ten plik powstał. Plik buduje się **sam w chmurze GitHuba**.
Poniżej wszystko klikasz w aplikacji GitHub Desktop i na stronie GitHuba.

---

## Krok 1 — wyślij zmiany do GitHuba (GitHub Desktop)
1. Pobierz i zainstaluj **GitHub Desktop** (github.com/apps/desktop), zaloguj się.
2. Otwórz w nim repozytorium `TMC_Studio` (File → Add Local Repository → wskaż folder projektu).
3. Po lewej zobaczysz listę zmienionych plików. Na dole wpisz krótki opis
   (np. „Aplikacja desktop") i kliknij **Commit to main**.
4. Kliknij **Push origin** (u góry).

## Krok 2 — dodaj 2 sekrety (strona GitHuba, w przeglądarce)
GitHub → repo `TMC_Studio` → **Settings** → **Secrets and variables** → **Actions**
→ **New repository secret**. Dodaj dwa (wartości są w pliku `.env.local`):
- `VITE_SUPABASE_URL` = `https://euxauavanukyfofhkrqp.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (długi token z `.env.local`)

## Krok 3 — zbuduj wersję (jeden przycisk na stronie)
GitHub → repo → zakładka **Actions** → po lewej **Desktop Release** →
przycisk **Run workflow** → w polu wpisz `v0.6.0` → **Run workflow**.
Poczekaj ~10–20 min (zielony ptaszek = gotowe). GitHub sam zbuduje `.dmg` i `.exe`.

## Krok 4 — opublikuj
GitHub → repo → **Releases** → zobaczysz **draft** z plikami `.dmg` / `.exe`
→ **Edit** → **Publish release**.

✅ Od tej chwili `tmcstudio.app/download` pokazuje przyciski i pobiera te pliki.

---

## Kolejna wersja
Tylko Krok 1 (Commit + Push w GitHub Desktop, jeśli były zmiany) i Krok 3
z nowym numerem (np. `v0.6.1`), potem Krok 4. To wszystko.

> Dla osób, które wolą terminal, jest też `scripts/desktop.sh` — ale nie jest wymagany.
