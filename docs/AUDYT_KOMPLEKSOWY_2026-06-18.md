# Audyt kompleksowy TMC Studio + plan launchu

**Data:** 2026-06-18  
**Wersja aplikacji:** 0.6.1  
**Status dokumentu:** ACTIVE SOURCE OF TRUTH dla prac do publicznego launchu  
**Cel:** doprowadzic aplikacje do bezpiecznego wydania rynkowego, bez dalszego rozdmuchiwania zakresu.

---

## 0. Brutalny werdykt

TMC Studio ma solidny rdzen produktu, ale dotychczasowy plan audytu byl za szeroki. Mieszal krytyczne blokery z pomyslami post-launch, przez co grozil stanem "wiecznie prawie gotowe".

Od teraz filtr jest prosty:

1. Czy to zabezpiecza platnosci, dane uzytkownika albo dostep do subskrypcji?
2. Czy to pomaga nowemu uzytkownikowi stworzyc i wyeksportowac pierwsza taktyke?
3. Czy to pomaga sprzedac Pro/Team bez niejasnosci prawnych i billingowych?
4. Czy to daje nam pomiar, czy produkt faktycznie dziala?

Jesli odpowiedz brzmi "nie", zadanie idzie do backlogu po launchu.

---

## 1. Korekty do poprzedniego audytu

Poprzednia wersja audytu zawierala kilka trafnych punktow, ale tez kilka nieaktualnych lub zbyt ostrych wnioskow. To sa poprawki, ktore obowiazuja w dalszym planie.

| Obszar | Korekta | Decyzja |
|---|---|---|
| Checkout | `create-checkout.ts` faktycznie przyjmuje `userId`, `customerId`, `email`, URL-e i `priceId` z body bez weryfikacji sesji. | **P0. Naprawic przed jakimkolwiek publicznym ruchem.** |
| Portal billingowy | `create-portal-session.ts` juz weryfikuje token Supabase i pobiera `stripe_customer_id` z profilu. | Nie pisac "brak JWT w portalu". Zostaje CORS `*` i walidacja `returnUrl`. |
| CSP/security headers | `netlify.toml` ma CSP i podstawowe security headers. | Nie dodawac od zera. Utwardzic i przetestowac. |
| Autosave | `AutosaveService` ma debounce, dirty flag i statusy. | Nie planowac "dodaj debounce". Planowac testy, konflikty, offline i widocznosc statusu. |
| Onboarding/empty state | `TutorialOverlay`, `EmptyStateOverlay`, `ShortcutsHint`, help sidebar i undo/redo UI juz istnieja. | Nie budowac od zera. Zrobic QA activation flow i poprawki. |
| CI | CI istnieje, ale robi tylko typecheck + build. Brakuje lint/test. | Rozbudowac gate, nie tworzyc pipeline od zera. |
| Pricing yearly | Publiczny pricing i `PricingModal` maja monthly/yearly, ale trzeba zweryfikowac caly przeplyw do checkout. | Sprawdzic spojnosc `/pricing -> modal -> checkout -> webhook`. |
| Free trial | To nie jest P1 przed launch. Bez analytics i bezpiecznego checkoutu trial tylko zwiekszy chaos. | Decyzja po becie, na podstawie danych. |
| Desktop/Tauri | Desktop jest wartosciowy, ale nie blokuje web launch. | Przeniesione do post-launch 2-3 miesiace. |
| Widoki boiska | 3D/skos dla boisk nie spelnia standardu taktycznego i deformuje prace trenera. | **Usuniete z aktywnego zakresu.** Zostaja: cale boisko, polowa, pole karne. Regiony sa plaskimi cropami realnego boiska. |

---

## 2. Aktywny zestaw dokumentow

### Czytaj w tej kolejnosci

