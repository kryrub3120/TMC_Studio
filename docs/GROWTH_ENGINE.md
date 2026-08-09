# TMC Growth Engine

_Status: v0.1 gotowe do produkcji_

Produkcja: `https://tmcstudio.app`

## Cel

Publiczna warstwa ma pozyskiwac trenera lub analityka z konkretna potrzeba i
prowadzic go do pierwszego uzytecznego dzialania na tablicy. Liczba stron nie
jest KPI.

## Pierwszy klaster

Strony produktowe:

- `/football-tactics-board/`
- `/soccer-animation-software/`
- `/football-drill-designer/`
- `/tactical-board-for-coaches/`
- `/football-formation-creator/`
- `/animate-football-tactics/`

Szablony:

- `/templates/4-3-3-formation/`
- `/templates/4-4-2-formation/`
- `/templates/4-4-2-diamond-formation/`
- `/templates/4-2-3-1-formation/`
- `/templates/3-5-2-formation/`
- `/templates/5-3-2-formation/`

Kazdy adres ma pelne warianty EN, PL i ES. Szablony korzystaja z realnych
formacji `@tmc/presets`; nie wykorzystuja pustych rekordow z seeda jako
udawanych cwiczen.

## Lejek

1. `content_view`: wejscie na strone, typ, jezyk i path.
2. `content_open_board`: klikniecie CTA i opcjonalna formacja.
3. `first_element_added`: pierwsza wlasna zmiana uzytkownika.
4. `first_export`: pierwszy eksport oraz TTFE.
5. `signup`, `pricing_view`, `upgrade`: dalsza konwersja.

## Pierwszy eksperyment

Hipoteza: uzytkownik wchodzacy na szablon formacji czesciej przejdzie do tablicy
i wykona pierwszy eksport niz uzytkownik ogolnej strony startowej.

Podstawowy raport po zebraniu danych:

- `content_open_board / content_view` per strona i jezyk;
- `first_export / content_open_board` dla ruchu z contentu;
- mediana TTFE;
- mobile kontra desktop;
- strony bez wejsc na tablice lub z wysokim wyjsciem.

Nie ustalac progu sukcesu bez danych bazowych. Pierwsze dwa tygodnie po
indeksacji sa pomiarem bazowym.

## Bramka publikacji

- reczna akceptacja copy EN/PL/ES;
- finalny build, audyt 60 stron i E2E;
- potwierdzenie odbioru obu nowych eventow w Plausible;
- zgloszenie sitemap w Google Search Console;
- kontrola canonical, hreflang i statusu 404 na produkcji;
- brak automatycznej publikacji social, maili i ofert w v0.1.

## Weryfikacja produkcji

- sitemap zawiera 60 adresow;
- publiczne strony maja tresc i H1 w surowym HTML;
- `/board` korzysta z osobnego dokumentu `noindex,nofollow`;
- nieznany adres zwraca HTTP 404;
- `/api/health` zwraca `environment: production`;
- callback OAuth, 404 i szablon do tablicy przeszly test Playwright na produkcji;
- Plausible przyjal oznaczony event `content_view` kodem HTTP 202.

Sitemap pozostaje do recznego zgloszenia w Google Search Console.

## Kolejny zakres

Po danych bazowych wybrac maksymalnie trzy kolejne strony. Priorytet maja realne
szablony cwiczen z pelnymi elementami dokumentu i przyciskiem otwierajacym ten
konkretny projekt. Strony porownawcze wymagaja udokumentowanego testu obu
produktow.
