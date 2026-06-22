# TMC Studio — Plan Go-To-Market (launch)

_Wersja robocza · 2026-06-22 · Autor: cris + Claude · Status: do iteracji_

Dokument-matka. Pozostałe trzy pliki (`01_PROGRAM_AMBASADORSKI`, `02_KALENDARZ_TRESCI_MS`, `03_AUTOMATYZACJE`) są jego rozwinięciem.

---

## 0. TL;DR — co robimy w jednym akapicie

Mamy ~4 tygodnie MŚ 2026 (do 19 lipca) — najgorętszy moment na treści taktyczne w całym 4-letnim cyklu. Wykorzystujemy to jako **rampę startową**: produkt robi dokładnie te grafiki/animacje, których teraz potrzebują twórcy i trenerzy. Strategia opiera się na trzech dźwigniach, które się wzajemnie napędzają: **(1) ambasadorzy** (znajomi trenerzy/twórcy dostają darmowe Pro w zamian za publiczne używanie z watermarkiem), **(2) treści MŚ** (Ty + ambasadorzy zalewacie IG/TikTok analizami robionymi w TMC), **(3) pętla wirusowa** (każdy eksport Guest/Free niesie `tmcstudio.app`). Budżet (≤500 zł/mc) idzie wyłącznie na podbicie najlepszych organicznych trafień. Wszystko, co się da, jest zautomatyzowane, żeby jedna osoba to udźwignęła.

---

## 1. Cel i metryki sukcesu

**Cel nadrzędny launchu (90 dni):** zbudować pierwszą bazę aktywnych użytkowników i 2–3 płacących klientów Pro — ale głównym wskaźnikiem na tym etapie **nie jest przychód**, tylko **aktywacja i dystrybucja**.

### Lejek i metryki (z `WEBSITE_LAUNCH_PLAN.md` §3)

```
Social/Ambasador ─► Landing ─► /app guest (1. taktyka) ─► limit ─► Free (konto) ─► realna potrzeba ─► Pro
        ▲ watermark "made with tmcstudio.app" na eksportach domyka pętlę ◄────────────────────────────┘
```

| Poziom | Metryka | Cel 30 dni | Cel 90 dni |
|---|---|---|---|
| Świadomość | Wyświetlenia treści (IG+TikTok łącznie) | 50 000 | 300 000 |
| Pozyskanie | Wejścia na `/app` | 1 000 | 6 000 |
| **Aktywacja** | **% gości robiących 1. eksport (time-to-first-export)** | mierzyć | poprawiać |
| Rejestracja | Konta Free | 150 | 800 |
| Przychód | Subskrypcje Pro | 2–3 | 15–25 |
| Wirusowość | Eksporty z watermarkiem opublikowane | 50 | 400 |

> Kluczowa metryka produktu to **time-to-first-export** — musi potwierdzać obietnicę „30 sekund". Jeśli goście nie eksportują, problem jest w onboardingu, nie w marketingu.

### Czego NIE optymalizujemy (zgodnie z `PRODUCT_PHILOSOPHY.md`)
Nie ścigamy konwersji za wszelką cenę, nie robimy fałszywej pilności, nie chowamy planu Free. Ambasadorzy i treści mają *budować zaufanie*, nie naciskać.

---

## 2. Pozycjonowanie (oś każdego komunikatu)

**Obietnica:** „Narysuj dowolną taktykę w 30 sekund. Wszystko pod ręką, z każdego urządzenia."

Cztery filary-dowody (powtarzają się w każdej treści i rozmowie z ambasadorem):

| Filar | Komunikat | Dowód |
|---|---|---|
| ⚡ Szybkość | Pomysł → gotowa taktyka w 30 s | Formacje `1-6`, zawodnik `P`, piłka `B`, strzałka `A` |
| ⌨️ Minimum kroków | Zero klikania po menu | Skróty na wszystko + Command Palette `Cmd/Ctrl+K` |
| 🌍 Każde urządzenie | Przeglądarka + desktop, sync | Web + Tauri (mac/Win), cloud sync, offline-first |
| 🎬 Gotowe do udostępnienia | Eksport jednym skrótem | PNG/GIF/PDF/SVG, animacje krok-po-kroku |

**Jednozdaniowy pitch (do DM, bio, opisów):**
> „TMC Studio to klawiaturowa tablica taktyczna — narysujesz i wyeksportujesz animację taktyki szybciej, niż zrobisz to w PowerPoincie. Działa w przeglądarce, bez instalacji."

