import type { Language } from '@tmc/ui';

export const PRODUCT_PAGE_PATHS = [
  '/football-tactics-board',
  '/soccer-animation-software',
  '/football-drill-designer',
  '/tactical-board-for-coaches',
  '/football-formation-creator',
  '/animate-football-tactics',
] as const;

export const TEMPLATE_PAGE_PATHS = [
  '/templates/4-3-3-formation',
  '/templates/4-4-2-formation',
  '/templates/4-4-2-diamond-formation',
  '/templates/4-2-3-1-formation',
  '/templates/3-5-2-formation',
  '/templates/5-3-2-formation',
] as const;

export const GROWTH_PAGE_PATHS = [
  ...PRODUCT_PAGE_PATHS,
  ...TEMPLATE_PAGE_PATHS,
] as const;

export type GrowthPagePath = (typeof GROWTH_PAGE_PATHS)[number];

type LocalizedText = Record<Language, string>;

export interface GrowthPageContent {
  path: GrowthPagePath;
  kind: 'product' | 'template';
  title: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  lead: string;
  visualLabel: string;
  formationId: string;
  primaryCta: string;
  proofTitle: string;
  proofBody: string;
  benefits: string[];
  steps: Array<{ title: string; body: string }>;
  note: string;
  relatedPaths: GrowthPagePath[];
}

interface GrowthPageDefinition {
  path: GrowthPagePath;
  kind: 'product' | 'template';
  formationId: string;
  title: LocalizedText;
  metaTitle: LocalizedText;
  metaDescription: LocalizedText;
  eyebrow: LocalizedText;
  lead: LocalizedText;
  visualLabel: LocalizedText;
  primaryCta: LocalizedText;
  proofTitle: LocalizedText;
  proofBody: LocalizedText;
  benefits: Record<Language, string[]>;
  steps: Record<Language, Array<{ title: string; body: string }>>;
  note: LocalizedText;
  relatedPaths: GrowthPagePath[];
}

