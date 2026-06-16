# EU Compliance — Checklist & Status (S4)

_Utworzono: 2026-06-15 · Uzupełnia `SITE_ARCHITECTURE.md` §4_

Status implementacji warstwy prawnej po sprincie S4. ✅ = wdrożone w kodzie · 🟡 = wdrożone, wymaga uzupełnienia treści/prawnika · 🔴 = do zrobienia.

## Strony i mechanizmy

| Element | Status | Uwagi |
|---|---|---|
| `/privacy` | 🟡 | Istnieje (i18n `legal.privacy`). **Wymaga przeglądu prawnika**: lista procesorów (Supabase/Netlify/Stripe/Google), podstawy prawne RODO, retencja, transfery poza EOG (SCC). |
| `/terms` | 🟡 | Istnieje (`legal.terms`). Przegląd: subskrypcje/odnowienia, ograniczenie odpowiedzialności, prawo właściwe, dyrektywa o treściach cyfrowych. |
| `/cookies` | 🟡 | Istnieje (`legal.cookies`). Spójne z banerem; uzupełnić realne nazwy/czas życia cookies po podpięciu analityki (S6). |
| `/refunds` | ✅ | Nowa. Prawo odstąpienia 14 dni + zrzeczenie przy treści cyfrowej + anulowanie + zwroty. Treść do potwierdzenia przez prawnika. |
| `/legal` (Impressum) | 🟡 | Nowa. **TODO: uzupełnić dane firmy** (nazwa, adres, VAT-UE, osoba odpowiedzialna) — placeholdery `[TODO: ...]`. Link ODR Komisji UE gotowy. |
| `/accessibility` | ✅ | Nowa. Deklaracja WCAG 2.1 AA / EAA + kanał zgłoszeń. |
| Baner cookie (opt-in) | ✅ | `CookieConsentBanner`: równorzędne Akceptuj/Odrzuć, brak pre-zaznaczeń, zapis w `localStorage` (`tmc-cookie-consent`), analityka OFF do zgody. |
| Checkbox prawa odstąpienia w checkout | 🔴 | Do zrobienia w przepływie Stripe (`STRIPE_TAX_SETUP.md` §4 krok 5) — zgoda na natychmiastowe świadczenie + utrata prawa odstąpienia, zapis w metadanych. |
| Wycofanie zgody na cookies | 🔴 | Dodać na `/cookies` przycisk „zmień ustawienia cookies" czyszczący zgodę (RODO: wycofanie równie łatwe jak udzielenie). |

## Co MUSI zrobić człowiek (nie agent)

1. **Prawnik**: przegląd treści `/privacy`, `/terms`, `/refunds` w 3 językach przed publikacją.
2. **Dane firmy**: wypełnić placeholdery w `/legal` (Impressum) i numer VAT.
3. **Procesory danych**: potwierdzić aktualną listę i DPA (Supabase, Netlify, Stripe, Google OAuth).
4. **Audyt WCAG** (S5): zweryfikować realny stan dostępności stron sprzedażowych.

## Powiązania
- VAT / faktury / checkbox odstąpienia: `STRIPE_TAX_SETUP.md`
- Pełny kontekst wymogów: `SITE_ARCHITECTURE.md` §4
- Plan sprintów: `tasks/WEBSITE_LAUNCH_SPRINT_PLAN.md`
