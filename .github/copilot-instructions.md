# Glowne Zasady Pracy dla GitHub Copilot - TMC Studio

Zanim wygenerujesz jakikolwiek kod lub zaproponujesz zmiany, MUSISZ przeczytac i zastosowac reguly architektoniczne i behawioralne z:

`docs/SYSTEM_ARCHITECTURE.md`

Szczegolnie wazna jest sekcja 11 - Hard Rules.

Projekt jest w fazie MVP. Obowiazuje scisly podzial na srodowisko Dev lokalne i Prod produkcyjne.

---

## Workflow

### Dla pojedynczego zadania (bez Mastera)

```text
@Ask
  -> pytania, eksploracja, wyjasnienia, zero zmian

@Plan
  -> planowanie, podzial na zadania, ryzyka, kryteria akceptacji
  -> konczy sie decyzja uzytkownika: APPROVE PLAN / CHANGE PLAN / STOP

@Delivery
  -> implementacja + testy + self-review + naprawy w petli
  -> dziala autonomicznie po zatwierdzeniu planu

TY
  -> oceniasz wynik: ACCEPT / LOOP AGAIN / STOP
```

### Dla planu z wieloma sprintami (Master Autopilot)

```text
@Ask
  -> pytania, eksploracja, wyjasnienia, zero zmian

@Plan
  -> planowanie, podzial na sprinty, ryzyka, kryteria akceptacji
  -> konczy sie decyzja: APPROVE PLAN / CHANGE PLAN / STOP

@MasterAutopilot (PREFEROWANY dla wielu sprintow)
  -> analizuje glowny plan, dzieli na sprinty, wykrywa zaleznosci
  -> wybiera i czyta SKILL.md z .github/skills/ per sprint
  -> dziala w JEDNEJ sesji - nie deleguje do @Delivery
  -> wewnetrzne passy: DeliveryPass -> TesterPass -> FixPass -> MasterVerifier -> SprintGate
  -> wewnetrzny loop az do DoD albo limitu
  -> pyta uzytkownika TYLKO przy blockerach, scope/product decisions, prod/data/payment risk
  -> po ostatnim sprincie: Final Master Summary

TY
  -> oceniasz wynik: ACCEPT / STOP / CHANGE PLAN
  -> odpowiadasz tylko na ASK USER lub BLOCKED
```

`@Implementer` i `@Tester` sa dostepne jako tryb reczny, gdy uzytkownik chce miec osobna kontrole nad implementacja i testowaniem.

### Ktorego workflow uzyc?

| Scenariusz | Uzyj |
|------------|------|
| Pojedyncze male zadanie | **Delivery** (bez Mastera) |
| Plan z wieloma sprintami (S1-S6) | **Master Autopilot** (preferowany) |
| Tylko eksploracja/pytania | **Ask** (zero agentow) |
| Tylko implementacja (manualny nadzor) | **Implementer** recznie |
| Tylko testy (manualny nadzor) | **Tester** recznie |

- **Master Autopilot jest preferowany dla wielu sprintow.** Dziala w jednej sesji, nie wymaga przeklejania promptow.
- **Master Autopilot nie deleguje do zewnetrznego @Delivery.** Role Delivery/Tester sa wewnetrznymi passami.
- **Master Autopilot jest finalnym gatekeeperem sprintu.** DeliveryPass moze uwazac sprint za gotowy, ale tylko MasterVerifier + SprintGate zatwierdza.
- **Skille sa dobierane per sprint** z `.github/skills/` przez SkillSelectionPass i czytane przed passami, ktore ich uzywaja.
- Zobacz `docs/AGENT_ORCHESTRATION.md`.

---

## Plan Approval Gate

Agent `Plan` jest agentem systemowym Copilota i nie jest modyfikowany.

Kazdy plan przed przekazaniem do `Delivery` albo `MasterAutopilot` musi zawierac:

- Cel zadania
- Zakres zmian
- Poza zakresem
- Kryteria akceptacji
- Ryzyka
- Pliki lub obszary prawdopodobnie dotkniete zmiana
- Wymagane testy
- Decyzje uzytkownika: `APPROVE PLAN / CHANGE PLAN / STOP`

`Delivery` albo `MasterAutopilot` moze zaczac prace tylko po jasnym `APPROVE PLAN`.

`Delivery` i `MasterAutopilot` NIE moga rozszerzyc zatwierdzonego zakresu. Jesli odkryja potrzebe wiekszej zmiany, oznaczaja ja jako `OUT OF SCOPE` albo `BLOCKER` i raportuja uzytkownikowi.

---

## Tryb LOOP

### Jak uruchomic

```text
@[Agent] LOOP [limit]: [zadanie]
```

Przyklady limitow:

```text
3proby
15min
4proby 20min
6 sprintow 3proby na sprint
```

Agent zatrzymuje sie, gdy pierwszy limit zostanie osiagniety.

### Zasady LOOP

- Agent NIE pyta uzytkownika miedzy iteracjami.
- Kazda iteracja musi miec osobny plik w `thoughts/`.
- Agent konczy raportem z opcjami: `ACCEPT / LOOP AGAIN / STOP`.
- Gdy uzytkownik odpowie `LOOP AGAIN: [feedback]`, agent kontynuuje od obecnego stanu i traktuje feedback jako dodatkowe kryteria DoD.