const productPages: GrowthPageDefinition[] = [
  {
    path: '/football-tactics-board',
    kind: 'product',
    formationId: '4-3-3',
    title: {
      en: 'Football tactics board for clear, fast coaching communication',
      pl: 'Piłkarska tablica taktyczna do szybkiej i czytelnej komunikacji',
      es: 'Pizarra táctica de fútbol para comunicar ideas con claridad',
    },
    metaTitle: {
      en: 'Online Football Tactics Board | TMC Studio',
      pl: 'Internetowa tablica taktyczna piłki nożnej | TMC Studio',
      es: 'Pizarra táctica de fútbol online | TMC Studio',
    },
    metaDescription: {
      en: 'Build football formations, draw movements and export a clear tactical board in your browser. Start without installing software.',
      pl: 'Twórz ustawienia, rysuj ruchy i eksportuj czytelną tablicę taktyczną w przeglądarce. Zacznij bez instalowania programu.',
      es: 'Crea formaciones, dibuja movimientos y exporta una pizarra táctica clara desde el navegador, sin instalar software.',
    },
    eyebrow: { en: 'Online tactical board', pl: 'Tablica taktyczna online', es: 'Pizarra táctica online' },
    lead: {
      en: 'Move from a coaching idea to a diagram players can understand. Place both teams, distinguish movement types and export the result from one focused workspace.',
      pl: 'Przenieś pomysł trenerski na diagram zrozumiały dla zawodników. Ustaw obie drużyny, rozróżnij rodzaje ruchu i wyeksportuj wynik z jednego miejsca.',
      es: 'Convierte una idea de entrenamiento en un diagrama fácil de entender. Coloca ambos equipos, distingue cada movimiento y exporta el resultado desde un solo espacio.',
    },
    visualLabel: { en: '4-3-3 tactical board preview', pl: 'Podgląd tablicy taktycznej 4-3-3', es: 'Vista previa de la pizarra 4-3-3' },
    primaryCta: { en: 'Open the tactics board', pl: 'Otwórz tablicę taktyczną', es: 'Abrir la pizarra táctica' },
    proofTitle: { en: 'What you can do now', pl: 'Co możesz zrobić już teraz', es: 'Qué puedes hacer ahora' },
    proofBody: {
      en: 'TMC Studio supports home and away players, balls, four arrow types, zones, labels, equipment, multiple steps and PNG or SVG export. GIF and PDF export are available on paid plans.',
      pl: 'TMC Studio obsługuje zawodników obu drużyn, piłki, cztery typy strzałek, strefy, podpisy, sprzęt, wiele kroków oraz eksport PNG i SVG. GIF i PDF są dostępne w płatnych planach.',
      es: 'TMC Studio incluye jugadores locales y visitantes, balones, cuatro tipos de flechas, zonas, etiquetas, material, varios pasos y exportación PNG o SVG. GIF y PDF están disponibles en planes de pago.',
    },
    benefits: {
      en: ['Start as a guest with no card', 'Use keyboard shortcuts for common actions', 'Keep the pitch, tools and timeline in one view'],
      pl: ['Zacznij jako gość bez karty', 'Korzystaj ze skrótów dla częstych działań', 'Miej boisko, narzędzia i oś czasu w jednym widoku'],
      es: ['Empieza como invitado y sin tarjeta', 'Usa atajos para las acciones frecuentes', 'Mantén campo, herramientas y línea de tiempo en una vista'],
    },
    steps: {
      en: [{ title: 'Choose the shape', body: 'Load one of six formations or place players manually.' }, { title: 'Explain the action', body: 'Add passes, runs, shots, dribbles, zones and short labels.' }, { title: 'Share the message', body: 'Export the current step as PNG or SVG, or build a longer sequence.' }],
      pl: [{ title: 'Wybierz ustawienie', body: 'Załaduj jedną z sześciu formacji albo ustaw zawodników ręcznie.' }, { title: 'Pokaż działanie', body: 'Dodaj podania, biegi, strzały, drybling, strefy i krótkie podpisy.' }, { title: 'Przekaż komunikat', body: 'Wyeksportuj krok jako PNG lub SVG albo zbuduj dłuższą sekwencję.' }],
      es: [{ title: 'Elige la estructura', body: 'Carga una de las seis formaciones o coloca jugadores manualmente.' }, { title: 'Explica la acción', body: 'Añade pases, carreras, tiros, regates, zonas y etiquetas.' }, { title: 'Comparte el mensaje', body: 'Exporta el paso como PNG o SVG o crea una secuencia más larga.' }],
    },
    note: { en: 'No account is required to test the board and export PNG.', pl: 'Do przetestowania tablicy i eksportu PNG nie potrzebujesz konta.', es: 'No necesitas una cuenta para probar la pizarra y exportar PNG.' },
    relatedPaths: ['/football-formation-creator', '/animate-football-tactics', '/templates/4-3-3-formation'],
  },
  {
    path: '/soccer-animation-software', kind: 'product', formationId: '4-2-3-1',
    title: { en: 'Soccer animation software that starts with the tactical idea', pl: 'Program do animacji piłkarskich zaczynający od pomysłu taktycznego', es: 'Software de animación de fútbol centrado en la idea táctica' },
    metaTitle: { en: 'Soccer Animation Software for Coaches | TMC Studio', pl: 'Program do animacji piłkarskich dla trenerów | TMC Studio', es: 'Software de animación de fútbol para entrenadores | TMC Studio' },
    metaDescription: { en: 'Create step-by-step football animations in the browser. Position players, add movement and preview the sequence before export.', pl: 'Twórz krok po kroku animacje piłkarskie w przeglądarce. Ustaw zawodników, dodaj ruch i obejrzyj sekwencję przed eksportem.', es: 'Crea animaciones de fútbol paso a paso en el navegador. Coloca jugadores, añade movimientos y revisa la secuencia antes de exportarla.' },
    eyebrow: { en: 'Tactical animation', pl: 'Animacja taktyczna', es: 'Animación táctica' },
    lead: { en: 'Build the key moments of a play as separate steps, control their order and play the sequence back. The animation stays connected to a readable coaching diagram.', pl: 'Buduj kluczowe momenty akcji jako osobne kroki, kontroluj ich kolejność i odtwarzaj sekwencję. Animacja pozostaje czytelnym diagramem trenerskim.', es: 'Construye los momentos clave como pasos separados, controla el orden y reproduce la secuencia. La animación sigue siendo un diagrama claro para el entrenador.' },
    visualLabel: { en: '4-2-3-1 animation setup preview', pl: 'Podgląd animacji ustawienia 4-2-3-1', es: 'Vista previa de animación 4-2-3-1' },
    primaryCta: { en: 'Create an animation', pl: 'Utwórz animację', es: 'Crear una animación' },
    proofTitle: { en: 'A practical step workflow', pl: 'Praktyczna praca na krokach', es: 'Un flujo práctico por pasos' },
    proofBody: { en: 'The released timeline supports adding, reordering, renaming and playing steps. Guest projects can contain up to five steps; Free accounts up to ten; Pro and Team are unlimited.', pl: 'Dostępna oś czasu pozwala dodawać, porządkować, nazywać i odtwarzać kroki. Projekt gościa może mieć do pięciu kroków, konto Free do dziesięciu, a Pro i Team bez limitu.', es: 'La línea de tiempo permite añadir, ordenar, nombrar y reproducir pasos. Invitado admite hasta cinco, Free hasta diez y Pro o Team no tienen límite.' },
    benefits: { en: ['Separate setup, trigger and outcome', 'Preview movement before exporting', 'Use GIF export on Pro or Team'], pl: ['Oddziel ustawienie, bodziec i rezultat', 'Obejrzyj ruch przed eksportem', 'Eksportuj GIF w Pro lub Team'], es: ['Separa inicio, estímulo y resultado', 'Previsualiza el movimiento antes de exportar', 'Exporta GIF con Pro o Team'] },
    steps: { en: [{ title: 'Set the first frame', body: 'Place players, the ball and supporting labels.' }, { title: 'Add the next step', body: 'Move elements and add arrows that clarify the action.' }, { title: 'Play and refine', body: 'Review timing and readability before sharing.' }], pl: [{ title: 'Ustaw pierwszą klatkę', body: 'Rozmieść zawodników, piłkę i pomocnicze opisy.' }, { title: 'Dodaj kolejny krok', body: 'Przesuń elementy i dodaj strzałki wyjaśniające akcję.' }, { title: 'Odtwórz i popraw', body: 'Sprawdź tempo i czytelność przed udostępnieniem.' }], es: [{ title: 'Prepara el primer cuadro', body: 'Coloca jugadores, balón y etiquetas de apoyo.' }, { title: 'Añade el siguiente paso', body: 'Mueve elementos y añade flechas para aclarar la acción.' }, { title: 'Reproduce y ajusta', body: 'Revisa el ritmo y la claridad antes de compartir.' }] },
    note: { en: 'GIF and PDF export require Pro or Team; PNG and SVG remain available without a paid plan.', pl: 'Eksport GIF i PDF wymaga Pro lub Team; PNG i SVG pozostają dostępne bez płatnego planu.', es: 'La exportación GIF y PDF requiere Pro o Team; PNG y SVG siguen disponibles sin plan de pago.' },
    relatedPaths: ['/animate-football-tactics', '/football-tactics-board', '/templates/4-2-3-1-formation'],
  },
  {
    path: '/football-drill-designer', kind: 'product', formationId: '4-4-2-diamond',
    title: { en: 'Football drill designer for sessions that need a clear picture', pl: 'Kreator ćwiczeń piłkarskich do czytelnego planowania treningu', es: 'Diseñador de ejercicios de fútbol para sesiones fáciles de explicar' },
    metaTitle: { en: 'Online Football Drill Designer | TMC Studio', pl: 'Kreator ćwiczeń piłkarskich online | TMC Studio', es: 'Diseñador de ejercicios de fútbol online | TMC Studio' },
    metaDescription: { en: 'Design football drills with players, zones, cones, hoops, movement arrows and labels. Export a clean image for your session plan.', pl: 'Projektuj ćwiczenia z zawodnikami, strefami, pachołkami, obręczami, strzałkami i opisami. Eksportuj czytelny obraz do planu treningu.', es: 'Diseña ejercicios con jugadores, zonas, conos, aros, flechas y etiquetas. Exporta una imagen clara para tu plan de sesión.' },
    eyebrow: { en: 'Session design', pl: 'Projektowanie treningu', es: 'Diseño de sesiones' },
    lead: { en: 'Show the organisation of a drill before describing its rules. Use pitch regions, equipment and movement cues so staff and players can scan the setup quickly.', pl: 'Pokaż organizację ćwiczenia, zanim opiszesz jego zasady. Użyj fragmentów boiska, sprzętu i wskazówek ruchu, aby sztab i zawodnicy szybko odczytali ustawienie.', es: 'Muestra la organización antes de explicar las reglas. Usa zonas del campo, material y señales de movimiento para que cuerpo técnico y jugadores entiendan el montaje rápidamente.' },
    visualLabel: { en: 'Training organisation preview', pl: 'Podgląd organizacji treningu', es: 'Vista previa de la organización del ejercicio' },
    primaryCta: { en: 'Design a drill', pl: 'Zaprojektuj ćwiczenie', es: 'Diseñar un ejercicio' },
    proofTitle: { en: 'Tools for training diagrams', pl: 'Narzędzia do diagramów treningowych', es: 'Herramientas para diagramas de entrenamiento' },
    proofBody: { en: 'Use full, half or penalty-area boards, rectangular and elliptical zones, cones, hoops, labels and directional arrows. The output can be reused in a session document or presentation.', pl: 'Używaj pełnego boiska, połowy lub pola karnego, stref prostokątnych i eliptycznych, pachołków, obręczy, opisów i strzałek. Wynik możesz wykorzystać w konspekcie lub prezentacji.', es: 'Usa campo completo, medio campo o área, zonas rectangulares y elípticas, conos, aros, etiquetas y flechas. El resultado puede incorporarse a un plan o presentación.' },
    benefits: { en: ['Choose the board region that fits the drill', 'Separate players from equipment visually', 'Export a clean PNG for a session plan'], pl: ['Wybierz fragment boiska pasujący do ćwiczenia', 'Wizualnie rozdziel zawodników i sprzęt', 'Eksportuj czysty PNG do konspektu'], es: ['Elige la zona de campo adecuada', 'Distingue visualmente jugadores y material', 'Exporta un PNG limpio para tu sesión'] },
    steps: { en: [{ title: 'Define the area', body: 'Choose full pitch, half pitch or penalty area.' }, { title: 'Build the organisation', body: 'Add players, balls, zones and equipment.' }, { title: 'Clarify the rules', body: 'Use arrows and short labels only where they add meaning.' }], pl: [{ title: 'Określ przestrzeń', body: 'Wybierz pełne boisko, połowę albo pole karne.' }, { title: 'Zbuduj organizację', body: 'Dodaj zawodników, piłki, strefy i sprzęt.' }, { title: 'Wyjaśnij zasady', body: 'Użyj strzałek i krótkich opisów tam, gdzie dodają znaczenie.' }], es: [{ title: 'Define el espacio', body: 'Elige campo completo, medio campo o área.' }, { title: 'Monta la organización', body: 'Añade jugadores, balones, zonas y material.' }, { title: 'Aclara las reglas', body: 'Usa flechas y etiquetas breves cuando aporten información.' }] },
    note: { en: 'TMC Studio draws the visual plan; detailed session notes can remain in your existing coaching document.', pl: 'TMC Studio tworzy warstwę wizualną; szczegółowe notatki mogą pozostać w używanym przez Ciebie konspekcie.', es: 'TMC Studio crea la capa visual; las notas detalladas pueden permanecer en tu documento habitual.' },
    relatedPaths: ['/football-tactics-board', '/templates/4-4-2-diamond-formation', '/tactical-board-for-coaches'],
  },
  {
    path: '/tactical-board-for-coaches', kind: 'product', formationId: '4-4-2',
    title: { en: 'A tactical board for coaches who need to explain the next action', pl: 'Tablica dla trenerów, którzy muszą jasno pokazać następne działanie', es: 'Una pizarra para entrenadores que necesitan explicar la siguiente acción' },
    metaTitle: { en: 'Tactical Board for Football Coaches | TMC Studio', pl: 'Tablica taktyczna dla trenerów piłki nożnej | TMC Studio', es: 'Pizarra táctica para entrenadores de fútbol | TMC Studio' },
    metaDescription: { en: 'Prepare formations, training diagrams and tactical sequences in a browser-based board designed for football coaches.', pl: 'Przygotuj ustawienia, diagramy treningowe i sekwencje taktyczne w przeglądarkowej tablicy dla trenerów piłki nożnej.', es: 'Prepara formaciones, ejercicios y secuencias tácticas en una pizarra de navegador para entrenadores de fútbol.' },
    eyebrow: { en: 'Coach workflow', pl: 'Praca trenera', es: 'Flujo del entrenador' },
    lead: { en: 'Create the visual part of a briefing without switching between drawing tools. Start from a formation, add the decisive movements and keep alternate moments as steps.', pl: 'Przygotuj wizualną część odprawy bez przeskakiwania między narzędziami. Zacznij od formacji, dodaj kluczowe ruchy i zachowaj kolejne momenty jako kroki.', es: 'Prepara la parte visual de una charla sin cambiar de herramienta. Empieza con una formación, añade los movimientos decisivos y guarda otros momentos como pasos.' },
    visualLabel: { en: 'Coach briefing board preview', pl: 'Podgląd tablicy do odprawy', es: 'Vista previa de la pizarra para charla' },
    primaryCta: { en: 'Prepare a coaching board', pl: 'Przygotuj tablicę do odprawy', es: 'Preparar una pizarra' },
    proofTitle: { en: 'Designed around repeated coaching tasks', pl: 'Dopasowane do powtarzalnych zadań trenera', es: 'Pensada para tareas habituales del entrenador' },
    proofBody: { en: 'Keyboard shortcuts cover formations, players, arrows, steps and export. Projects can be saved locally as a guest or synchronized after registration within the plan limits.', pl: 'Skróty obejmują formacje, zawodników, strzałki, kroki i eksport. Projekty gościa zapisują się lokalnie, a po rejestracji mogą synchronizować się w ramach limitów planu.', es: 'Los atajos cubren formaciones, jugadores, flechas, pasos y exportación. Los proyectos se guardan localmente como invitado o se sincronizan tras registrarse según el plan.' },
    benefits: { en: ['Prepare a board before training or a match', 'Use focus mode during explanation', 'Return to saved cloud projects after registration'], pl: ['Przygotuj tablicę przed treningiem lub meczem', 'Użyj trybu skupienia podczas objaśniania', 'Wracaj do projektów w chmurze po rejestracji'], es: ['Prepara la pizarra antes del entrenamiento o partido', 'Usa el modo enfoque al explicar', 'Vuelve a proyectos guardados tras registrarte'] },
    steps: { en: [{ title: 'Start from the team shape', body: 'Use a preset or your own squad positions.' }, { title: 'Keep one message per step', body: 'Avoid combining every phase in one crowded diagram.' }, { title: 'Export for the channel', body: 'Use an image, vector or paid animation format as needed.' }], pl: [{ title: 'Zacznij od ustawienia', body: 'Użyj presetu albo własnych pozycji składu.' }, { title: 'Jedna myśl na krok', body: 'Nie łącz wszystkich faz w jednym zatłoczonym diagramie.' }, { title: 'Dobierz format', body: 'Użyj obrazu, wektora lub płatnego formatu animacji.' }], es: [{ title: 'Empieza por la estructura', body: 'Usa un preset o las posiciones de tu plantilla.' }, { title: 'Un mensaje por paso', body: 'Evita mezclar todas las fases en un diagrama saturado.' }, { title: 'Elige el formato', body: 'Usa imagen, vector o animación de pago según el canal.' }] },
    note: { en: 'Team includes up to five seats and invitations; a shared project library is not yet part of the released product.', pl: 'Team obejmuje do pięciu miejsc i zaproszenia; wspólna biblioteka projektów nie jest jeszcze dostępna.', es: 'Team incluye hasta cinco plazas e invitaciones; la biblioteca compartida de proyectos aún no está disponible.' },
    relatedPaths: ['/football-drill-designer', '/football-tactics-board', '/templates/4-4-2-formation'],
  },
  {
    path: '/football-formation-creator', kind: 'product', formationId: '4-2-3-1',
    title: { en: 'Football formation creator with six practical starting shapes', pl: 'Kreator formacji piłkarskich z sześcioma praktycznymi ustawieniami', es: 'Creador de formaciones con seis estructuras prácticas' },
    metaTitle: { en: 'Football Formation Creator Online | TMC Studio', pl: 'Kreator formacji piłkarskich online | TMC Studio', es: 'Creador de formaciones de fútbol online | TMC Studio' },
    metaDescription: { en: 'Load 4-3-3, 4-4-2, diamond, 4-2-3-1, 3-5-2 or 5-3-2 and adjust every player on an online football pitch.', pl: 'Załaduj 4-3-3, 4-4-2, diament, 4-2-3-1, 3-5-2 lub 5-3-2 i dopasuj każdego zawodnika na boisku online.', es: 'Carga 4-3-3, 4-4-2, rombo, 4-2-3-1, 3-5-2 o 5-3-2 y ajusta cada jugador en un campo online.' },
    eyebrow: { en: 'Formation creator', pl: 'Kreator formacji', es: 'Creador de formaciones' },
    lead: { en: 'Use a complete eleven-player structure as the starting point, then move players, change numbers, colours and shapes to match the message you want to present.', pl: 'Użyj pełnego ustawienia jedenastu zawodników jako punktu wyjścia, a potem zmień pozycje, numery, kolory i kształty zgodnie z tym, co chcesz pokazać.', es: 'Usa una estructura completa de once jugadores como punto de partida y ajusta posiciones, dorsales, colores y formas al mensaje que quieres presentar.' },
    visualLabel: { en: '4-2-3-1 formation creator preview', pl: 'Podgląd kreatora formacji 4-2-3-1', es: 'Vista previa del creador 4-2-3-1' },
    primaryCta: { en: 'Build a formation', pl: 'Zbuduj formację', es: 'Crear una formación' },
    proofTitle: { en: 'Six presets, fully editable afterwards', pl: 'Sześć presetów, potem pełna edycja', es: 'Seis presets y edición completa' },
    proofBody: { en: 'Keys 1–6 replace the home team with a preset. Shift plus 1–6 does the same for the away team. Each created player remains a normal editable board element.', pl: 'Klawisze 1–6 zastępują gospodarzy wybraną formacją. Shift oraz 1–6 robi to samo dla gości. Każdy utworzony zawodnik pozostaje zwykłym, edytowalnym elementem.', es: 'Las teclas 1–6 sustituyen al equipo local por un preset. Mayús y 1–6 hacen lo mismo con el visitante. Cada jugador sigue siendo un elemento editable.' },
    benefits: { en: ['Load all eleven positions at once', 'Apply independent shapes to both teams', 'Edit every player after loading'], pl: ['Załaduj jedenaście pozycji jednocześnie', 'Ustaw niezależne formacje obu drużyn', 'Edytuj każdego zawodnika po załadowaniu'], es: ['Carga once posiciones a la vez', 'Aplica estructuras distintas a ambos equipos', 'Edita cada jugador después de cargar'] },
    steps: { en: [{ title: 'Select a preset', body: 'Choose the closest structure instead of starting empty.' }, { title: 'Adapt the distances', body: 'Move lines and individual players to match the phase.' }, { title: 'Add the opposition', body: 'Use an away preset or place only the relevant opponents.' }], pl: [{ title: 'Wybierz preset', body: 'Zacznij od najbliższego ustawienia zamiast pustego boiska.' }, { title: 'Dopasuj odległości', body: 'Przesuń formacje i poszczególnych zawodników do danej fazy.' }, { title: 'Dodaj przeciwnika', body: 'Użyj presetu gości albo ustaw tylko istotnych rywali.' }], es: [{ title: 'Elige un preset', body: 'Parte de la estructura más cercana en vez de un campo vacío.' }, { title: 'Ajusta las distancias', body: 'Mueve líneas y jugadores según la fase.' }, { title: 'Añade al rival', body: 'Usa un preset visitante o coloca solo los rivales relevantes.' }] },
    note: { en: 'Applying a formation is undoable with the standard undo command.', pl: 'Zastosowanie formacji można cofnąć standardową funkcją undo.', es: 'Puedes deshacer la aplicación de una formación con el comando habitual.' },
    relatedPaths: ['/templates/4-3-3-formation', '/templates/4-2-3-1-formation', '/templates/3-5-2-formation'],
  },
  {
    path: '/animate-football-tactics', kind: 'product', formationId: '3-5-2',
    title: { en: 'Animate football tactics without losing the coaching message', pl: 'Animuj taktykę piłkarską bez utraty przekazu trenerskiego', es: 'Anima tácticas de fútbol sin perder el mensaje del entrenador' },
    metaTitle: { en: 'Animate Football Tactics Online | TMC Studio', pl: 'Animowanie taktyki piłkarskiej online | TMC Studio', es: 'Animar tácticas de fútbol online | TMC Studio' },
    metaDescription: { en: 'Create tactical steps, move players and the ball, preview the sequence and export football animations from your browser.', pl: 'Twórz kroki taktyczne, przesuwaj zawodników i piłkę, odtwarzaj sekwencję i eksportuj animacje w przeglądarce.', es: 'Crea pasos tácticos, mueve jugadores y balón, reproduce la secuencia y exporta animaciones desde el navegador.' },
    eyebrow: { en: 'Animate a play', pl: 'Animuj akcję', es: 'Anima una jugada' },
    lead: { en: 'Break a tactical action into moments that can be checked separately. This makes it easier to refine positions and arrows before turning the sequence into an animation.', pl: 'Podziel działanie taktyczne na momenty, które można sprawdzać osobno. Łatwiej dopracujesz pozycje i strzałki, zanim zmienisz sekwencję w animację.', es: 'Divide una acción táctica en momentos revisables por separado. Así puedes ajustar posiciones y flechas antes de convertir la secuencia en animación.' },
    visualLabel: { en: '3-5-2 animated tactic starting point', pl: 'Punkt wyjścia animacji 3-5-2', es: 'Punto de partida para animación 3-5-2' },
    primaryCta: { en: 'Animate a tactic', pl: 'Animuj taktykę', es: 'Animar una táctica' },
    proofTitle: { en: 'From static frame to sequence', pl: 'Od statycznej klatki do sekwencji', es: 'Del cuadro estático a la secuencia' },
    proofBody: { en: 'Steps preserve element positions for each moment. Playback interpolates between them, while arrows and labels can explain what the movement means.', pl: 'Kroki zachowują pozycje elementów w każdym momencie. Odtwarzanie interpoluje ruch między nimi, a strzałki i opisy wyjaśniają jego znaczenie.', es: 'Los pasos guardan las posiciones de cada momento. La reproducción interpola el movimiento y las flechas o etiquetas explican su sentido.' },
    benefits: { en: ['Review each tactical moment independently', 'Control step order and duration', 'Export GIF on Pro or Team'], pl: ['Sprawdzaj każdy moment niezależnie', 'Kontroluj kolejność i czas kroków', 'Eksportuj GIF w Pro lub Team'], es: ['Revisa cada momento por separado', 'Controla orden y duración de pasos', 'Exporta GIF con Pro o Team'] },
    steps: { en: [{ title: 'Create the reference step', body: 'Set the shape and ball position before movement.' }, { title: 'Duplicate and change', body: 'Add a step, then move only what changes.' }, { title: 'Use playback as a review', body: 'Check spacing and clarity before export.' }], pl: [{ title: 'Utwórz krok odniesienia', body: 'Ustaw formację i pozycję piłki przed ruchem.' }, { title: 'Powiel i zmień', body: 'Dodaj krok, a potem przesuń tylko to, co się zmienia.' }, { title: 'Odtwarzaj jako kontrolę', body: 'Sprawdź odległości i czytelność przed eksportem.' }], es: [{ title: 'Crea el paso de referencia', body: 'Define la estructura y la posición del balón antes del movimiento.' }, { title: 'Duplica y cambia', body: 'Añade un paso y mueve solo lo que cambia.' }, { title: 'Reproduce para revisar', body: 'Comprueba distancias y claridad antes de exportar.' }] },
    note: { en: 'Animation export is a paid feature; building and previewing steps is available before upgrade within plan limits.', pl: 'Eksport animacji jest płatny; budowanie i odtwarzanie kroków działa wcześniej w limitach danego planu.', es: 'La exportación de animaciones es de pago; crear y reproducir pasos está disponible antes de mejorar el plan, dentro de sus límites.' },
    relatedPaths: ['/soccer-animation-software', '/templates/3-5-2-formation', '/football-tactics-board'],
  },
];

