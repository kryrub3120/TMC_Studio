# Thoughts — Artefakty pracy agentów TMC Studio

Ten folder zawiera ślady pracy wszystkich agentów GitHub Copilot.

## Struktura

```
thoughts/
└── YYYY-MM-DD/
    ├── HHMM_plan_[slug].md
    ├── HHMM_implementer_[slug].md
    ├── HHMM_implementer_[slug]_iter-1.md   ← tryb LOOP
    ├── HHMM_implementer_[slug]_iter-2.md   ← tryb LOOP
    ├── HHMM_tester_[slug].md
    └── HHMM_loop-summary_[slug].md
```

## Po co to jest?

- **Transparentność** — widzisz jak agent myślał i co robił
- **Debugowanie** — gdy coś pójdzie nie tak, masz pełny ślad
- **Nauka** — możesz analizować decyzje agentów
- **Historia** — dokumentacja tego co i dlaczego zostało zrobione

## Nie commituj tego folderu jeśli nie chcesz

Dodaj do `.gitignore`:
```
thoughts/
```

Lub commituj — to też działa jako dokumentacja projektu.
