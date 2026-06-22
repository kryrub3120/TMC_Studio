# MasterAutopilot — Sprint UX-A DeliveryPass
**Data:** 2026-06-20 10:30
**Sprint:** 1/2 — UX-A (Flow & Bug Hardening)
**Iteracja:** 1

## Cel
Usunąć tarcie ze ścieżki gościa i logowania, domknąć bugi edytora.

## Zakres
A1 CTA zapisu dla gościa, A2 ukryj Wyloguj, A3 przebudowa menu konta, A4 tłumaczenie PPM,
A5 brak modala po loginie, A6 Ustaw jako domyślne, A7 kontrast pomocy, A8 dwuklick na Właściwości.

## Decyzje
- Wersja: PATCH (0.7.1 → 0.7.2) — głównie bugfixy, A3 to zmiana etykiet a nie nowa IA
- A3 menu — zmieniam tylko etykiety i pozycje, nie strukturę nawigacji
- A5 — nie refactoruję auth flow, tylko usuwam modal "zapisz pracę" i zapewniam auto-refresh po loginie
- A6 — naprawiam persist w useUIStore dla arrowDefaults/zoneDefaults
- A7 — zmieniam klasy Tailwind z hardcoded na tokeny
- A8 — dodaję setInspectorActiveTab do useUIStore + handler dwukliku w BoardPage

## Plan implementacji
1. A2 — UserMenu.tsx: dla !user pokazuj tylko "Sign In"
2. A4 — canvasContextMenu.ts + locale: dodaję brakujące klucze contextMenu.*
3. A2/A3 — TopBar.tsx: AccountMenu nie pokazuje "Wyloguj" dla gościa; nowa struktura menu
4. A7 — HelpSidebar.tsx: naprawa kontrastu
5. A8 — useUIStore: dodanie inspectorActiveTab + handler dwukliku
6. A5 — AppShell.tsx: usunięcie modala "zapisz pracę"
7. A1 — documentSlice.ts: CTA zamiast "zapisywanie"
8. A6 — useUIStore: persist arrowDefaults/zoneDefaults

## Ryzyka
- A5 może dotknąć auth flow — nie regresować popup flow (docs/AUTH_FLOW.md)
- A1 dotyka documentSlice.ts — ostrożnie z błędami kompilacji
- A3, A1, A2 dotykają tych samych plików — robić w jednej gałęzi