### Master Autopilot LOOP

Dla duzych planow z wieloma sprintami:

```text
@MasterAutopilot LOOP [liczba sprintow] [limit na sprint]: [glowny plan]
```

Przyklad:

```text
@MasterAutopilot LOOP 6 sprintow 3proby na sprint:
[tu wklejam glowny plan z S1-S6]
```

Master Autopilot sam:
- analizuje plan i dzieli na sprinty,
- wybiera skille per sprint i czyta wybrane `SKILL.md`,
- wykonuje wewnetrzny loop (DeliveryPass -> TesterPass -> FixPass -> MasterVerifier -> SprintGate),
- pyta uzytkownika TYLKO przy blockerach i decyzjach produktowych.

---

## Thoughts - artefakty pracy agentow

Kazdy agent MUSI zostawic slad swojej pracy w folderze `thoughts/`.

### Format pliku

```text
thoughts/YYYY-MM-DD/HHMM_[agent]_[slug-zadania].md
thoughts/YYYY-MM-DD/HHMM_[agent]_[slug-zadania]_iter-N.md
```

### Format zawartosci

```md
# [Agent] - [Nazwa zadania]
**Data:** YYYY-MM-DD HH:MM
**Iteracja:** N

## Zadanie
[Co mialem zrobic]

## Decyzje i uzasadnienie
- Wybrane podejscie
- Odrzucone alternatywy
- Przyjete zalozenia
- Ryzyka

## Co zrobilem
[Konkretne akcje, zmiany, decyzje]

## Napotkane problemy
[Co nie dzialalo, jak to rozwiazano]

## Evidence
- Komendy uruchomione
- Wyniki testow
- Manual checks, jesli dotyczy
- Powod, jesli czegos nie dalo sie sprawdzic

## Wynik
[Co osiagnieto]

## Status DoD
- [ ] / [x] kazde kryterium

## Dla nastepnej iteracji / nastepnego agenta
[Co powinien wiedziec]
```

Nie zapisuj surowego toku rozumowania. Zapisuj decyzje, uzasadnienia, zalozenia, ryzyka i dowody wykonania.

---

## Srodowiska - krytyczne

- Dev = lokalne srodowisko deweloperskie.
- Prod = produkcja z prawdziwymi danymi.
- NIGDY nie modyfikuj produkcji bez jawnego polecenia i zatwierdzonego planu.
- NIGDY nie modyfikuj `.env.production`.
- NIGDY nie modyfikuj konfiguracji produkcyjnej bez jawnego polecenia.

---

## Git Safety

- Przed praca sprawdz `git status`.
- Nie cofaj cudzych zmian.
- Nie nadpisuj zmian uzytkownika.
- Modyfikuj minimum niezbednych plikow.
- Nie commituj bez jawnego polecenia uzytkownika.
- Nie pushuj bez jawnego polecenia uzytkownika.
- Na koncu raportuj liste zmienionych plikow.

---

## Styl i UX/UI

Przed kazda zmiana UI przeczytaj:

- `docs/DESIGN_SYSTEM.md`
- `docs/AGENTS_CHECKLIST.md`

Zasady:

- Uzywaj tylko komponentow z istniejacej biblioteki projektu.
- Zero inline styles - wylacznie klasy z design systemu.
- Mobile-first zawsze.
- Dostepnosc obowiazkowa: aria-labels, kontrast, focus states.
- Obsluguj stany loading, error i empty.
- Zachowuj spojnosc z sasiednimi komponentami.

---

## Baza danych i migracje

Przed kazda zmiana DB przeczytaj:

- `docs/DB_CONVENTIONS.md`
- `docs/AGENTS_CHECKLIST.md`

Zasady:

- Kazda zmiana schematu = plik migracji.
- Nigdy nie edytuj schematu bez migracji.
- Format nazwy migracji: `YYYYMMDD_HHMMSS_krotki_opis`.
- Zglos ryzyko migracji w `thoughts`.
- Migracje wykonuj i testuj tylko na Dev.
- Jesli rollback jest mozliwy, opisz go.

---

## Zasady kodu

- Modyfikuj minimum niezbednych plikow.
- Nasladuj istniejace wzorce w projekcie.
- Nie hardcoduj wartosci.
- Obsluguj bledy jawnie.
- Nie zmieniaj architektury bez zatwierdzonego planu.
- Nie dodawaj nowych zaleznosci bez potrzeby i bez uzasadnienia.

---

## Definition of Done

Zadanie jest ukonczone, gdy:

- [ ] Kod dziala zgodnie z zatwierdzonym planem
- [ ] Testy napisane lub zaktualizowane, jesli zadanie tego wymaga
- [ ] Testy przechodza
- [ ] UI zgodne z design systemem, jesli dotyczy
- [ ] Migracja bezpieczna i przetestowana na Dev, jesli dotyczy
- [ ] Brak znanych regresji w istniejacych funkcjach
- [ ] Evidence zapisane w raporcie
- [ ] Plik `thoughts/` zapisany
