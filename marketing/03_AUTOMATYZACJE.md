# TMC Studio — Plan automatyzacji launchu

_Wersja robocza · 2026-06-22 · do iteracji_

Zasada: **jedna osoba musi to udźwignąć w szczycie MŚ.** Automatyzujemy wszystko, co powtarzalne, najprostszymi narzędziami (priorytet: darmowe plany). Reguła doboru: jeśli coś robisz >2 razy w tygodniu ręcznie — zautomatyzuj albo oszablonuj.

---

## 1. Nadawanie dostępu Pro ambasadorom (półautomat)

Problem: ręczne klikanie po panelu dla każdego ambasadora.

**Najprostsze podejście (zależnie od tego, jak działa Twój billing — masz Stripe + Supabase):**
- **Opcja A — kod kuponowy 100% w Stripe:** wygeneruj jeden kupon „FOUNDER2026" (100% zniżki, ważny do końca 2026) i wyślij ambasadorom link checkout z kuponem. Zero dotykania bazy, Stripe sam zarządza. Najprostsze.
- **Opcja B — flaga w bazie:** dodaj w tabeli profili kolumnę/rolę `is_ambassador` lub ustaw entitlement Pro ręcznie przez panel Supabase. Dobre dla <20 osób.
- **Rekomendacja:** na 15–20 osób użyj **Opcji A** (kupon) — najmniej kodu, najmniej ryzyka przy launchu.

> Uwaga z `LAUNCH_NEXT_STEPS.md`: roczny plan na `/pricing` checkoutuje miesięcznie. Napraw lub zdejmij toggle roczny, zanim ambasadorzy zaczną klikać.

**Co przygotować raz:**
- [ ] Kupon „FOUNDER2026" w Stripe (100%, exp. 31.12.2026)
- [ ] Gotowy link/instrukcja aktywacji do wklejenia w wiadomość onboardingową (`01_` §5f)

---

## 2. Repurposing treści 1 → 3 platformy (największa oszczędność czasu)

Nagrywasz RAZ, publikujesz na IG Reels + TikTok + YouTube Shorts. To mnoży zasięg bez mnożenia pracy.

**Pipeline:**
1. Nagrywasz pionowy klip (9:16) z napisami wypalonymi w treść (działają wszędzie).
2. Eksport raz → wrzucasz do jednego folderu „do publikacji".
3. Narzędzie cross-postuje na 3 platformy.

**Narzędzia (wybierz jedno):**
- **Buffer** — darmowy plan obsługuje IG, TikTok, YT, X; prosty kalendarz. Dobry start.
- **Metricool** — darmowy plan, mocny w analityce + planowaniu Reels/TikTok.
- **Publer / Later** — alternatywy; Later dobry wizualnie pod IG.
- **Rekomendacja:** **Metricool** (darmowy) — planowanie + statystyki w jednym, ważne przy doborze treści do boostu.

**Napisy automatycznie:** CapCut (darmowy) — auto-napisy PL i auto-tłumaczenie na EN w kilka kliknięć. To Twój najważniejszy „automat" contentowy.

---

## 3. Planowanie postów (zero publikacji o północy)

- Raz w tygodniu (np. niedziela wieczór) **zaplanuj cały tydzień** w Metricool/Buffer wg kalendarza z `02_`.
- Dni meczowe: zaplanuj przedmeczowe F3 z wyprzedzeniem; pomeczowe F1 zostaw na „szybkie ręczne" (bo zależą od wyniku).
- Ustaw najlepsze godziny publikacji wg analityki (zwykle 18–21).

**Automatyzacja-przypominajka:** ustaw cykliczne zadanie/alert „zaplanuj treści na nadchodzący tydzień" w niedzielę — żeby nigdy nie zostać z pustym kalendarzem w szczycie.

---

## 4. Autoresponder i obsługa DM (żeby nie utonąć)

W szczycie MŚ posypią się wiadomości. Przygotuj:
- **Szablony szybkich odpowiedzi** (IG/TikTok mają zapisane odpowiedzi):
  - „jak to zrobić?" → link do poradnika 60 s
  - „ile kosztuje?" → „Guest i Free są za darmo na zawsze, Pro gdy potrzebujesz więcej → tmcstudio.app/pricing"
  - „chcę ambasadora" → skrypt kwalifikujący
