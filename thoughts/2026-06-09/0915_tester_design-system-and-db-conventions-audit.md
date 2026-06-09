# Tester — Audyt DESIGN_SYSTEM.md i DB_CONVENTIONS.md
**Data:** 2026-06-09 09:15
**Iteracja:** 1

## Zadanie
Zweryfikować kompletność docs/DESIGN_SYSTEM.md i docs/DB_CONVENTIONS.md z perspektywy agenta który nie widział kodu projektu. Czy może na ich podstawie poprawnie pracować?

## Proces myślenia
1. Wczytalem oba pliki w calosci (~620 linii lacznie)
2. Wcielilem sie w role agenta ktory pierwszy raz widzi projekt - zadaje sobie pytania:
   - "Jakie klasy dać na nowy przycisk?"
   - "Jak zrobic migracje?"
   - "Ktorych komponentow unikac?"
3. Sprawdzilem czy kazda sekcja jest samowystarczalna czy wymaga zewnetrznej wiedzy
4. Zidentyfikowalem konkretne luki

## Co zrobiłem
1. Przeanalizowalem DESIGN_SYSTEM.md pod kątem 3 pytań
2. Przeanalizowalem DB_CONVENTIONS.md pod kątem 3 pytań
3. Utworzylem docs/AGENTS_CHECKLIST.md z checklistami UI i DB

## Napotkane problemy / Luki

### DESIGN_SYSTEM.md — 3 luki

1. **Brak breakpointow** — sekcja 15 mowi "mobile-first" ale nie podaje wartosci: sm(640px), md(768px), lg(1024px), xl(1280px). Agent nie wie kiedy uzyc ktorego.

2. **Focus ring nieprecyzyjny** — sekcja 15 pkt 4 mowi "shadow-accent" ale w kodzie faktycznie jest `focus:ring-2 focus:ring-offset-2`. Rozbieznosc.

3. **Brak "zamiast tego uzyj" dla legacy komponentow** — sekcja 16 mowi ze Button i Toolbar sa legacy, ale nie mowi czym je zastapic. Agent wie czego NIE uzywac, ale nie wie CO uzyc.

### DB_CONVENTIONS.md — 2 drobne luki

1. **Brak informacji jak agent ma zapytac uzytkownika** — sekcja 5 mowi "zapytaj uzytkownika" ale nie precyzuje ze przez `vscode_askQuestions`. Agent moze po prostu napisac w wiadomosci.

2. **Brak przykladu indeksu zlozonego** — tylko pojedyncze kolumny. Czasem potrzebny jest indeks na 2 kolumnach.

## Wynik

### Q1: Poprawnie wybrac klasy CSS dla nowego przycisku? → CZESCIOWO
Brak breakpointow i brak wzorca "jak zrobic nowy przycisk" to 2 konkretne luki.

### Q2: Bezpiecznie stworzyc nowa migracje? → TAK
Tylko 2 drobne luki (jak pytac, composite index) — nie blokuja bezpieczenstwa.

### Q3: Wiedziec ktorych komponentow NIE uzywac? → TAK
Button, Toolbar, RightPanel sa wyraznie oznaczone jako legacy/przestarzale.

## Status DoD
- [x] Analiza DESIGN_SYSTEM.md — 3 pytania, 3 identyfikacje luk
- [x] Analiza DB_CONVENTIONS.md — 3 pytania, 2 identyfikacje luk
- [x] docs/AGENTS_CHECKLIST.md utworzony
- [x] Plik thoughts/ zapisany

## Dla nastepnego agenta
Checklista w docs/AGENTS_CHECKLIST.md gotowa. Uzywaj jej przed kazdym zadaniem UI (Checklist A lub B) i przed kazdym zadaniem DB (Checklist DB).