# Glowne Zasady Pracy dla GitHub Copilot - TMC Studio

Zanim wygenerujesz jakikolwiek kod lub zaproponujesz zmiany, MUSISZ przeczytac i zastosowac reguly architektoniczne i behawioralne z:

`docs/SYSTEM_ARCHITECTURE.md`

Szczegolnie wazna jest sekcja 11 - Hard Rules.

Projekt jest w fazie MVP. Obowiazuje scisly podzial na srodowisko Dev lokalne i Prod produkcyjne.

---

## Workflow

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

`@Implementer` i `@Tester` sa dostepne jako tryb reczny, gdy uzytkownik chce miec osobna kontrole nad implementacja i testowaniem.

---

## Plan Approval Gate

Agent `Plan` jest agentem systemowym Copilota i nie jest modyfikowany.

Kazdy plan przed przekazaniem do `Delivery` musi zawierac:

- Cel zadania
- Zakres zmian
- Poza zakresem
- Kryteria akceptacji
- Ryzyka
- Pliki lub obszary prawdopodobnie dotkniete zmiana
- Wymagane testy
- Decyzje uzytkownika: `APPROVE PLAN / CHANGE PLAN / STOP`

`Delivery` moze zaczac prace tylko po jasnym `APPROVE PLAN`.

`Delivery` NIE moze rozszerzyc zatwierdzonego zakresu. Jesli odkryje potrzebe wiekszej zmiany, oznacza ja jako `OUT OF SCOPE` albo `BLOCKER` i raportuje uzytkownikowi.

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
```

Agent zatrzymuje sie, gdy pierwszy limit zostanie osiagniety.

### Zasady LOOP

- Agent NIE pyta uzytkownika miedzy iteracjami.
- Kazda iteracja musi miec osobny plik w `thoughts/`.
- Agent konczy raportem z opcjami: `ACCEPT / LOOP AGAIN / STOP`.
- Gdy uzytkownik odpowie `LOOP AGAIN: [feedback]`, agent kontynuuje od obecnego stanu i traktuje feedback jako dodatkowe kryteria DoD.

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