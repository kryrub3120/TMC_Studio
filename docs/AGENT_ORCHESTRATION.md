# Agent Orchestration - TMC Studio

Dokument opisuje system pracy agentow dla TMC Studio. Sa dwa glowne tryby:

- `Delivery` - pojedyncze male zadanie lub jeden sprint.
- `MasterAutopilot` - duzy plan z wieloma sprintami, wykonywany w jednej sesji bez przeklejania promptow miedzy agentami.

---

## 1. Kiedy uzywac ktorego trybu

| Scenariusz | Uzyj |
|------------|------|
| Pojedyncze male zadanie | `@Delivery` |
| Jeden sprint bez zaleznosci | `@Delivery` |
| Duzy plan S1-SN | `@MasterAutopilot` |
| Chcesz maksymalnej automatyzacji | `@MasterAutopilot` |
| Tylko pytania / eksploracja | `@Ask` albo zwykly chat |
| Tylko reczna implementacja | `@Implementer` |
| Tylko reczne testy | `@Tester` |

`MasterAutopilot` jest preferowany dla wielu sprintow. Nie deleguje do zewnetrznego `@Delivery`; uzywa wewnetrznych passow w jednej sesji.

---

## 2. Delivery - pojedyncze zadanie

Workflow:

```text
Ask -> Plan -> APPROVE PLAN -> Delivery -> User ACCEPT / LOOP AGAIN / STOP
```

Delivery implementuje, testuje i naprawia w petli az do DoD albo limitu. User ocenia raport po zakonczeniu.

---

## 3. Master Autopilot - wiele sprintow

Workflow:

```text
Ask -> Plan -> APPROVE PLAN -> @MasterAutopilot LOOP N sprintow Xproby:
  -> MasterPlanner
  -> Dla kazdego sprintu:
       Sprint Contract
       -> Skill Selection
       -> DeliveryPass
       -> TesterPass
       -> FixPass
       -> MasterVerifier
       -> SprintGate
  -> Final Master Summary
```

Wewnetrzne role:

- `MasterPlanner` - dzieli plan, wykrywa zaleznosci, wybiera kolejnosc.
- `SkillSelectionPass` - wybiera i czyta potrzebne `SKILL.md`.
- `DeliveryPass` - implementuje zakres sprintu.
- `TesterPass` - testuje, szuka edge case'ow i regresji.
- `FixPass` - naprawia problemy wykryte w sprincie.
- `MasterVerifier` - niezaleznie sprawdza wynik.
- `SprintGate` - decyduje: `ACCEPT SPRINT`, `INTERNAL LOOP`, `ASK USER`, `BLOCKED`.

---

## 4. Jak wkleic duzy plan

Przykladowy prompt:

```text
@MasterAutopilot LOOP 6 sprintow 3proby na sprint:
[tu wklejam zatwierdzony glowny plan S1-S6]

Kazdy sprint ma:
- cel,
- zakres,
- kryteria akceptacji,
- przewidywane pliki,
- zaleznosci.
```

Master Autopilot sam:

1. Analizuje plan i potwierdza podzial na sprinty.
2. Wykrywa zaleznosci i konflikty plikow.
3. Dobiera skille per sprint.
4. Czyta wybrane `SKILL.md`.
5. Wykonuje wewnetrzny loop sprintu.
6. Przechodzi do kolejnego sprintu po `ACCEPT SPRINT`.

---

## 5. Skill Selection

Skille sa procedurami kompetencyjnymi, nie agentami.

SkillSelectionPass:

1. Przeglada `.github/skills/*/SKILL.md`.
2. Wybiera minimalny zestaw skilli potrzebny do zakresu sprintu.
3. Czyta pelna tresc kazdego wybranego `SKILL.md`.
4. Stosuje skille jako checklisty i kryteria evidence.
5. Wpisuje wybor do Sprint Contract.

Dostepne skille:

| Skill | Kiedy wybierany |
|-------|-----------------|
| `ui-delivery` | Zmiana UI/React/Tailwind/Konva |
| `design-system-review` | Review zgodnosci UI z design systemem |
| `db-migration` | Migracje Supabase/DB |
| `stripe-qa` | Platnosci, subskrypcje, webhooki Stripe |
| `architecture-review` | Zgodnosc z architektura i Hard Rules |
| `regression-testing` | Testy i regresje |
| `docs-update` | Aktualizacja dokumentacji |
| `ci-debug` | Build/typecheck/lint/CI failures |
| `agent-orchestration-review` | Review jakosci pracy MasterAutopilot |
| `security-privacy-review` | Secrets, auth, RLS, user data, prod safety |
| `release-readiness` | Beta/release readiness po planie |

Nie wybieraj skilla tylko dlatego, ze istnieje. Dobor musi wynikac z zakresu sprintu.

### Wersjonowanie

Przed ACCEPT SPRINT sprawdz, czy sprint wymaga bumpa wersji:

- Nowa funkcja → **MINOR** (`0.5.0` → `0.6.0`).
- Tylko bug fixy → **PATCH** (`0.5.0` → `0.5.1`).
- Bump robiony na WSZYSTKICH `package.json` w monorepo.
- Po bumpie: `CHANGELOG.md` → przenies `[Unreleased]` do nowej sekcji.
- Wersja w Footer jest dynamiczna (import z `package.json`), nie hardcoduj.
- Zobacz `docs/VERSIONING.md` po pelna polityke.

