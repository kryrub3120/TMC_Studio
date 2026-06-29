# S-SITE / S1 REDO — Landing Redesign (hard brief)

**Worktree:** `/Users/krystianrubajczyk/Documents/PROGRAMOWANIE/TMC-site` (branch `feat/site`)
**Dlaczego redo:** poprzedni run zrobił refactor (shared footer, jedna sekcja, tokeny) i dał sobie ACCEPT, ale NIE przeprojektował landingu. Hero, propozycja wartości i jakość wizualna zostały nietknięte. Ten brief ma twarde DoD, których nie da się spełnić sprzątaniem.

## Produkt (kontekst dla copy — nie zgaduj)
TMC Studio = keyboard-fast tablica taktyczna do piłki nożnej. Hero proof-copy: „Draw any football tactic in 30 seconds." Tryb gość bez konta. PLG.
Tiers (prawdziwe limity — użyj ich w sekcji pricing):
- **Guest** — bez konta, 1 projekt, 5 kroków, eksport PNG. Pierwsze wrażenie.
- **Free** — konto, 3 projekty, 10 kroków/projekt, cloud sync, „free forever".
- **Pro** — $9/mc lub $90/rok — unlimited projekty/kroki, eksport GIF + PDF.
- **Team** — $29/mc lub $290/rok — multi-seat, wspólny billing.
Wyróżniki: szybkość (30 s), keyboard-first (Cmd+K paleta + skróty), kroki/animacja, share/export, działa w przeglądarce i na desktopie, sync wszędzie.
Persony: trenerzy, analitycy/twórcy treści, kluby.
Kontekst sezonowy (opcjonalny hook): trwa MŚ 2026 (czerwiec–lipiec) — dozwolony usuwalny ribbon „Built for World Cup season", oznaczony jako seasonal.

## Kierunek wizualny (żeby „ładnie" było mierzalne)
Wzorzec nowoczesnego SaaS (styl Linear/Vercel/Stripe): dużo whitespace, wyraźna skala typografii (hero H1 `text-5xl`→`md:text-7xl`), product-first hero z PRAWDZIWYM UI tablicy, naprzemienne wiersze spotlight (obraz↔tekst), subtelne bordery `border-border`, jeden kolor akcentu `accent`, spójny rytm sekcji (`py-20`/`py-24`). Tylko tokeny z `DESIGN_SYSTEM.md` — zero hex / `text-slate-*` / `text-gray-*`.

## Wymagana struktura strony (góra → dół)
1. **Sticky nav** — logo + linki (Features, Pricing, Download) + primary CTA „Open the board" po prawej; przy scrollu kondensuje się i CTA zostaje widoczne.
2. **Hero (above-fold)** — H1 (proof-copy 30 s), subhead (value-prop), 2 CTA: primary „Open the board — no signup" (→ `/app`), secondary „See plans" (→ `/pricing`); pod CTA linia zaufania „No account needed · Free forever · Browser & desktop". **Hero visual = duży, widoczny, animowany/realny demo tablicy** (zawodnicy + strzałki + kroki) — nie mały boks.
3. **Pasek wiarygodności (NOWE)** — metryki lub 3 krótkie cytaty person. Jeśli brak prawdziwych — oznacz `TODO: real testimonial`.
4. **How it works** — 3 kroki z mini-wizualami: (1) Ustaw zawodników, (2) Narysuj ruch i kroki, (3) Eksportuj/udostępnij. Ikona/ilustracja per krok, nie sam tekst.
5. **Pillars (4)** — Speed/30 s, Kroki & animacja, Everywhere (browser+desktop+sync), Share/export. Copy outcome-focused (korzyść, nie lista funkcji).
6. **Feature spotlight (NOWE, 2–3 naprzemienne wiersze obraz/tekst)** — (a) Keyboard-first (Cmd+K + skróty) z wizualem; (b) Kroki + eksport GIF/PDF z podglądem animacji; (c) Sync everywhere.
7. **Use cases (3 persony)** — Trenerzy / Analitycy-twórcy / Kluby — korzyść szyta per persona + CTA.
8. **Pricing teaser** — 3 karty (Free / Pro $9 / Team $29) z PRAWDZIWYMI limitami powyżej, toggle miesiąc/rok lub link do `/pricing`, „Most popular" na Pro, CTA per karta.
9. **FAQ (NOWE)** — 4–6 Q&A: czy darmowe? konto wymagane? przeglądarka czy desktop? eksport GIF? billing Team?
10. **Final CTA band** — duże „Open the board — no signup" + secondary.
11. **Footer** — istniejący `PublicFooter` (zostaw).

