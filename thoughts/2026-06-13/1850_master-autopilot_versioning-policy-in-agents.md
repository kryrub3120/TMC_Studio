# Master Autopilot - Polityka wersjonowania w agentach
**Data:** 2026-06-13 18:50
**Iteracja:** 1

## Zadanie
Dodać politykę wersjonowania do instrukcji agentów — by agenci pamiętali o update'owaniu wersji w odpowiednich miejscach (package.json, CHANGELOG, Footer) i by wersja w aplikacji (stopka) była dynamiczna.

## Decyzje i uzasadnienie
- **Footer hardcoded → dynamiczny import**: `AppShell.tsx` miał `version="0.5.0"` na sztywno. Zamieniono na import `version` z `apps/web/package.json` przez `import appPkg from '../../package.json'`. To eliminuje ryzyko, że agent (lub człowiek) zrobi bump wersji w package.json a zapomni zmienić hardcoded stringa w Footer.
- **Instrukcje w agentach**: `.github/copilot-instructions.md` dostało sekcję "Wersjonowanie aplikacji" z konkretnymi zasadami bumpa i odesłaniem do `docs/VERSIONING.md`.
- **AGENT_ORCHESTRATION.md**: Sekcja Skill Selection dostała podsekcję "Wersjonowanie" z checklistą dla MasterVerifier na SprintGate.
- **docs-update SKILL.md**: Rozszerzony mapping zmian o wersjonowanie.
- **VERSIONING.md**: Dodałem sekcje 8 (UI Dynamic Version) i 9 (Agent Instructions) — dokumentacja polityki i powiązań.
- **repo memory**: Zaktualizowane `docs_update_habit.md` o zasady bumpa.

## Odrzucone alternatywy
- Vite `define` z `__APP_VERSION__` — niepotrzebny build step skoro `resolveJsonModule` działa out-of-the-box.
- `process.env.VITE_APP_VERSION` — wymaga ustawiania w buildzie, a import z package.json jest prostszy i zawsze zgodny.

## Co zrobiono

### Zmienione pliki:

1. **`apps/web/src/app/AppShell.tsx`**
   - Dodano `import appPkg from '../../package.json'`
   - `version="0.5.0"` → `version={appPkg.version}`
   - Komentarz: "Footer — version from package.json (source of truth, see VERSIONING.md)"

2. **`.github/copilot-instructions.md`**
   - Nowa sekcja "Wersjonowanie aplikacji" przed "Baza danych i migracje":
     - Zasady bumpa (MINOR / PATCH)
     - Bump na WSZYSTKICH package.json
     - CHANGELOG update
     - Footer dynamiczny — nie hardcoduj
     - Odniesienie do `docs/VERSIONING.md`

3. **`docs/AGENT_ORCHESTRATION.md`**
   - W rozdziale 5 (Skill Selection) dodano podsekcję "Wersjonowanie":
     - Zasady bumpa
     - Checklista dla MasterVerifier (3 punkty: package.json, CHANGELOG, Footer)

4. **`docs/VERSIONING.md`**
   - Nowa sekcja 8: "UI: Dynamic Version in Footer" — wyjaśnienie jak działa import, zakaz hardcode'u
   - Nowa sekcja 9: "Agent Instructions" — tabela z plikami i ich zawartością + checklista dla MasterVerifier
   - Stare sekcje 8→10, 9→11 (przenumerowane)

5. **`.github/skills/docs-update/SKILL.md`**
   - Nowa sekcja "Wersjonowanie" z zasadami bumpa
   - Wiersz w mapping tabeli: "Wersjonowanie / bump" → docs/VERSIONING.md, package.json, CHANGELOG.md

6. **`/memories/repo/docs_update_habit.md`**
   - Dopisana sekcja "Versioning bump — mandatory" z zasadami

## Evidence
- `pnpm --filter @tmc/web typecheck` — ✅ przeszedł bez błędów
- Wszystkie `package.json` spójnie na `0.5.0`
- Footer od teraz czyta wersję z `package.json` — zawsze aktualna po bumpie

## Status DoD
- [x] Footer dynamiczny (import z package.json zamiast hardcode)
- [x] .github/copilot-instructions.md zawiera zasady wersjonowania
- [x] docs/AGENT_ORCHESTRATION.md zawiera checklistę wersjonowania dla MasterVerifier
- [x] docs/VERSIONING.md zawiera odniesienia do agentów i stopki
- [x] docs-update SKILL.md rozszerzony o wersjonowanie
- [x] Repo memory zaktualizowane
- [x] Typecheck przechodzi

## Dla następnej iteracji
- Po faktycznym bumpie wersji zweryfikować manualnie, czy Footer pokazuje nową wersję
- Rozważyć dodanie testu, który sprawdza, czy `appPkg.version` w AppShell odpowiada package.json