Evidence wersjonowania w MasterVerifier:
- [ ] Wersja w `package.json` (root, apps/web, packages/*) zgodna ze zmiana
- [ ] `CHANGELOG.md` zaktualizowany
- [ ] Footer wyswietla poprawna wersje (dynamiczny import)

Domyslne zasady:

- Po kazdym sprincie z kodem wybierz `regression-testing`.
- Po kazdym sprincie MasterAutopilot wybierz `agent-orchestration-review`.
- Po zmianach auth/DB/Stripe/user data wybierz `security-privacy-review`.
- Po zakonczeniu calego planu wybierz `release-readiness`.

---

## 6. Wewnetrzny loop sprintu

```text
1. Sprint Contract
2. Skill Selection
3. DeliveryPass
4. TesterPass
5. FixPass, jesli trzeba
6. MasterVerifier
7. SprintGate:
   - ACCEPT SPRINT -> nastepny sprint
   - INTERNAL LOOP -> wroc do DeliveryPass/FixPass z konkretna lista poprawek
   - ASK USER -> zatrzymaj i zapytaj
   - BLOCKED -> zakoncz z raportem blokera
```

Loop powtarza sie az do spelnienia DoD albo limitu sprintu.

---

## 7. Kiedy pytac uzytkownika

Master Autopilot pyta uzytkownika tylko gdy:

- trzeba zmienic zakres,
- wystepuje decyzja produktowa,
- wykryto blocker,
- trzeba wykonac akcje produkcyjna,
- ryzyko dotyczy danych, sekretow, platnosci albo produkcji,
- plan jest sprzeczny i nie da sie bezpiecznie wybrac.

Nie pyta:

- miedzy DeliveryPass, TesterPass, FixPass i MasterVerifier,
- o oczywiste decyzje techniczne w zakresie sprintu,
- o poprawki wymagane do spelnienia DoD.

Format pytania:

```text
[MasterAutopilot] Potrzebuje Twojej decyzji.

Sprint: [nazwa]
Problem: [co sie stalo / co jest niejasne]

Opcje:
A) [opcja 1] - [konsekwencja]
B) [opcja 2] - [konsekwencja]

Rekomendacja: [co sugeruje i dlaczego]
```

---

## 8. Evidence wymagane

Od DeliveryPass / TesterPass:

- zmienione pliki,
- decyzje implementacyjne,
- uruchomione komendy i wyniki,
- dodane lub zaktualizowane testy,
- manual checks, jesli potrzebne,
- niesprawdzone obszary z uzasadnieniem.

Od MasterVerifier / SprintGate:

- porownanie z glownym planem,
- porownanie ze Sprint Contract,
- wynik DoD,
- wynik zastosowanych skilli,
- wynik `git diff`,
- decyzja gate'a i uzasadnienie.

---

## 9. Thoughts

Master Autopilot zapisuje:

```text
thoughts/YYYY-MM-DD/HHMM_master-autopilot_run-[slug].md
thoughts/YYYY-MM-DD/HHMM_master-autopilot_sprint-[N]-[slug].md
thoughts/YYYY-MM-DD/HHMM_master-autopilot_summary-[slug].md
```

W thoughts zapisuj decyzje, uzasadnienia, zalozenia, ryzyka i evidence. Nie zapisuj surowego toku rozumowania.

---

## 10. Zasada gate'a

```text
DeliveryPass result != accepted sprint.
MasterVerifier + SprintGate == accepted sprint.
```

DeliveryPass moze uwazac sprint za gotowy. Tylko `MasterVerifier + SprintGate` zatwierdza sprint.

---

## 11. Przyklad: 6 sprintow

```text
@MasterAutopilot LOOP 6 sprintow 3proby na sprint:
[zatwierdzony plan S1-S6]

1. MasterPlanner tworzy podzial i kolejnosc sprintow.
2. S1: Sprint Contract + Skill Selection.
3. DeliveryPass implementuje S1.
4. TesterPass testuje S1.
5. FixPass naprawia znalezione problemy.
6. MasterVerifier znajduje drobny problem -> INTERNAL LOOP.
7. DeliveryPass/FixPass poprawia problem.
8. MasterVerifier + SprintGate -> ACCEPT SPRINT S1.
9. Master Autopilot przechodzi do S2 bez przeklejania promptow.
10. Po S6 zapisuje Final Master Summary.
```

---

## 12. Ryzyka orkiestracji

| Ryzyko | Mitigacja |
|--------|-----------|
| DeliveryPass rozszerza zakres | MasterVerifier sprawdza scope w kazdej iteracji |
| DeliveryPass akceptuje swoj bledny kod | SprintGate ignoruje samoocene DeliveryPass i wymaga Master Verification |
| Sprint zalezy od poprzedniego i cos jest niekompatybilne | MasterPlanner i MasterVerifier sprawdzaja spojnosc miedzy sprintami |
| Uzytkownik nie odpowiada na ASK USER | Master Autopilot konczy jako BLOCKED, nie idzie dalej |
| Passy nie zostawiaja wystarczajacego evidence | SprintGate wymusza INTERNAL LOOP |
| Za dlugi czas wewnetrznej petli | Master Autopilot respektuje limit sprintu i konczy PARTIAL/BLOCKED |
