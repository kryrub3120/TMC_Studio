# Delivery — Honest evaluation and restructure of implementation plan
**Data:** 2026-06-10 17:00
**Iteracja:** final (po code review usera)

## Zadanie
Ocenić plan implementacji krytycznie i zrestrukturyzować go.

## Co zrobiłem
1. Zidentyfikowałem 6 błędów w poprzednim planie:
   - Błąd #1: `toggleAutoNumbering` warunek — `!current && !newVal` zamiast `!current && newVal`
   - Błąd #2: Transformer — plan sam sobie przeczy (nodeRefMap → findOne, bez potwierdzenia)
   - Błąd #3: Podwójny pushHistory w deleteSelected + renumberAllArrows
   - Błąd #4: fetch(dataURL).blob() zamiast toBlob()
   - Błąd #5: Zła ścieżka dynamic importu w Autosave
   - Błąd #6: FAB kalibracji to placeholder, nie funkcja
2. Dodałem jawne [⚠️ UNVERIFIED] oznaczenia dla fragmentów niepotwierdzonych z kodem
3. Zrestrukturyzowałem z 3 sztywnych sprintów na 5 luźnych sprintów (Sprint 0 → D)
4. Dodałem Sprint 0 — sanity check jako warunek wstępny
5. Zmieniłem Transformer na POC-first: najpierw TextNode, potem expand
6. Poprawiłem pushHistory — NIE wołamy go z renumberAllArrows, tylko z deleteSelected
7. Dodałem disclaimer otwartości — plan przyznaje gdzie nie ma pewności

## Wynik
- docs/IMPLEMENTATION_PLAN_SPRINTS.md — zrestrukturyzowany, z jawnymi oznaczeniami niepewności
- 6 błędów naprawionych lub oznaczonych jako UNVERIFIED
- Ocena: z 7.5/10 (plany napraw) na bardziej realistyczną