## Twarde DoD (sprint NIE przechodzi, jeśli któreś nie spełnione)
- [ ] Hero visual REALNIE przeprojektowany (duży, animowany/realny demo) — nie stary mały boks.
- [ ] Dodane sekcje: pasek wiarygodności, ≥2 wiersze feature-spotlight, FAQ, final CTA band.
- [ ] Copy hero + pillars + use-cases przepisane na outcome-focused (nie lista funkcji).
- [ ] Primary CTA „Open the board" obecne w: nav (sticky), hero, środku strony, final band.
- [ ] **Above-fold @1440×900:** H1 + subhead + primary CTA + hero visual widoczne bez scrolla — DOWÓD: screenshot.
- [ ] **Responsywność @390 / 768 / 1440 px:** brak poziomego scrolla; na 390 px CTA hero nad zgięciem — DOWÓD: 3 screenshoty before/after per breakpoint.
- [ ] **i18n:** każdy nowy string user-facing w `en/pl/es` (te same klucze), zero hardcoded — DOWÓD: grep parzystości kluczy.
- [ ] **Design system:** zero hex / `text-slate-*` / `text-gray-*` w zmienionych plikach — DOWÓD: grep.
- [ ] **A11y:** jeden `<h1>`, landmarki, alt na wizualach, focus states, kontrast AA.
- [ ] **Performance:** brak CLS od hero (zarezerwowane wymiary), lazy-load mediów poniżej zgięcia; Lighthouse odpalony — DOWÓD: wynik bez czerwonych blockerów perf/a11y (wklejone score).
- [ ] **Scope:** zmiany TYLKO w `apps/web/src/pages/*` + `landing.*` i18n (+ ewent. nowe komponenty w `packages/ui/src` dla sekcji). NIE dotykaj `AppShell`, `PricingModal`, stores, `netlify/functions`, `PricingPage` logiki cyklu.
- [ ] **Wersja:** `feat/site` jest już na `0.9.0` — NIE bumpuj ponownie, tylko rozszerz wpis `[0.9.0]` w CHANGELOG.
- [ ] typecheck zielony dla zmienionych pakietów (jeśli środowisko nie buduje workspace — udokumentuj i pokaż, że błędy są pre-existing w nietkniętych plikach).

## Definition of NOT done (MasterVerifier MUSI odrzucić, jeśli zachodzi)
- Hero visual = stary boks / placeholder bez zmian.
- Brak nowych sekcji spotlight / FAQ / credibility — czyli „dodałem jedną sekcję i podmieniłem footer".
- Brak screenshotów (3 breakpointy) i wyniku Lighthouse w `thoughts/`.
- Copy nieprzepisane (te same stringi co przed sprintem).
- Jakikolwiek hardcoded kolor w zmienionych plikach.
- Dotknięte pliki spoza scope.

## Evidence wymagane w thoughts/
Delivery Evidence + Tester Evidence muszą zawierać: listę nowych/zmienionych sekcji, before/after screenshoty @390/768/1440, wynik Lighthouse (perf+a11y), grep parzystości i18n (en=pl=es), grep braku hardcoded kolorów, potwierdzenie scope (lista zmienionych plików = tylko pages/* + locales + ewent. nowe komponenty ui).

## Skille
ui-delivery, design-system-review, docs-update. (regression-testing jeśli dotkniesz wspólnych komponentów ui.)