1. `docs/AUDYT_KOMPLEKSOWY_2026-06-18.md` - ten dokument, aktualny plan launchu.
2. `tasks/NEXT_TASK.md` - najblizszy krok operacyjny.
3. `docs/SYSTEM_ARCHITECTURE.md` - architektura i zasady warstw.
4. `docs/ENTITLEMENTS.md` + `apps/web/src/lib/entitlements.ts` - plany, limity, gating.
5. `docs/SITE_ARCHITECTURE.md`, `docs/WEBSITE_LAUNCH_PLAN.md`, `docs/STRIPE_TAX_SETUP.md` - kontekst marketingowo-prawno-billingowy.
6. `docs/DESIGN_SYSTEM.md`, `docs/UX_PATTERNS.md`, `docs/COMMANDS_MAP.md` - zasady UI/UX.
7. `docs/FEATURE_SPEC.md` - zachowanie funkcji, w tym aktualne presety boiska.

### Zarchiwizowane jako historyczne

Te pliki nie sa juz aktywnym planem:

- `docs/archive/planning/PLAN_BRAKUJACYCH_FUNKCJI_2026-06-10_SUPERSEDED.md`
- `docs/archive/planning/PRE_LAUNCH_AUDIT_AND_FIX_PLAN_2026-02-09_SUPERSEDED.md`
- `docs/archive/planning/DOCUMENTATION_CLEANUP_PLAN_2026-06-12_DONE.md`
- `tasks/archive/WEBSITE_LAUNCH_SPRINT_PLAN_2026-06-15_SUPERSEDED.md`
- `tasks/archive/UI_UX_PLAN_EXPANDED_2026-06-17_SUPERSEDED.md`

Jesli archiwum mowi cos sprzecznego z tym dokumentem, wygrywa ten dokument.

---

## 3. Cel rynkowy

### Co wypuszczamy

Webowa aplikacja TMC Studio na `tmcstudio.app`, ktora pozwala trenerowi:

1. Wejsc bez tarcia w trybie guest/free.
2. Stworzyc taktyke w czasie ponizej 60 sekund.
3. Zrozumiec podstawowe skroty i akcje bez czytania dokumentacji.
4. Wyeksportowac obraz/animacje zgodnie z limitem planu.
5. Bezpiecznie przejsc na Pro albo Team przez Stripe.
6. Zarzadzac subskrypcja przez Customer Portal.

### Aktualny zakres boisk

Przed launchem utrzymujemy tylko trzy widoki boiska:

1. **Cale boisko** - pelne 105 m x 68 m.
2. **Polowa** - plaski crop realnego boiska: pelna szerokosc, 64 m od linii bramkowej, linia polowy i pelne kolo srodkowe widoczne jak dalsza czesc boiska.
3. **Pole karne** - plaski crop realnego boiska: pelna szerokosc, 43 m od linii bramkowej, bez kola srodkowego.

Zasady:

- Nie wracamy do presetow 3D/skos przed launchem.
- Nie rysujemy sztucznej linii zamykajacej crop poza realnymi liniami boiska.
- Linie boczne i oznaczenia musza byc proporcjonalne do pelnego boiska.
- Zmiana boiska resetuje aktualny rysunek po potwierdzeniu.

### Definicja launch-ready

Produkt jest gotowy do publicznego launchu dopiero gdy:

- Checkout wymaga aktywnej sesji Supabase i nie ufa `userId/customerId/email` z body.
- CORS i URL-e redirectow sa allowlistowane.
- Webhook Stripe jest idempotentny i przetestowany na podstawowych eventach.
- CI blokuje PR przy failu lint/typecheck/test/build.
- Istnieje minimum testow: core, billing functions, jeden E2E golden path.
- Landing i pricing jasno komunikuja wartosc, limity i cene.
- Legal/cookie/VAT komunikacja nie ma oczywistych luk UE.
- Analytics mierzy aktywacje i checkout.
- Beta QA na 10-20 osobach nie pokazuje blockerow.

---

## 4. Najwieksze ryzyka

### P0 - blokery przed publicznym ruchem

1. **Nieautoryzowany checkout.**  
   `create-checkout.ts` musi pobierac usera z tokenu, a nie z body.

2. **CORS `*` na funkcjach billingowych.**  
   Funkcje musza akceptowac tylko produkcyjne domeny, preview i localhost dev.

3. **Niespojnosc Stripe config.**  
   Price IDs sa zdublowane w backendzie, web configu i `PricingModal`. Komentarze mieszaja LIVE/TEST. To trzeba uporzadkowac przed sprzedaza.

