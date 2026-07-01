# Current Task: Label Editor Upgrade — Wariant B, Multiline, Wyrownanie, Jeden Model Skrotow

**Status:** 🟢 READY
**Source of truth:** `tasks/LABEL_EDITOR_UPGRADE_2026-07-01.md`

---

## Aktualne zadanie

**Label Editor Upgrade** — 🟢 READY

Cel: etykiety tekstowe na tablicy (`TextNode`) dostaja Wariant B (mocny flat chip, dziala tez w print mode), edycja wspiera multiline (Enter = nowa linia, Ctrl/Cmd+Enter = zapisz), dochodzi wyrownanie tekstu (lewo/srodek/prawo/justuj), a rozmiar i kolor dostaja jeden spojny model skrotow dla WSZYSTKICH typow elementow na tablicy (nie tylko tekstu). Skrot `T` (dodaj tekst w miejscu kursora) zostaje bez zmian.

Zakres (kolejnosc realizacji):

1. TXT1 — model danych (`borderColor`, `borderWidth`, `textAlign` w `TextElement`) + wyglad chipa Wariant B w `TextNode.tsx`.
2. TXT3 — wiring `align`/`width`/`lineHeight` w Konva `<Text>` (align wymaga jawnego width).
3. TXT2 — multiline editing: Enter = nowa linia, Ctrl/Cmd+Enter = zapisz, autosize textarea.
4. TXT4 — wyrownanie: pole danych + `Alt+←/→` (zaznaczony, nieedytowany tekst) + przyciski w `SelectionToolbar`.
5. TXT5 — ujednolicenie: `Shift+"+"/"-"` = rozmiar dla kazdego typu elementu; `Alt+↑/↓` = kolor dla kazdego typu (naprawa martwego kodu dla tekstu, udokumentowanego juz w `docs/COMMANDS_MAP.md:186`); wycofanie `Cmd+Alt+=/-` i equipment-only `+/-`.
6. TXT6 — dokumentacja: `docs/COMMANDS_MAP.md`, `docs/DATA_MODEL.md`, `CHANGELOG.md`, cheat sheet, i18n.

Command dla agenta:

```text
Zrealizuj `tasks/LABEL_EDITOR_UPGRADE_2026-07-01.md`.
Najpierw przeczytaj caly brief oraz docs/COMMANDS_MAP.md i docs/DATA_MODEL.md.
Kolejnosc: TXT1 -> TXT3 -> TXT2 -> TXT4 -> TXT5 -> TXT6.
Nie zmieniaj skrotu "T" (addTextAtCursor) i nie zmieniaj semantyki Escape (anuluj).
Po kazdym TXT-bloku uruchom typecheck. Po calosci uruchom typecheck/test/build,
zaktualizuj CHANGELOG.md, docs/COMMANDS_MAP.md, docs/DATA_MODEL.md i tasks/NEXT_TASK.md.
```

---

## Rownolegle strumienie (nie ruszac bez potrzeby)

**Sprint UX-C — Editor Viewport, Pan i Squad Bench** — 🟡 W TLE, C1-C6 nadal TODO
- Source of truth: `tasks/UX_EDITOR_VIEWPORT_BENCH_2026-06-29.md`.
- Nieukonczony przed rozpoczeciem Label Editor Upgrade. Nie zostal odwolany, tylko odlozony — priorytet uzytkownika przeszedl na etykiety tekstowe.
- Jesli wracamy do niego pozniej: uwaga na dirty pliki z rownoleglego agenta opisane w sekcji "Aktualizacja po rownoleglym agencie — 2026-06-29" w tamtym dokumencie (`useCanvasEventsController.ts` cursorPosition itd.).

---

## Zakonczone / kontekst

**Auth Flow V3 — Web-Only Launch Flow** — ✅ DONE (2026-07-01)
- S-AUTH3.0 (popup regression fix), S-AUTH3.1 (web popup adapter + surface resolver), routing `/board` kanoniczne, `/app` → `/board` legacy redirect.
- Linki landing/pricing/auth/Stripe/billing portal zaktualizowane na `/board`.
- Desktop/Tauri scaffold (S-AUTH3.3) zachowany, nie blokuje web launchu.
- Dokumentacja: `docs/WEB_LAUNCH_CHECKLIST.md`, `docs/AUTH_FLOW.md`, `tasks/AUTH_FLOW_V3_COMPLEX_PLAN_2026-07-01.md`.
- Merge `develop` → `main` (commity: `42e7309`, `5a929f5`).
- Szczegóły: `tasks/AUTH_FLOW_V3_COMPLEX_PLAN_2026-07-01.md`, `docs/WEB_LAUNCH_CHECKLIST.md`, `docs/CURRENT_SPRINT_PLAN.md`.

**Auth Flow hotfix** — ✅ DONE (2026-06-20, wchłonięty przez Auth V3)
Google OAuth popup zamiast redirectu. Szczegoly: `docs/AUTH_FLOW.md`, `docs/CURRENT_SPRINT_PLAN.md`.

**Sprint 2 - Quality Gate i testy minimalne** — ✅ DONE (2026-06-22)
**Sprint 1 - Security & Billing Hardening** — ✅ DONE (2026-06-18)
**Sprint 0.5 - Release & Deploy Verification** — ✅ DONE (2026-06-18)
