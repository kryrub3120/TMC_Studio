# Sprint Contract - S1: CSP Content Security Policy
**Data:** 2026-06-29 23:50

## Cel sprintu
Naprawa CSP (Content Security Policy) blokujacej Google Fonts i Plausible analytics

## Zakres
- `netlify.toml`: dodanie `https://fonts.googleapis.com` do `style-src`
- `netlify.toml`: dodanie `https://fonts.gstatic.com` do `font-src`
- `netlify.toml`: dodanie `https://plausible.io` do `connect-src`

## Poza zakresem
- Inne zmiany CSP (np. frame-src, img-src)
- Zmiany w HTML lub CSS

## Selected Skills
| Skill | Uzasadnienie | Oczekiwane evidence |
|-------|-------------|---------------------|
| ci-debug | szybka zmiana konfiguracji | build przechodzi po zmianie |

## Kryteria akceptacji
- [ ] CSP pozwala na ladowanie fontow z fonts.googleapis.com i fonts.gstatic.com
- [ ] CSP pozwala na connect do plausible.io
- [ ] Build przechodzi

## Definition of Done
- [x] Kod zgodny z planem
- [ ] Testy napisane / zaktualizowane
- [ ] Testy przechodza
- [ ] UI zgodne z design systemem (nie dotyczy)
- [ ] Zmiana tylko w netlify.toml - minimalna ingerencja

## Zaleznosci od poprzednich sprintow
Brak

## Ryzyka
- CSP zmiana moze byc nadpisywana przez Netlify headers w deployu - to ok, bo zmieniamy zrodlo