4. **Brak testow funkcji billingowych.**  
   Checkout, portal i webhook nie moga byc recznie "klikane na wiare".

### P1 - ryzyka blokujace dobra bete

1. CI nie odpala `pnpm lint` ani `pnpm test`.
2. Root `package.json` nie ma jasnego `test` pipeline dla repo.
3. Lista projektow robi `select('*')` bez paginacji i pobiera potencjalnie ciezki `document`.
4. Brak jednego E2E golden path.
5. Landing/pricing nadal wymagaja finalnej weryfikacji sprzedazowej, prawnej i trackingowej.

### P2 - wazne, ale nie blokuje pierwszego launchu

1. Sentry i strukturalne logi.
2. Bundle analysis i lazy loading eksportow.
3. Distributed rate limit przez Redis/Upstash.
4. Soft delete/trash.
5. Realtime collaboration, marketplace, desktop, SSO, referral.

---

## 5. Sprint plan do launchu

Zakladana kolejnosc jest sekwencyjna. Nie przeskakujemy do landing polish przed zamknieciem checkout security.

### Sprint 0 - Porzadek dokumentow i jedna mapa prac

**Status:** wykonany w ramach aktualizacji tego dokumentu.

**Cel:** usunac konflikt zrodel prawdy.

**Zakres:**

1. Skorygowac audyt i usunac nieaktualne twierdzenia.
2. Przeniesc stare plany do `docs/archive/planning/` i `tasks/archive/`.
3. Ustawic ten dokument jako aktywny plan.
4. Zaktualizowac `docs/INDEX.md` i `tasks/NEXT_TASK.md`.

**Definition of Done:**

- W root `docs/` nie ma starych aktywnych planow sprintow A-G.
- `tasks/NEXT_TASK.md` wskazuje Sprint 1.
- Archiwum zachowuje historie, ale nie konkuruje z planem launchu.

---

### Sprint 1 - Security & Billing Hardening

**Priorytet:** P0  
**Szacunek:** 2-3 dni  
**Cel:** platnosc i subskrypcja nie moga opierac sie na danych zaufanych z klienta.

#### 1.1. Wspolny helper CORS

**Pliki:**

- `netlify/functions/_cors.ts`
- `netlify/functions/create-checkout.ts`
- `netlify/functions/create-portal-session.ts`

**Kroki:**

1. Dodac allowliste originow:
   - `https://tmcstudio.app`
   - `https://www.tmcstudio.app`
   - Netlify deploy previews przez env, np. `ALLOWED_ORIGINS`
   - `http://localhost:5173`, `http://localhost:8888` tylko dev
2. Zwracac `Vary: Origin`.
3. Dla niedozwolonego originu zwracac 403 albo brak CORS.
4. `Access-Control-Allow-Headers` musi zawierac `Authorization`.
5. Usunac `Access-Control-Allow-Origin: '*'` z checkout i portalu.

**Akceptacja:**

- Request z `https://tmcstudio.app` przechodzi.
- Request z obcej domeny nie dostaje pozwolenia CORS.
- OPTIONS dziala dla autoryzowanych originow.

#### 1.2. Wspolny helper auth

**Pliki:**

- `netlify/functions/_auth.ts`
- `netlify/functions/create-checkout.ts`
- `netlify/functions/create-portal-session.ts`

**Kroki:**

1. Odczytac `Authorization: Bearer <token>`.
2. Zweryfikowac token przez Supabase `auth.getUser(token)` albo przez `SUPABASE_JWT_SECRET`.
3. Zwrocic `user.id` i `user.email`.
4. Dla checkout wymagac zalogowanego usera.
5. Nie przyjmowac `userId` z body jako zrodla prawdy.

**Akceptacja:**

- Brak tokenu = 401.
- Wygasly/niepoprawny token = 401.
- Body z cudzym `userId` nie ma zadnego efektu.

#### 1.3. Naprawa `create-checkout`

**Kroki:**