const templateNames: Record<string, LocalizedText> = {
  '4-3-3': { en: '4-3-3 formation', pl: 'Formacja 4-3-3', es: 'Formación 4-3-3' },
  '4-4-2': { en: '4-4-2 formation', pl: 'Formacja 4-4-2', es: 'Formación 4-4-2' },
  '4-4-2-diamond': { en: '4-4-2 diamond formation', pl: 'Formacja 4-4-2 diament', es: 'Formación 4-4-2 en rombo' },
  '4-2-3-1': { en: '4-2-3-1 formation', pl: 'Formacja 4-2-3-1', es: 'Formación 4-2-3-1' },
  '3-5-2': { en: '3-5-2 formation', pl: 'Formacja 3-5-2', es: 'Formación 3-5-2' },
  '5-3-2': { en: '5-3-2 formation', pl: 'Formacja 5-3-2', es: 'Formación 5-3-2' },
};

const templateDescriptions: Record<string, { lead: LocalizedText; shape: LocalizedText; adapt: LocalizedText }> = {
  '4-3-3': {
    lead: { en: 'Start with a back four, a three-player midfield and three attackers. Open the preset on the board and adjust the distances to the phase you want to discuss.', pl: 'Zacznij od czwórki obrońców, trzech pomocników i trzech napastników. Otwórz preset i dopasuj odległości do omawianej fazy.', es: 'Empieza con línea de cuatro, tres centrocampistas y tres atacantes. Abre el preset y ajusta las distancias a la fase que quieres explicar.' },
    shape: { en: 'The preset uses one holding midfielder, two central midfielders and a wide front three.', pl: 'Preset zawiera jednego defensywnego pomocnika, dwóch środkowych i szeroką trójkę z przodu.', es: 'El preset usa un mediocentro defensivo, dos interiores y un trío de ataque abierto.' },
    adapt: { en: 'Move the wingers and full-backs to show width, pressing height or build-up positions.', pl: 'Przesuń skrzydłowych i bocznych obrońców, aby pokazać szerokość, wysokość pressingu lub rozegranie.', es: 'Mueve extremos y laterales para mostrar amplitud, altura de presión o salida.' },
  },
  '4-4-2': {
    lead: { en: 'Use two compact lines of four and a pair of forwards as a neutral starting point for defensive, pressing or direct-play explanations.', pl: 'Użyj dwóch linii po czterech i pary napastników jako neutralnego punktu wyjścia do obrony, pressingu lub gry bezpośredniej.', es: 'Usa dos líneas de cuatro y dos delanteros como punto de partida para explicar defensa, presión o juego directo.' },
    shape: { en: 'The preset places four midfielders on a flat line behind two forwards.', pl: 'Preset ustawia czterech pomocników w płaskiej linii za dwoma napastnikami.', es: 'El preset coloca cuatro centrocampistas en línea por detrás de dos delanteros.' },
    adapt: { en: 'Narrow the midfield for a compact block or move wide players higher to illustrate pressure.', pl: 'Zwęź pomoc w kompaktowym bloku albo przesuń skrzydłowych wyżej, aby pokazać pressing.', es: 'Estrecha el medio para un bloque compacto o adelanta las bandas para mostrar presión.' },
  },
  '4-4-2-diamond': {
    lead: { en: 'Load a midfield diamond with a holding player, two central midfielders and a number ten behind two forwards.', pl: 'Załaduj diament z defensywnym pomocnikiem, dwoma środkowymi i dziesiątką za parą napastników.', es: 'Carga un rombo con pivote, dos interiores y un mediapunta por detrás de dos delanteros.' },
    shape: { en: 'The narrow midfield creates four distinct central reference points.', pl: 'Wąski środek pola tworzy cztery wyraźne punkty odniesienia w centrum.', es: 'El centro estrecho crea cuatro referencias claras por dentro.' },
    adapt: { en: 'Use full-back positions and movement arrows to explain where width should come from.', pl: 'Użyj pozycji bocznych obrońców i strzałek, aby wyjaśnić źródło szerokości.', es: 'Usa la posición de los laterales y flechas para explicar de dónde llega la amplitud.' },
  },
  '4-2-3-1': {
    lead: { en: 'Start with a double pivot, three attacking midfielders and one forward. Adjust the lines for build-up, pressing or chance creation.', pl: 'Zacznij od podwójnego pivota, trzech ofensywnych pomocników i napastnika. Dopasuj linie do rozegrania, pressingu lub tworzenia sytuacji.', es: 'Empieza con doble pivote, tres mediapuntas y un delantero. Ajusta las líneas para salida, presión o creación.' },
    shape: { en: 'The preset separates the double pivot from a three-player attacking line.', pl: 'Preset oddziela podwójny pivot od trójki ofensywnych pomocników.', es: 'El preset separa el doble pivote de una línea de tres mediapuntas.' },
    adapt: { en: 'Move one pivot or the number ten to make the intended midfield relationship explicit.', pl: 'Przesuń jednego pivota lub dziesiątkę, aby jasno pokazać relację w środku pola.', es: 'Mueve un pivote o el mediapunta para hacer explícita la relación en el centro.' },
  },
  '3-5-2': {
    lead: { en: 'Use three centre-backs, two wing-backs, a midfield three and two forwards as the starting structure.', pl: 'Użyj trzech stoperów, dwóch wahadłowych, trójki w środku i dwóch napastników jako ustawienia wyjściowego.', es: 'Usa tres centrales, dos carrileros, tres centrocampistas y dos delanteros como estructura inicial.' },
    shape: { en: 'The wing-backs sit outside a three-player midfield with two forwards ahead.', pl: 'Wahadłowi ustawiają się na zewnątrz trójki pomocników, przed którą gra para napastników.', es: 'Los carrileros quedan por fuera del centro del campo de tres, con dos puntas delante.' },
    adapt: { en: 'Change wing-back height and outside centre-back positions to show the phase of play.', pl: 'Zmieniaj wysokość wahadeł i pozycje skrajnych stoperów zależnie od fazy gry.', es: 'Cambia la altura de carrileros y centrales exteriores según la fase.' },
  },
  '5-3-2': {
    lead: { en: 'Begin with a five-player defensive line, a midfield three and two forwards for compact-block or transition explanations.', pl: 'Zacznij od piątki obrońców, trójki pomocników i dwóch napastników do pokazania kompaktowego bloku lub przejścia.', es: 'Empieza con línea de cinco, tres centrocampistas y dos delanteros para explicar bloque compacto o transición.' },
    shape: { en: 'The preset keeps both wing-backs on the defensive line and three central midfield references ahead.', pl: 'Preset utrzymuje oba wahadła w linii obrony i trzy punkty odniesienia w środku pola.', es: 'El preset mantiene ambos carrileros en la línea defensiva y tres referencias centrales por delante.' },
    adapt: { en: 'Move a wing-back forward or stagger the midfield to show the transition into possession.', pl: 'Przesuń wahadłowego wyżej lub ustaw pomocników schodkowo, aby pokazać przejście do ataku.', es: 'Adelanta un carrilero o escalona el medio para mostrar la transición con balón.' },
  },
};