- **Auto-DM na IG** po komentarzu z danym słowem (np. ktoś pisze „TAKTYKA" pod Reelem → automat wysyła link). Narzędzia: **ManyChat** (darmowy plan) — klasyk do „komentarz → DM z linkiem". Świetne do zamiany zasięgu w wejścia na `/app`.

---

## 5. Tracking referrali i ruchu (wiedz, co działa)

Bez tego boostujesz na ślepo.

- **UTM-y w linkach:** każdy ambasador i każdy kanał dostaje link z tagiem, np.
  `tmcstudio.app/app?utm_source=instagram&utm_medium=ambassador&utm_campaign=ms2026&utm_content=[imie]`
  Generator: Google Campaign URL Builder (darmowy). Trzymaj wzorce w arkuszu.
- **Analityka lejka** (z `WEBSITE_LAUNCH_PLAN.md` §4.5): eventy `landing_view → open_board → first_element_added → first_export → signup → limit_hit → pricing_view → upgrade`. Narzędzie cookie-less/za zgodą: **Plausible** lub **Umami** (lekkie, prywatne, zgodne z banerem opt-in).
- **Kluczowa metryka:** time-to-first-export. Upewnij się, że event `first_export` się pali.
- **Tracker ambasadorów** (Arkusz Google/Notion): kolumny z `01_` §8 + „wejścia z linku" i „opublikował (tak/nie)".

---

## 6. Zbieranie e-maili i sekwencja powitalna

Konta Free złapane podczas MŚ to Twój majątek po turnieju.
- Rejestracja konta = masz e-mail (zgoda marketingowa osobno, zgodnie z RODO — patrz `EU_COMPLIANCE_CHECKLIST.md`).
- **Prosta sekwencja powitalna (3 maile)**, narzędzie: **MailerLite** lub **Brevo** (darmowe do ~1000 kontaktów):
  1. Dzień 0: „Witaj — zrób pierwszą taktykę w 60 s" (link do poradnika)
  2. Dzień 3: „3 skróty, które oszczędzą Ci najwięcej czasu"
  3. Dzień 7: „Kiedy warto przejść na Pro" (bez presji, wartość)
- Po MŚ: 1 mail „best of MŚ 2026 + co nowego".

---

## 7. Stos narzędzi (podsumowanie, prawie wszystko darmowe)

| Funkcja | Narzędzie | Plan | Koszt |
|---|---|---|---|
| Cross-posting + planer | Metricool (lub Buffer) | darmowy | 0 zł |
| Napisy PL→EN, montaż | CapCut | darmowy | 0 zł |
| Komentarz → auto-DM | ManyChat | darmowy | 0 zł |
| Analityka prywatna | Plausible / Umami | self-host/tani | 0–~30 zł |
| UTM | Google URL Builder | darmowy | 0 zł |
| E-mail sekwencje | MailerLite / Brevo | darmowy do 1k | 0 zł |
| Tracker ambasadorów | Arkusze Google / Notion | darmowy | 0 zł |
| Dostęp Pro | kupon Stripe „FOUNDER2026" | — | 0 zł |

Budżet 500 zł zostaje prawie w całości na **boost zwycięskich treści** — narzędzia są darmowe.

---

## 8. Kolejność wdrożenia (1 wieczór konfiguracji)

1. [ ] Kupon „FOUNDER2026" w Stripe (15 min)
2. [ ] Konto Metricool + podpięte IG/TikTok/YT (20 min)
3. [ ] CapCut zainstalowany, test auto-napisów PL→EN (15 min)
4. [ ] Schemat UTM w arkuszu + linki dla pierwszych ambasadorów (15 min)
5. [ ] Sprawdź, że event `first_export` się loguje w analityce (15 min)
6. [ ] ManyChat: 1 reguła „komentarz → DM z linkiem" (20 min)
7. [ ] MailerLite: 3-mailowa sekwencja powitalna (30 min)

Razem ~2 h jednorazowo → oszczędza godziny tygodniowo w szczycie MŚ.
