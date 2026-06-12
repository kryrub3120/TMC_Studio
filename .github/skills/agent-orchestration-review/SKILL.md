---
name: agent-orchestration-review
description: Review jakosci pracy MasterAutopilot: Sprint Contracts, skill selection, internal loops, evidence, MasterVerifier i SprintGate przed akceptacja sprintow.
---

# Skill: Agent Orchestration Review

Meta-review automatyzacji agentow. Uzywaj do sprawdzenia, czy MasterAutopilot realnie wykonal proces, a nie tylko opisal sukces.

---

## Kiedy uzywac

- Przed `ACCEPT SPRINT` w pracy MasterAutopilot.
- Po zakonczeniu calego runu wielosprintowego.
- Gdy raport agenta brzmi zbyt ogolnie albo brakuje evidence.
- Gdy user chce ocenic, czy automatyzacja dziala bez recznego przeklejania.

---

## Zawsze przeczytaj najpierw

- `.github/agents/master-autopilot.md`.
- `.github/copilot-instructions.md`.
- `docs/AGENT_ORCHESTRATION.md`.
- Sprint Contract danego sprintu.
- Sprint thoughts: `thoughts/YYYY-MM-DD/*master-autopilot_sprint*`.
- Final summary, jesli istnieje.
- `git diff` aktualnego zakresu.

---

## Core gate

Najwazniejsza zasada:

```text
DeliveryPass result != accepted sprint.
MasterVerifier + SprintGate == accepted sprint.
```

Nie akceptuj sprintu, jesli agent pominal niezalezna weryfikacje albo tylko powtorzyl samoocene DeliveryPass.

---

## Orchestration checklist

- [ ] Istnieje Main Run Brief albo jasny opis glownego planu.
- [ ] Sprint zostal opisany jako Sprint Contract przed implementacja.
- [ ] Sprint Contract ma cel, zakres, poza zakresem, DoD, ryzyka, limit.
- [ ] SkillSelectionPass wybral minimalny zestaw skilli.
- [ ] Agent wskazal, ktore `SKILL.md` przeczytal.
- [ ] DeliveryPass opisal konkretne zmiany i pliki.
- [ ] TesterPass uruchomil testy albo uzasadnil brak automatyzacji.
- [ ] FixPass zostal wykonany, jesli TesterPass/MasterVerifier znalazl problem.
- [ ] MasterVerifier porownal wynik ze Sprint Contract i glownym planem.
- [ ] SprintGate podjal jedna z decyzji: `ACCEPT SPRINT`, `INTERNAL LOOP`, `ASK USER`, `BLOCKED`.
- [ ] `ACCEPT SPRINT` wystapil dopiero po evidence i Master Verification.
- [ ] Thoughts zawieraja decyzje, zalozenia, ryzyka i evidence, nie surowy tok rozumowania.

---

## Anti-patterns

Oznacz jako `INTERNAL LOOP required`, jesli widzisz:

- Agent pisze "SUKCES" bez listy testow.
- Sprint nie ma Sprint Contract.
- SkillSelectionPass wybral wszystkie skille "na wszelki wypadek".
- SkillSelectionPass nie przeczytal wybranych `SKILL.md`.
- MasterVerifier nie odnosi sie do `git diff`.
- Brak jasnego rozroznienia DeliveryPass vs MasterVerifier.
- Agent pyta usera o decyzje techniczna, ktora miesci sie w zakresie sprintu.
- Agent idzie dalej mimo `BLOCKER`.
- Agent rozszerza scope bez `ASK USER`.
- Brakuje `thoughts/` albo evidence jest tylko deklaratywne.

---

## Evidence review

Sprawdz, czy evidence jest konkretne:

- komendy + wyniki,
- zmienione pliki,
- manual checks, jesli UI/canvas,
- grep-checki, jesli review skilli tego wymaga,
- niezweryfikowane obszary z ryzykiem,
- link/sciezka do thoughts.

---

## Expected evidence

- Lista przeczytanych artefaktow.
- Ocena kazdego etapu orkiestracji.
- Braki z severity.
- Decyzja: `ORCHESTRATION PASS` albo `INTERNAL LOOP required`.
- Konkretna lista poprawek dla MasterAutopilot, jesli potrzebna.