---

## 3. Persony i kolejność uderzenia

Decyzja z briefu: **PL teraz, EN/ES równolegle** (treści MŚ od razu z angielskimi napisami dla zasięgu). Kolejność priorytetów:

### Priorytet 1 — Twórcy treści taktycznych (motor wzrostu)
To oni dają dystrybucję. Każda ich animacja z watermarkiem to reklama. Tu trafia większość energii ambasadorskiej.
- *Gdzie żyją:* IG Reels, TikTok, YouTube Shorts, X/Twitter (tactics twitter).
- *Czego chcą:* szybko robić ładne, czytelne animacje ruchu; wyróżnić się jakością.
- *Hak:* „Przestań robić strzałki w Canvie. To samo masz w 20 sekund."

### Priorytet 2 — Trenerzy / analitycy (Twoja sieć = pierwsi ambasadorzy)
Twoi znajomi trenerzy. Dają wiarygodność („używa tego prawdziwy trener z X") i feedback produktowy.
- *Gdzie:* prywatne kontakty, grupy trenerskie na FB/WhatsApp, kursy UEFA.
- *Czego chcą:* szybko przygotować jednostkę treningową, wydrukować PDF, pokazać zespołowi.
- *Hak:* „Przygotuj odprawę zanim zagotuje się woda na herbatę."

### Priorytet 3 — Hobbyści / kibice taktyczni (masa, viral fuel)
Najłatwiejsza konwersja na guest/Free, napędzają zasięgi w komentarzach podczas MŚ.
- *Hak:* „Otwórz. Narysuj. Bez konta."

### Później — Kluby/sztaby (plan Team)
Sprzedaż 1:1, nie teraz. Zbieramy leady („Talk to us"), ale nie inwestujemy energii do końca MŚ.

---

## 4. Kanały — co, dlaczego, ile energii

| Kanał | Rola | Priorytet w launchu | Koszt |
|---|---|---|---|
| **IG Reels + TikTok** (Twoje konta) | Główna scena treści MŚ | 🔴 wysoki | czas |
| **Program ambasadorski** | Mnożnik zasięgu + dowód społeczny | 🔴 wysoki | darmowe Pro |
| **Watermark / pętla wirusowa** | Pasywne pozyskanie z cudzych eksportów | 🔴 wysoki (już w produkcie) | 0 |
| **YouTube Shorts** (repost Reels) | Drugi zasięg + SEO długoogonowe | 🟡 średni | repurpose |
| **X / tactics twitter** | Nisza, ale dokładnie nasza grupa | 🟡 średni | czas |
| **Grupy FB/WhatsApp trenerskie** | Bezpośredni dostęp do persony 2 | 🟡 średni | czas |
| **SEO landing (EN/ES/PL)** | Długofalowo, nie da efektu w 4 tyg. | 🟢 niski teraz | jednorazowo |
| **Płatne boosty** (≤500 zł/mc) | Tylko podbicie zwycięskich treści | 🟢 selektywnie | ≤500 zł/mc |
| **Product Hunt / launch dni** | Jednorazowy spike po MŚ | 🟢 po turnieju | czas |

**Zasada budżetu 500 zł:** nie odpalamy „kampanii z góry". Publikujemy organicznie, czekamy 48 h, i **dolewamy budżet tylko do tych 1–2 treści, które same złapały** (np. Reel z 5k+ wyświetleń organicznie → 100–150 zł boostu z linkiem do `/app`). To retargeting zwycięzców, nie hazard.

---

## 5. Harmonogram zakotwiczony w MŚ 2026

Terminarz turnieju (źródła na końcu): **grupa do 27.06**, **1/32: 28.06–3.07**, **1/8: 4–7.07**, **ćwierćfinały: 9–11.07**, **półfinały: ~14–15.07**, **finał: 19.07**. Dziś (22.06) jesteśmy w fazie grupowej — zostały ~4 tygodnie rampy.

### Faza A — „Rozgrzewka" (22–27.06, faza grupowa) — TERAZ
Cel: uruchomić maszynę zanim zacznie się pogoń.
- Domknij watermark + sprawdź, że guest mode i eksport działają bez logowania (to jest *cała* obietnica — przetestuj na telefonie znajomego).
- Wyślij zaproszenia do **5–10 pierwszych ambasadorów** (skrypty w `01_`).
- Opublikuj 3–4 treści „analiza meczu z grupy zrobiona w TMC" — udowodnij format.
- Ustaw automatyzacje z `03_` (planowanie postów, autoresponder, tracking).

### Faza B — „Eskalacja" (28.06–7.07, pucharowa 1/32 i 1/8)
Cel: maksymalny wolumen treści przy rosnących emocjach.
- Tempo: **1 treść dziennie** w dni meczowe (Ty), ambasadorzy dorzucają swoje.
- Format „przewidywania/rozkład” przed hitowymi meczami + „co zadecydowało” po.
- Pierwszy płatny boost na najlepszy Reel fazy grupowej.

### Faza C — „Szczyt" (9–19.07, ćwierć → finał)
Cel: złapać największe zasięgi turnieju.
- Najwięcej oczu w internecie. Każdy mecz to potencjalny viral.
- Seria „jak [drużyna] dochodzi do finału — ich schemat w 60 s".
- Finał (19.07): duża treść-podsumowanie + CTA „zrób własną analizę finału".

### Faza D — „Żniwa" (20–31.07, po turnieju)
Cel: przekuć ruch w bazę i pierwszych płacących.
- Podsumowanie „najlepsze taktyki MŚ 2026" (carousel + landing).
- Launch na **Product Hunt** / w społecznościach (gdy masz już dowód społeczny i treści).
- E-mail do kont Free, które złapaliśmy: „dzięki za MŚ, oto co dalej".
- Retro: które treści/persony konwertowały → plan na sierpień.

---

## 6. Alokacja budżetu (≤500 zł/mc)

| Pozycja | Kwota/mc | Po co |
|---|---|---|
| Boost zwycięskich treści | 250–350 zł | Podbić 1–2 Reels/TikToki, które złapały organicznie, z linkiem do `/app` |
| Pula nagród ambasadorskich | 0–100 zł | Drobny gadżet/voucher dla top ambasadora miesiąca (opcjonalnie) |
| Narzędzia | 0–50 zł | Większość z `03_` ma darmowe plany; rezerwa na planer postów |
| **Rezerwa** | reszta | Nie wydawać na siłę — chować na zwycięzców |

Darmowe Pro dla ambasadorów to **koszt krańcowy ≈ 0** (to dostęp do softu, nie gotówka) — najtańszy i najmocniejszy kanał, jaki masz.

---

## 7. Ryzyka i jak je tniemy

- **Jedna osoba nie wyrobi z treścią w szczycie MŚ** → dlatego ambasadorzy + repurposing 1 treść→3 platformy (`03_`). Nie produkuj 3× osobno.
- **Goście wchodzą, ale nie eksportują** → priorytet: przetestuj onboarding na żywym człowieku z telefonem PRZED falą ruchu. Time-to-first-export to być albo nie być.
- **Watermark zniechęca twórców** → spec mówi „elegancki, ~40–50% krycia, róg" — pilnuj, by nie psuł grafiki; daj ambasadorom Pro (bez watermarku), żeby chcieli go pokazywać.
- **Roczny plan na `/pricing` checkoutuje miesięcznie** (znane z `LAUNCH_NEXT_STEPS.md`) → napraw albo zdejmij toggle roczny przed wysłaniem ruchu na pricing.
- **Brak EN treści = sufit zasięgu** → napisy EN na każdym Reelu od początku (PL głos/tekst + EN napisy to minimalny koszt, max zasięg).

---

## 8. Następne kroki (do odhaczenia)

1. [ ] Przetestuj guest → eksport na cudzym telefonie (obietnica 30 s działa?).
2. [ ] Napraw/zdejmij roczny toggle na `/pricing`.
3. [ ] Wyślij 5–10 zaproszeń ambasadorskich (→ `01_`).
4. [ ] Ustaw planer postów + autoresponder + tracking (→ `03_`).
5. [ ] Nagraj 3 pierwsze treści wg `02_` i opublikuj w fazie grupowej.
6. [ ] Po 48 h: wybierz zwycięzcę i podbij go za ≤150 zł.

---

### Źródła (terminarz MŚ 2026)
- [2026 FIFA World Cup — Wikipedia](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup)
- [FIFA — World Cup 2026 match schedule](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums)
- [NBC Sports — 2026 World Cup schedule & bracket](https://www.nbcsports.com/soccer/news/2026-world-cup-schedule-kick-off-times-stadiums-dates-groups-how-to-watch-live-bracket)