1. `client_reference_id` ustawic z `authUser.id`.
2. `customer_email` ustawic z `authUser.email` albo profilu, nie z body.
3. `customerId` pobrac z `profiles.stripe_customer_id`, nie z body.
4. `priceId` sprawdzic przeciw allowliscie backendowej.
5. `successUrl` i `cancelUrl` sprawdzic przez allowliste originow. Najlepiej przyjmowac tylko path albo generowac URL server-side.
6. Dodac `metadata.user_id`, `metadata.plan`, `metadata.billing_cycle`.
7. Jesli plan Team wymaga osobnej logiki organizacji, nie aktywowac ukrytego team sharingu bez QA.

**Akceptacja:**

- User Pro monthly tworzy Checkout z poprawnym priceId i `client_reference_id`.
- Nie da sie podmienic `customerId`.
- Nie da sie wyslac sukces/cancel na obca domene.
- Nieznany `priceId` = 400.

#### 1.4. Utwardzenie `create-portal-session`

**Kroki:**

1. Zostawic weryfikacje tokenu.
2. Przeniesc CORS do helpera.
3. Walidowac `returnUrl`; najlepiej przyjmowac tylko dozwolony path.
4. Dla braku `stripe_customer_id` zwracac jasny blad i event log.

**Akceptacja:**

- Portal otwiera sie tylko dla wlasciciela `stripe_customer_id`.
- `returnUrl` nie moze byc obca domena.

#### 1.5. Porzadek Stripe config

**Kroki:**

1. Ustalic, czy obecne price IDs sa test czy live.
2. Usunac sprzeczne komentarze.
3. Zrobic jedno zrodlo prawdy dla frontend/backend albo generator/test spojnosc.
4. Dodac test, ktory porownuje Price IDs uzywane w `PricingModal`, `apps/web/src/config/stripe.ts` i `netlify/functions/_stripeConfig.ts`.
5. Stripe API version przeniesc do jednego const/env i potwierdzic stabilna wersje.

**Akceptacja:**

- Nie ma sprzecznych komentarzy LIVE/TEST.
- Test failuje przy rozjechaniu price IDs.

#### 1.6. Testy billing functions

**Kroki:**

1. Test checkout bez tokenu.
2. Test checkout z nieznanym priceId.
3. Test checkout ignoruje cudzy `userId/customerId`.
4. Test portal bez tokenu.
5. Test portal pobiera customer z profilu.
6. Test webhook duplicate event.

**Definition of Done Sprint 1:**

- Checkout i portal nie maja CORS `*`.
- Checkout nie ufa `userId/customerId/email` z body.
- Price IDs sa zweryfikowane.
- Testy billing functions przechodza lokalnie.

---

### Sprint 2 - Quality Gate i testy minimalne

**Priorytet:** P1  
**Szacunek:** 2 dni  
**Cel:** kazda zmiana przed launchem ma przechodzic przez automatyczna bramke.

#### 2.1. Root test pipeline

**Kroki:**

1. Dodac `test` w root `package.json`, np. `turbo run test`.
2. Dodac `test` w pakietach, ktore maja testy albo powinny miec testy.
3. Dla `@tmc/core` dodac Vitest albo najprostszy test runner zgodny z repo.
4. Zaktualizowac `turbo.json`, jesli potrzeba.

#### 2.2. CI

**Kroki:**

1. W `.github/workflows/ci.yml` dodac `pnpm lint`.
2. Dodac job `test`.
3. Zostawic `typecheck` i `build`.
4. Uzyc `pnpm install --frozen-lockfile`, jesli lockfile jest stabilny.
5. Ustawic Node zgodnie z produkcja albo repo (`20` vs `24`) i usunac rozjazd.

#### 2.3. Core tests

**Zakres minimalny:**

1. `createDefaultDocument`.
2. Serializacja/deserializacja board state.
3. Step transitions.
4. Arrow numbering albo operacje elementow, ktore sa najbardziej ryzykowne.

#### 2.4. Golden path E2E

**Jeden test, nie cala armia:**

1. Otworz `/app`.
2. Dodaj zawodnika.
3. Dodaj strzalke.
4. Dodaj krok.
5. Eksport PNG.
6. Otworz pricing modal.

**Definition of Done Sprint 2:**

- `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build` przechodza lokalnie.
- CI odpala lint/test/typecheck/build.
- Jest jeden E2E golden path albo przynajmniej smoke test z Playwright.

---

### Sprint 3 - Pricing, monetizacja i komunikacja wartosci

