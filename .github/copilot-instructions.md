# Główne Zasady Pracy dla GitHub Copilot (TMC Studio)

Zanim wygenerujesz jakikolwiek kod lub zaproponujesz zmiany, MASZ BEZWZGLĘDNY OBOWIĄZEK przeczytać i zastosować wszystkie reguły architektoniczne i behawioralne (Hard Rules) znajdujące się w pliku:
`docs/SYSTEM_ARCHITECTURE.md` (szczególnie sekcję 11).

Projekt jest w fazie MVP. Obowiązuje ścisły podział na środowisko Dev (lokalne) i Prod.

---

## Workflow — jak pracujemy

```
@Ask      → pytania, eksploracja, wyjaśnienia
    ↓
@Plan     → planowanie, podział na zadania, zatwierdzenie
    ↓
@Delivery → implementacja + testy w pętli (autonomicznie)
    ↓
TY        → oceniasz wynik: ACCEPT / LOOP AGAIN / STOP
```

**@Implementer i @Tester** — dostępne do użycia osobno gdy chcesz mieć ręczną kontrolę nad każdym etapem.

---

## Thoughts — Artefakty pracy agentów

**Każdy agent MUSI zostawić ślad swojej pracy** w folderze `thoughts/`.

### Format pliku
```
thoughts/YYYY-MM-DD/HHMM_[agent]_[slug-zadania].md
thoughts/YYYY-MM-DD/HHMM_[agent]_[slug-zadania]_iter-N.md
```

### Co musi zawierać każdy plik thoughts

```markdown
# [Agent] — [Nazwa zadania]
**Data:** YYYY-MM-DD HH:MM
**Iteracja:** N

## Zadanie
[Co miałem zrobić]

## Proces myślenia
[Jak podszedłem do problemu, co rozważałem, co odrzuciłem i dlaczego]

## Co zrobiłem
[Konkretne akcje, zmiany, decyzje]

## Napotkane problemy
[Co nie działało, jak to rozwiązałem]

## Wynik
[Co osiągnąłem]

## Status DoD
- [ ] / [x] każde kryterium

## Dla następnej iteracji / następnego agenta
[Co powinien wiedzieć]
```

---

## Tryb LOOP — zasady dla wszystkich agentów

### Jak uruchomić
```
@[Agent] LOOP [limit]: [zadanie]
```

Limity: `3próby`, `15min`, `4próby 20min` — agent zatrzymuje się gdy pierwszy zostanie osiągnięty.

### Zasady pracy w LOOP
- Agent NIE pyta użytkownika między iteracjami
- Każda iteracja = osobny plik thoughts z numerem iteracji
- Agent zawsze kończy raportem końcowym z opcjami: ACCEPT / LOOP AGAIN / STOP
- Gdy użytkownik odpowie `LOOP AGAIN: [feedback]` — agent kontynuuje z tym feedbackiem

---

## Środowiska — KRYTYCZNE

- **Dev** = lokalne środowisko deweloperskie
- **Prod** = produkcja z prawdziwymi danymi
- **NIGDY nie modyfikuj produkcji** bez jawnego polecenia i zatwierdzonego planu
- **NIGDY nie modyfikuj** `.env.production`

---

## Styl i UX/UI

- Czytaj `docs/DESIGN_SYSTEM.md` przed każdą zmianą UI
- Czytaj `docs/AGENTS_CHECKLIST.md` — lista kontrolna przed zadaniem
- Używaj TYLKO komponentów z istniejącej biblioteki projektu
- Zero inline styles — wyłącznie klasy z design systemu
- Mobile-first zawsze
- Dostępność obowiązkowa: aria-labels, kontrast, focus states

---

## Baza danych i migracje

- Każda zmiana schematu = plik migracji (nigdy bezpośrednia edycja)
- Format nazwy migracji: `YYYYMMDD_HHMMSS_krotki_opis`
- Czytaj `docs/DB_CONVENTIONS.md` przed pracą z bazą
- Czytaj `docs/AGENTS_CHECKLIST.md` — sekcja DB
- Zgłoś ryzyko migracji w thoughts i wykonuj tylko na Dev

---

## Zasady kodu (wszystkie agenty)

- Modyfikuj minimum niezbędnych plików
- Naśladuj istniejące wzorce w projekcie
- Nie hardcoduj wartości
- Obsługuj błędy jawnie

---

## Definition of Done

Zadanie jest ukończone gdy:
- [ ] Kod działa zgodnie z planem
- [ ] Testy napisane i przechodzą
- [ ] UI zgodne z design systemem (jeśli dotyczy)
- [ ] Migracja bezpieczna i przetestowana na Dev (jeśli dotyczy)
- [ ] Brak regresji w istniejących funkcjach
- [ ] Plik thoughts zapisany w `thoughts/`
