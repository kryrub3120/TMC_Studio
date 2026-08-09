# Audyt TMC Studio przed testami i sprzedaza

Data audytu i realizacji poprawek: 2026-08-06, aktualizacja 2026-08-07

## Aktualny werdykt

TMC Studio jest gotowe do zamknietych testow produktu. Zestaw zostal wdrozony
na produkcje 2026-08-07, a automatyczna bramka techniczna i smoke test produkcji
sa zielone.

Platnej sprzedazy nie nalezy jeszcze wlaczac. Pozostaly trzy grupy dzialan
operacyjnych, ktorych nie da sie wiarygodnie zamknac samym testem lokalnym:

1. zakupy Stripe test mode na prawdziwym koncie i potwierdzenie webhookow;
2. test Team na dwoch rzeczywistych kontach Supabase;
3. akceptacja konfiguracji podatkowej i dokumentow prawnych.

## Zrealizowane poprawki

### Auth i routing

- Google OAuth pozostaje w sprawdzonym flow redirect.
- Callback OAuth pokazuje blad i pozwala wrocic do aplikacji zamiast wisiec lub
  cicho przekierowywac.
- Dodano czytelna strone 404 dla nieznanych tras.
- Legacy `/app` zachowuje parametry zakupu i przekierowuje do `/board`.
- Publiczne strony maja statyczny HTML, osobne adresy EN/PL/ES, self-canonical,
  wzajemne hreflang i generowana sitemap. Edytor korzysta z osobnego shellu
  `noindex`, a nieznane adresy zwracaja prawdziwy status 404 na Netlify.

### Pricing, billing i Stripe Tax

- Cykl roczny jest przekazywany z `/pricing` do modala bez wyscigu stanu.
- Modal renderuje obliczona cene i okres, zamiast stalej ceny miesiecznej z
  tlumaczen.
- Backend ma jawne mapowanie kazdego Price ID na plan i cykl rozliczeniowy.
- Checkout zapisuje poprawne `plan` i `billing_cycle` w metadata subskrypcji.
- Checkout wlacza `automatic_tax`, wymaga adresu rozliczeniowego i zbiera Tax ID.
- Dla istniejacego Stripe Customer Checkout aktualizuje nazwe i adres.
- Produkcyjne zmienne Stripe pozostaja w test mode. Przejscie na live nie bylo
  czescia tej realizacji.
- Kalkulator Team pokazuje prawidlowy okres oszczednosci dla cyklu miesiecznego
  i rocznego.
- Wybrany platny plan i cykl nie gina podczas logowania. Po powrocie z Google
  lub logowania email aplikacja wznawia modal upgrade'u.

### Lejek sprzedazowy i dokumenty

- Analityka mierzy wybor planu, start, blad i anulowanie checkoutu, udane
  logowanie email/Google oraz otwarcie i blad Customer Portal.
- Usunieto nieaktualne odwolanie do zamknietej platformy ODR z `/legal`.
- Publiczne strony prawne nadal celowo pokazuja oznaczenie szkicu do czasu
  formalnej akceptacji. Nie jest to zadanie do automatycznego zamkniecia.

### UX edytora

- Topbar nie wychodzi poza viewport 390, 768, 1024 ani 1280 px.
- Na malych ekranach zachowane sa najwazniejsze akcje: zawodnicy, strzalki,
  eksport, inspektor i logowanie; kolejne narzedzia pojawiaja sie progresywnie.
- Projekty maja jeden poprawny kontener `overflow-y-auto`, obslugiwany kolkiem
  myszy, z nieruchomym naglowkiem i stopka.
- Inspektor zamyka sie przy przejsciu do malego breakpointu, ale moze zostac
  ponownie otwarty przez uzytkownika.
- Autosave goscia konczy sie zapisem lokalnym i nie probuje zapisu do Supabase.
- Akcja `clearSelection` w command palette jest podlaczona.
- Przycisk Team w pomocy otwiera zakladke klubu w ustawieniach.
- Rozdzielono gest panoramowania od zaznaczania obszarem. Przy dopasowanym
  widoku drag po pustym boisku zaznacza, a panoramowanie po recznym zoomie
  anuluje aktywna ramke zaznaczenia.
- Usunieto podwojne stosowanie `fitZoom`, ktore zmniejszalo i przesuwalo boisko
  po zmianie rozmiaru okna.
- Tryb bialy `W`, zmiana motywu i wlaczanie/wylaczanie linii zachowuja wybrany
  widok polowy lub pola karnego.
- Podpis zawodnika jest dosuniety do jego ksztaltu, takze dla trojkata.
- Lawka ma bezposrednia akcje dodania pierwszego zawodnika oraz wyrazny przycisk
  edycji skladu. Ustawienia sa tez dostepne obok przelacznika motywu w topbarze.
- Tutorial ma stale widoczny przycisk `Pomin`, niezalezny od polozenia karty.
- Rysowanie korzysta z aktualnego stanu store przy ruchu i puszczeniu myszy;
  szybki drag nie gubi juz strzalki ani strefy przed rerenderem Reacta.
- Modal ustawien ma semantyke dostepnego dialogu (`role=dialog`, `aria-modal`).

### Funkcje i komunikacja produktu

- Timeline animacji jest domyslnie aktywny; zmienna srodowiskowa jest awaryjnym
  kill switchem.
- SVG jest dostepne w glownym menu eksportu, zgodnie z landingiem.
- Team tworzy bezpieczny link zaproszenia i probuje skopiowac go automatycznie.
- Copy EN/PL/ES jasno mowi, ze TMC Studio nie wysyla jeszcze maila z zaproszeniem.

## Wynik automatycznej walidacji