**Priorytet:** P1  
**Szacunek:** 2-3 dni  
**Cel:** uzytkownik rozumie, za co placi, a checkout odpowiada temu, co widzi.

#### 3.1. Spojnosc `/pricing -> PricingModal -> Checkout`

**Kroki:**

1. Klik z `/pricing` powinien otwierac konkretny plan i cykl, nie tylko `/app?upgrade=pro`.
2. Jesli user wybiera yearly na stronie, modal/checkout ma zachowac yearly.
3. Jesli nie potrafimy przeniesc cyklu bezpiecznie, usuwamy yearly toggle z publicznej strony do czasu fixu.
4. Wszystkie ceny i plany ida przez jedno zrodlo prawdy.

#### 3.2. Team plan

**Kroki:**

1. Dodac sekcje "Dla klubow i sztabow".
2. Pokazac prosty kalkulator: 5 x Pro = $45/mo, Team = $29/mo, oszczednosc $16/mo.
3. Nie obiecywac shared library, jesli `canShareProjects` jest false albo feature nie jest gotowy.
4. Komunikowac realna wartosc: seats, invites, wspolna organizacja, billing.

#### 3.3. Annual discount

**Kroki:**

1. Badge "Save 17%" przy yearly.
2. Domyslnie monthly albo yearly - decyzja po szybkim review UX. Rekomendacja: monthly jako mniej ryzykowne, yearly wyraznie premiowane.
3. Brak fake urgency.

#### 3.4. Trial

**Decyzja:** nie wdrazac przed launchem.

**Warunek powrotu do tematu:**

- mamy analytics aktywacji,
- wiemy, jaki procent userow robi first export,
- checkout security jest zamkniety,
- email/lifecycle jest gotowy przynajmniej na trial ending.

**Definition of Done Sprint 3:**

- Pricing nie obiecuje funkcji, ktorych nie ma.
- Wybrany cykl billingowy zgadza sie z checkout.
- Team plan ma jasna wartosc biznesowa.
- Wszystkie user-facing teksty sa w i18n.

---

### Sprint 4 - Activation UX: pierwsza taktyka i pierwszy eksport

**Priorytet:** P1  
**Szacunek:** 3-5 dni  
**Cel:** nowy uzytkownik ma dojsc do pierwszego eksportu bez pomocy.

#### 4.1. QA first-run flow

**Scenariusz:**

1. Czysta przegladarka.
2. `/app` jako guest.
3. Pojawia sie empty state albo gotowy start, nie chaotyczny canvas.
4. Tutorial prowadzi przez realne elementy UI.
5. Uzytkownik dodaje zawodnika, strzalke, krok i eksportuje.

**Kroki:**

1. Sprawdzic `TutorialOverlay` po aktualnym UI.
2. Naprawic `data-tour` dla TopBar, Inspector, export, help.
3. Sprawdzic `EmptyStateOverlay`: czy CTA sa jednoznaczne i nie zaslaniaja pracy.
4. Sprawdzic `ShortcutsHint`: czy nie dubluje tutoriala.

#### 4.2. Eksport

**Kroki:**

1. Dodac progress indicator dla GIF/PDF, jesli eksport trwa zauważalnie.
2. Pokazac blad eksportu jako zrozumialy toast/modal.
3. Sprawdzic watermark Guest/Free.
4. Sprawdzic gating GIF/PDF Pro+.

#### 4.3. Save status

**Kroki:**

1. Sprawdzic, czy status "saving/saved/unsaved/error" jest widoczny w naturalnym miejscu.
2. Dodac test lub QA scenariusz: offline/error -> status error -> retry.
3. Sprawdzic, czy autosave nie traci danych po refreshu.

#### 4.4. Minimum mobile/tablet

**Kroki:**

1. Touch drag dziala.
2. Undo/redo sa dostepne bez klawiatury.
3. Bottom controls nie zaslaniaja canvasa.
4. Pricing modal i auth modal mieszcza sie na mobile.

**Definition of Done Sprint 4:**

- Osoba spoza projektu robi pierwszy eksport bez instrukcji od nas.
- Tutorial nie wskazuje pustych/martwych elementow.
- Export i save status maja feedback.
- Mobile nie ma blockerow layoutu.