const templatePathsById: Record<string, GrowthPagePath> = {
  '4-3-3': '/templates/4-3-3-formation',
  '4-4-2': '/templates/4-4-2-formation',
  '4-4-2-diamond': '/templates/4-4-2-diamond-formation',
  '4-2-3-1': '/templates/4-2-3-1-formation',
  '3-5-2': '/templates/3-5-2-formation',
  '5-3-2': '/templates/5-3-2-formation',
};

const templatePages: GrowthPageDefinition[] = Object.entries(templatePathsById).map(([formationId, path]) => {
  const name = templateNames[formationId];
  const description = templateDescriptions[formationId];
  const otherTemplates = Object.values(templatePathsById).filter((item) => item !== path).slice(0, 2);
  return {
    path,
    kind: 'template',
    formationId,
    title: { en: `${name.en}: editable online template`, pl: `${name.pl}: edytowalny szablon online`, es: `${name.es}: plantilla online editable` },
    metaTitle: { en: `${name.en} Template | TMC Studio`, pl: `${name.pl} - szablon | TMC Studio`, es: `Plantilla de ${name.es} | TMC Studio` },
    metaDescription: { en: `Open an editable ${name.en} with eleven players already positioned. Adjust the shape, add the opposition and export the board.`, pl: `Otwórz edytowalny szablon ${name.pl.toLowerCase()} z ustawioną jedenastką. Dopasuj strukturę, dodaj rywala i wyeksportuj tablicę.`, es: `Abre una ${name.es.toLowerCase()} editable con once jugadores colocados. Ajusta la estructura, añade rival y exporta la pizarra.` },
    eyebrow: { en: 'Formation template', pl: 'Szablon formacji', es: 'Plantilla de formación' },
    lead: description.lead,
    visualLabel: { en: `${name.en} pitch preview`, pl: `Podgląd: ${name.pl}`, es: `Vista previa: ${name.es}` },
    primaryCta: { en: 'Use this formation', pl: 'Użyj tej formacji', es: 'Usar esta formación' },
    proofTitle: { en: 'What the preset loads', pl: 'Co ładuje preset', es: 'Qué carga el preset' },
    proofBody: description.shape,
    benefits: {
      en: ['Eleven editable home-team players', 'Goalkeeper and shirt numbers included', 'One-click start from this page'],
      pl: ['Jedenastu edytowalnych gospodarzy', 'Bramkarz i numery koszulek w zestawie', 'Start jednym kliknięciem z tej strony'],
      es: ['Once jugadores locales editables', 'Portero y dorsales incluidos', 'Inicio con un clic desde esta página'],
    },
    steps: {
      en: [{ title: 'Open the preset', body: 'The board replaces the home team with this formation.' }, { title: 'Adapt the structure', body: description.adapt.en }, { title: 'Add the tactical message', body: 'Place opponents, the ball, arrows, zones or a second step.' }],
      pl: [{ title: 'Otwórz preset', body: 'Tablica zastąpi gospodarzy wybraną formacją.' }, { title: 'Dopasuj strukturę', body: description.adapt.pl }, { title: 'Dodaj przekaz taktyczny', body: 'Ustaw rywali, piłkę, strzałki, strefy albo drugi krok.' }],
      es: [{ title: 'Abre el preset', body: 'La pizarra sustituye al equipo local por esta formación.' }, { title: 'Ajusta la estructura', body: description.adapt.es }, { title: 'Añade el mensaje táctico', body: 'Coloca rivales, balón, flechas, zonas o un segundo paso.' }],
    },
    note: { en: 'This is a formation starting point, not a claim that one fixed shape solves every phase or opponent.', pl: 'To punkt wyjścia do pracy nad ustawieniem, a nie teza, że jeden kształt rozwiązuje każdą fazę i każdego rywala.', es: 'Es un punto de partida, no una afirmación de que una estructura resuelva todas las fases y rivales.' },
    relatedPaths: ['/football-formation-creator', ...otherTemplates],
  };
});

const definitions = [...productPages, ...templatePages];

export function isGrowthPagePath(path: string): path is GrowthPagePath {
  return GROWTH_PAGE_PATHS.includes(path as GrowthPagePath);
}

export function getGrowthPage(path: GrowthPagePath, language: Language): GrowthPageContent {
  const page = definitions.find((item) => item.path === path);
  if (!page) throw new Error(`Missing growth page content for ${path}`);
  return {
    path: page.path,
    kind: page.kind,
    formationId: page.formationId,
    title: page.title[language],
    metaTitle: page.metaTitle[language],
    metaDescription: page.metaDescription[language],
    eyebrow: page.eyebrow[language],
    lead: page.lead[language],
    visualLabel: page.visualLabel[language],
    primaryCta: page.primaryCta[language],
    proofTitle: page.proofTitle[language],
    proofBody: page.proofBody[language],
    benefits: page.benefits[language],
    steps: page.steps[language],
    note: page.note[language],
    relatedPaths: page.relatedPaths,
  };
}

export function getGrowthPageTitle(path: GrowthPagePath, language: Language): string {
  return getGrowthPage(path, language).title;
}
