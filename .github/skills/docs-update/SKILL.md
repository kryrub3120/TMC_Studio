---
name: docs-update
description: Aktualizacja dokumentacji TMC Studio po zmianach user-facing, DB, komponentach, indeksie dokumentow i release notes.
---

# Skill: Docs Update

Aktualizacja dokumentacji po zmianach w sprincie.

---

## Kiedy uzywac

- Po kazdej zmianie user-facing behavior.
- Po zmianie DB/schema.
- Po zmianie entitlements/payment/auth/export.
- Po dodaniu dokumentu.
- Po dodaniu/zmianie komponentu biblioteki UI.
- Po dodaniu lub zmianie user-facing tekstu — potwierdz, ze klucze i18n istnieja w `en.ts`, `pl.ts` i `es.ts` (te same klucze).
- Przed finalnym `ACCEPT SPRINT`.

---

## Zawsze przeczytaj najpierw

- `docs/INDEX.md`.
- `docs/FEATURE_SPEC.md`, jesli zachowanie aplikacji sie zmienia.
- `CHANGELOG.md`, jesli zmiana jest release-worthy.
- `docs/DATA_MODEL.md`, jesli zmiana dotyczy DB.
- `docs/DESIGN_SYSTEM.md`, jesli zmiana dotyczy UI component library.
- `docs/PAYMENT_FOUNDATION.md` / `docs/ENTITLEMENTS.md`, jesli zmiana dotyczy billing/planow.

---

## Wersjonowanie

Kazda zmiana moze wymagac bumpa wersji produktu. Zobacz `docs/VERSIONING.md`.

Obowiazkowe:

- Jesli sprint dodaje funkcje → MINOR bump. Jesli tylko bug fixy → PATCH.
- Bump na WSZYSTKICH `package.json` (root, apps/web, packages/*).
- Po bumpie: `CHANGELOG.md` → przenies `[Unreleased]` do nowej sekcji release.
- Wersja w Footer jest dynamiczna (import z `package.json` w `AppShell.tsx`). Nie hardcoduj.
- Po zmianie wersji zweryfikuj, czy `AppShell.tsx` ma `version={appPkg.version}`.

## Mapping zmian -> dokumenty

| Typ zmiany | Dokumenty |
|------------|-----------|
| User-facing behavior | `docs/FEATURE_SPEC.md` |
| Nowy dokument | `docs/INDEX.md` |
| DB schema | `docs/DATA_MODEL.md`, ewentualnie `docs/DB_CONVENTIONS.md` |
| UI component library | `docs/DESIGN_SYSTEM.md` sekcja component library/adoption |
| Payment/Stripe | `docs/PAYMENT_FOUNDATION.md`, `docs/ENTITLEMENTS.md`, payment PR docs |
| Entitlements/limits | `docs/ENTITLEMENTS.md`, `docs/MONETIZATION_PLAN.md`, `docs/FEATURE_SPEC.md` |
| Architecture/process | `docs/SYSTEM_ARCHITECTURE.md`, `docs/AGENT_ORCHESTRATION.md`, `docs/INDEX.md` |
| Wersjonowanie / bump | `docs/VERSIONING.md`, WSZYSTKIE `package.json`, `CHANGELOG.md` |
| Release/significant change | `CHANGELOG.md` |

---

## Zasady

- Dokumentuj faktyczny stan kodu, nie plan/zyczenie.
- Nie oznaczaj funkcji jako done bez weryfikacji w kodzie.
- Linki w `docs/INDEX.md` musza wskazywac istniejace pliki.
- Po user-facing behavior change aktualizacja `FEATURE_SPEC.md` jest obowiazkowa.
- Nie dopisuj drobnych wewnetrznych zmian do `CHANGELOG.md`, chyba ze sprint/release tego wymaga.
- Jesli dokument zostaje zastapiony nowym, oznacz relacje albo przenies do archive tylko na wyrazne polecenie.

---

## Verification checks

```bash
rg -n "TODO|TBD|UNVERIFIED|FIXME" docs/FEATURE_SPEC.md docs/INDEX.md docs/AGENT_ORCHESTRATION.md
rg -n "\\]\\([^)]*\\.md\\)" docs/INDEX.md
```

Manualnie sprawdz:

- czy nowy dokument jest w `docs/INDEX.md`,
- czy nazwa dokumentu odpowiada zawartosci,
- czy statusy done/partial/todo sa zgodne z kodem,
- czy daty/wersje nie sa sprzeczne.

---

## Expected evidence

- Lista zaktualizowanych dokumentow.
- Dla kazdego dokumentu: co zmieniono i dlaczego.
- Potwierdzenie, ze `docs/INDEX.md` jest aktualny.
- Potwierdzenie, czy `FEATURE_SPEC.md` bylo wymagane.
- Lista swiadomie pominietych docs updates i uzasadnienie.
