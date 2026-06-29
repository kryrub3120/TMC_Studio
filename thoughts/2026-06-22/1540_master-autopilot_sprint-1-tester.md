# Tester Evidence - S1: LandingPage + PublicPageShell redesign
**Data:** 2026-06-22
**Iteracja:** 1

## Uruchomione testy
- `rg` grep dla hardcoded klas: tylko 1 trafienie — klasy usuwane w `usePublicLightTheme()` (OK)
- i18n: sprawdzono, że `landing.everywhere.*` istnieje w en/pl/es — wszystkie 3 języki mają identyczną strukturę kluczy
- i18n: `landing.footer.*` istnieje w en/pl/es — OK
- i18n: `footer.*` istnieje w en/pl/es — OK

## Znalezione problemy
| Severity | Opis | Jak odtworzyc |
|----------|------|---------------|
| NONE | — | — |

## Edge cases sprawdzone
- **PublicFooter w LandingPage**: LandingPage ma inny layout niż PublicPageShell — footer jest jedynym wspólnym elementem. Sprawdzono, że import działa (import z tego samego pliku).
- **usePublicDarkTheme**: LandingPage i PublicPageShell wołają `usePublicDarkTheme()` w swoim zakresie — nie ma konfliktu.
- **CookiePolicy bez slate classes**: sprawdzono, że wszystkie 6 wystąpień zostało zamienione.

## Pokrycie
- Wszystkie zmienione pliki sprawdzone pod kątem hardcoded klas
- i18n parytet: zweryfikowano

## Nie sprawdzone obszary
- Build: pre-existing typecheck issues uniemożliwiają pełną weryfikację
- Lighthouse: wymaga działającego dev serwera