| Bramka | Wynik |
| --- | --- |
| Node | 22.15.0 przez `.nvmrc`; `engines` wymaga Node 22 |
| Typecheck | przechodzi dla wszystkich pakietow |
| Testy web | 137/137 |
| Testy billing security | 40/40 |
| Build produkcyjny | przechodzi |
| Audyt SEO | przechodzi dla 60 lokalizowanych stron |
| Playwright E2E | 36/36 na zbudowanym artefakcie |
| Lint | 0 bledow, 117 istniejacych ostrzezen |
| Diff check | brak bledow whitespace |

Playwright uruchamia teraz deterministycznie `pnpm build` i Vite preview. Nie
korzysta z watcherow pakietow, ktore wczesniej mogly podac stary `dist`.

Zakres 36 testow E2E obejmuje:

- blad callbacku OAuth i powrot do aplikacji;
- wejscie goscia i podstawowy flow auth w dev;
- pricing, roczne CTA, ceny Pro/Team i legacy `/app`;
- 404 oraz zachowanie jezyka w linkach publicznych;
- przejscie z publicznego szablonu do tablicy i zaladowanie 11 zawodnikow;
- topbar na 390/768/1024/1280 px;
- dostepnosc podstawowych akcji mobile i zamkniety inspektor;
- scroll kontenera projektow;
- dodawanie zawodnikow, eksport PNG, timeline animacji i obecnosc SVG.
- brak konfliktu drag-select z panoramowaniem oraz anulowanie marquee przy pan;
- prawidlowe oszczednosci Team miesiecznie/rocznie, zachowanie intencji zakupu
  przez logowanie, usuniecie ODR i wycofanie zgody analitycznej;
- zachowanie widoku polowy i pola karnego po dwukrotnym przelaczeniu `W`;
- bezposrednie dodanie pierwszego zawodnika z lawki;
- widoczny i dzialajacy globalny przycisk pominiecia tutoriala.
- skróty dodawania zawodnikow obu druzyn, pilki, tekstu i sprzetu;
- gest rysowania strzalki podania, strefy prostokatnej i eliptycznej;
- cofanie i ponawianie zmian oraz bezposrednie otwieranie preferencji.

## Sprawdzone moduly

| Modul | Status po realizacji |
| --- | --- |
| Landing i pricing | dzialaja; obietnice animacji i SVG odpowiadaja aplikacji |
| Zawodnicy, sprzet, boisko | dzialaja; gesty viewportu i widoki half/penalty maja testy regresyjne |
| Strzalki i strefy | menu i pelne gesty rysowania maja testy E2E canvas |
| Undo/redo i command palette | dzialaja; `clearSelection` naprawione |
| Projekty i foldery | dzialaja w dev cloud; scroll naprawiony |
| Animacja | kroki i play dzialaja; timeline wlaczony w buildzie |
| Eksport | PNG ma test download; SVG jest widoczne; PDF/GIF wymagaja konta Pro |
| Ustawienia | wszystkie 13 zakladek renderuja sie |
| Team | klub i link zaproszenia dzialaja lokalnie; copy jest zgodne z flow |
| Responsywnosc | topbar i inspector maja automatyczne testy czterech szerokosci |
| Autosave | gosc zapisuje lokalnie; cloud save pozostaje dla zalogowanych |

## Pozostale testy akceptacyjne

Te testy nalezy wykonac na srodowisku testowym po wdrozeniu:

1. Google OAuth na czystym koncie i koncie powracajacym.
2. Supabase: zapis, reload i konflikt projektu na zalogowanym koncie.
3. Stripe: Pro monthly, Pro yearly, Team monthly i Team yearly.
4. Stripe: sukces, anulowanie, 3DS, payment failed i Customer Portal.
5. Webhook: aktywacja planu, idempotencja, odnowienie i downgrade.
6. Team na dwoch kontach: create, link, accept, role, limit 5 miejsc, revoke.
7. PDF i GIF jako Pro oraz SVG jako Guest/Free.
8. Safari/WebKit i Firefox; obecna automatyzacja obejmuje Chromium.

## Blokery sprzedazy

1. Stripe Dashboard: potwierdzic Tax origin, tax code SaaS, tax behavior cen,
   faktyczne rejestracje podatkowe, Portal i faktury.
2. Ksiegowosc: potwierdzic VAT PL/OSS i jurysdykcje przed wlaczeniem poboru.
3. Prawo: zatwierdzic dokumenty oznaczone jako szkice oraz wymagane zgody
   konsumenckie. Nie usuwac bannerow szkicu bez akceptacji prawnej.
4. Wykonac komplet testowych zakupow i zachowac dowody webhook -> Supabase.
5. Skonfigurowac monitoring bledow auth, checkout i webhookow przed live.
6. Po akceptacji prawnej usunac widoczne oznaczenie szkicu ze stron prawnych.

## Ryzyka techniczne bez blokady testow

- Lint ma 117 ostrzezen, glownie `no-explicit-any` i zaleznosci hookow.
- Dwa chunki przekraczaja 500 kB po minifikacji; warto kontynuowac code split.
- Settings goscia nadal pokazuje czesc sekcji konta, ktore sa istotne dopiero po
  zalogowaniu; wymaga osobnej korekty UX, ale nie blokuje testow edytora.
- Zaproszenia Team sa obecnie linkowe. Automatyczna wysylka email moze zostac
  dodana pozniej jako osobny, monitorowany kanal transakcyjny.

## Decyzja startowa

Po wdrozeniu tego zestawu na test mode mozna zaprosic zamknieta grupe testerow.
Sprzedaz uruchamiamy dopiero po podpisaniu checklisty podatkowo-prawnej i po
udanym przejsciu wszystkich testow akceptacyjnych Stripe oraz Team.