---

### Sprint 5 - Landing, legal, SEO i tracking

**Priorytet:** P1  
**Szacunek:** 4-5 dni  
**Cel:** strona sprzedaje, tlumaczy produkt i spelnia minimum prawne.

#### 5.1. Landing

**Kroki:**

1. Hero z realnym obrazem/video produktu, nie abstrakcyjnym placeholderem.
2. H1: "Draw any tactic in 30 seconds" / polski odpowiednik w i18n.
3. 3 kroki: formation -> arrows -> export.
4. Use cases: coach, creator, club.
5. Pricing teaser.
6. FAQ.
7. Linki prawne w stopce.
8. Zero falszywych testimoniali. Jesli nie mamy prawdziwych, nie udajemy.

#### 5.2. Legal / EU

**Kroki:**

1. Przejrzec `/privacy`, `/terms`, `/cookies`, `/refunds`, `/legal`, `/accessibility`.
2. Oznaczyc tresci wymagajace prawnika jako `TODO: legal review`.
3. Cookie banner: accept/reject, brak pre-zaznaczen, mozliwosc zmiany.
4. Stripe Tax/VAT komunikacja: ceny i VAT copy zgodne ze stanem faktycznym.

#### 5.3. SEO

**Kroki:**

1. Title/meta per strona.
2. OG image.
3. Sitemap i robots.
4. FAQ structured data na pricing/landing, jesli tresc jest stabilna.
5. Sprawdzic, czy client-side i18n nie psuje indeksacji najwazniejszych stron.

#### 5.4. Analytics

**Eventy minimalne:**

- `landing_view`
- `open_board`
- `first_element_added`
- `first_step_added`
- `first_export`
- `pricing_view`
- `upgrade_clicked`
- `checkout_started`
- `checkout_completed`
- `limit_hit`

**Metryka glowna:** time-to-first-export.

**Definition of Done Sprint 5:**

- Landing i pricing maja kompletna tresc w EN/PL/ES.
- Legal pages sa podlinkowane i oznaczone do review.
- Analytics mierzy activation + checkout.
- Lighthouse perf/a11y nie pokazuje czerwonych blockerow.

---

### Sprint 6 - Data, performance i observability

**Priorytet:** P1/P2  
**Szacunek:** 3-5 dni  
**Cel:** produkt nie wywraca sie przy pierwszych aktywnych userach, a bledy sa widoczne.

#### 6.1. Projekty i DB

**Kroki:**

1. Zmienic liste projektow z `select('*')` na konkretne pola.
2. Dodac paginacje/cursor dla listy projektow.
3. Upewnic sie, ze pojedynczy projekt nadal pobiera pelny `document`.
4. Dodac indeks `project_shares(shared_with_email)`, jesli flow invite tego potrzebuje.
5. Nie dodawac GIN JSONB, dopoki nie ma realnego search po dokumencie.

#### 6.2. Bundle/performance

**Kroki:**

1. Odpalic bundle analyzer.
2. Lazy-load ciezkie eksporty GIF/PDF, jesli sa w glownym bundle.
3. Upewnic sie, ze landing nie laduje edytora/Konvy.
4. Sprawdzic mobile performance.

#### 6.3. Observability

**Kroki:**

1. Dodac Sentry albo minimalny error tracking dla web.
2. Dodac error tracking/log context dla Netlify Functions.
3. Webhook failure powinien byc widoczny i mozliwy do zdiagnozowania.
4. Ustalic prosty proces: co robimy, gdy webhook failuje.

**Definition of Done Sprint 6:**

- Lista projektow nie pobiera pelnego dokumentu.
- Bundle report istnieje i najwieksze problemy sa opisane.
- Runtime errors i webhook errors nie sa ciche.

---

### Sprint 7 - Beta launch gate

**Priorytet:** P1  
**Szacunek:** 3 dni + czas feedbacku  
**Cel:** sprawdzic produkt z prawdziwymi uzytkownikami przed publicznym ogloszeniem.

#### 7.1. QA matrix

**Scenariusze:**

