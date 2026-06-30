# Sprint Contract - S3: Footer nawigacja + TopBar responsywnosc
**Data:** 2026-06-30 00:05

## Cel sprintu
(1) Powrot z /privacy, /terms, /cookies do tablicy (/app) zamiast do strony glownej, (2) Responsywnosc TopBar na wezszych oknach laptopa

## Zakres
### Problem 3: Footer nawigacja
- `apps/web/src/pages/PublicPageShell.tsx`: zmiana `<Link to="/">` na nawigacje wstecz (browser back) z fallbackiem do `/app`

### Problem 4: TopBar responsywnosc
- `packages/ui/src/TopBar.tsx`: dodanie `overflow-x-auto` z maska na prawej stronie header, zmniejszenie gap przy mniejszych szerokosciach
- Zapewnienie, ze AccountMenu (panel sterowania kontem) jest zawsze widoczne

## Poza zakresem
- Zmiana w innym miejscu niz PublicPageShell i TopBar
- Refaktor architektury layoutu

## Kryteria akceptacji
- [ ] Klikniecie "← back" na /privacy wraca do /app zamiast /
- [ ] Po zwężeniu okna na laptopie AccountMenu jest widoczne
- [ ] Po zwężeniu okna na laptopie pasek przewija sie poziomo zamiast ucinac elementy

## Definition of Done
- [ ] Kod zgodny z planem
- [ ] UI zgodne z design systemem
- [ ] Zmiany minimalne

## Ryzyka
- navigate(-1) moze wyjsc z SPA jesli user wszedl bezposrednio na /privacy - fallback do /app to rozwiazuje