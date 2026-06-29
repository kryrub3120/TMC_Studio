# Sprint Contract - UX-A "Po pierwsze nie wkurwiać"
**Data:** 2026-06-20 11:00

## Cel sprintu
Usunąć całe tarcie ze ścieżki gościa i logowania oraz domknąć cztery bugi edytora.

## Zakres
A1-A8 wg TRIAGE_PRODUKCJA_2026-06-20.md

## Poza zakresem
- Cloud sync (B1-B2 - osobny sprint)
- Zmiany w Supabase/migracje DB
- Nowe funkcje poza CTA/naprawami

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| ui-delivery | wszystkie zmiany UI (UserMenu, TopBar, ContextMenu, RightInspector, itd.) | zgodnosc z DESIGN_SYSTEM.md, i18n, typecheck/build |
| design-system-review | kontrast pomocy, layout menu, nowe komponenty | brak hardcoded hexow, tokeny, dark mode |
| regression-testing | po kazdej zmianie | typecheck, build, manual checks |
| docs-update | CHANGELOG + bump wersji | zaktualizowany CHANGELOG, package.json |

## Kryteria akceptacji
- [ ] A1: niezalogowany przy probie zapisu widzi CTA z Google + Stworz konto
- [ ] A2: niezalogowany nigdzie nie widzi "Wyloguj"
- [ ] A3: menu konta ma nowe 6 pozycji; ustawienia tablicy/zawodnikow jako podzakladki
- [ ] A4: brak surowych kluczy i18n w menu PPM (pl/en/es)
- [ ] A5: po loginie Google brak recznego odswiezania i brak modala "zapisac prace?"
- [ ] A6: "Ustaw jako domyslne" dziala dla strzalek i stref i przezywa reload
- [ ] A7: menu pomocy czytelne w light i dark mode
- [ ] A8: dwuklik obiektu przelacza inspektor na Wlasciwosci
- [ ] tsc --noEmit + build zielone; testy zielone
- [ ] CHANGELOG + bump wersji

## Zaleznosci
- A5 zalezy od AUTH_FLOW.md - nie regresowac popup flow
- A1/A2/A3 dotykaja UserMenu.tsx i TopBar.tsx - robic w jednej galezi

## Ryzyka
- A3 zmienia IA menu - moze wplynac na inne komponenty korzystajace z UserMenu
- A5 moze byc juz naprawione (jest w [Unreleased] w CHANGELOG)
- A6 moze byc juz dzialajace (jest w [0.7.0] z 2026-06-18)

## Limit wewnetrznego loopa
3 proby