1. Guest -> first tactic -> PNG export.
2. Free signup -> cloud save -> reload -> project restored.
3. Free limit -> upgrade prompt.
4. Pro checkout monthly.
5. Pro checkout yearly.
6. Team checkout monthly.
7. Customer Portal cancel.
8. Webhook duplicate.
9. Mobile/tablet first tactic.
10. Language switch EN/PL/ES.

#### 7.2. Beta users

**Zakres:**

- 10-20 osob: trenerzy, analitycy, creatorzy.
- Zadanie dla bety: zrobic jedna realna taktyke i wyeksportowac.
- Zebrac: co bylo niezrozumiale, gdzie utkneli, czy zaplaciliby za Pro/Team.

#### 7.3. Gate decision

**Launch allowed, jesli:**

- Brak P0/P1 bugow.
- Checkout i webhook zielone.
- First export jest osiagalny bez naszej pomocy.
- Legal/cookie/VAT nie maja znanych czerwonych flag.
- Mamy podstawowy monitoring.

**Launch blocked, jesli:**

- Platnosc moze przypisac subskrypcje do zlego usera.
- Dane projektu znikaja lub mieszaja sie miedzy userami.
- Export nie dziala stabilnie.
- Pricing obiecuje nieistniejace funkcje.

---

### Sprint 8 - Public launch

**Priorytet:** P1  
**Szacunek:** 1-2 dni  
**Cel:** kontrolowane wypuszczenie na rynek.

**Kroki:**

1. Zamrozic scope.
2. Oznaczyc release version.
3. Sprawdzic env produkcyjne: Supabase, Stripe, Netlify, domain, redirects.
4. Sprawdzic live checkout malym zakupem.
5. Opublikowac landing.
6. Wyslac pierwsza komunikacje do listy/bety.
7. Monitorowac error tracking, webhook events, checkout conversion.
8. Po 24h zrobic review: bledy, aktywacje, feedback.

**Definition of Done:**

- Publiczna strona dziala.
- Pierwszy prawdziwy zakup przechodzi.
- Wiemy, co naprawiamy w pierwszym patchu.

---

## 6. Backlog po launchu

Te rzeczy sa dobre, ale nie wolno nimi blokowac launchu:

1. Desktop Tauri offline-first + auto-update.
2. Templates marketplace.
3. Realtime collaboration.
4. Referral/affiliate.
5. Edu/Club enterprise pricing.
6. SSO/SAML.
7. Public profiles/portfolio trenerow.
8. Advanced analytics dla Team.
9. Soft delete/trash.
10. Full-text search i GIN JSONB.
11. Redis/Upstash distributed rate limiting.
12. Trial Pro + lifecycle emails.
13. Localized pricing PLN/EUR z pelnym VAT UX.

---

## 7. Kolejnosc najblizszych prac

Najblizsze prace wykonujemy w tej kolejnosci:

1. **Sprint 1.1-1.3:** CORS/auth/checkout.
2. **Sprint 1.4-1.6:** portal, Stripe config, testy billing.
3. **Sprint 2:** CI + root tests + core tests + E2E smoke.
4. **Sprint 3:** pricing spojnosc, Team value, annual badge.
5. **Sprint 4:** activation UX QA i poprawki.
6. **Sprint 5:** landing/legal/SEO/analytics.
7. **Sprint 6:** data/performance/observability.
8. **Sprint 7:** beta gate.
9. **Sprint 8:** public launch.

---

## 8. Immediate prompt dla kolejnego wykonania

```text
Wykonaj Sprint 1 z docs/AUDYT_KOMPLEKSOWY_2026-06-18.md.

Cel: security & billing hardening.

Zakres:
1. Dodaj wspolny helper CORS dla Netlify Functions.
2. Dodaj wspolny helper auth dla funkcji wymagajacych sesji.
3. Napraw create-checkout tak, aby nie ufal userId/customerId/email/successUrl/cancelUrl z body.
4. Utwardz create-portal-session: CORS allowlist + returnUrl allowlist.
5. Uporzadkuj Stripe price config i dodaj test spojnosc price IDs.
6. Dodaj testy billing functions.

Nie ruszaj desktopu, marketplace, realtime ani triala.
Po implementacji uruchom lint/test/typecheck/build w zakresie, ktory istnieje.
```
