# ProClean Solution

Website mit Preisrechner, Terminbuchung und Kundenassistent.

## Stand

Preis-Engine, Antwort-Engine, Designsystem, Startseite mit Scrollfilm,
wachsender Paketkarte, Rechner, Assistent, Navigation und Abspann stehen und
sind getestet (57 Unit-Tests, 102 Browser-Prüfungen). Buchungskalender und
Admin-Bereich folgen.

Standort Kloten, Einzugsgebiet Zürich und Umgebung. Währung CHF.

## Live-Vorschau

<https://riantetova.github.io/ProClean-Solution/>

Jeder Push auf den Standardbranch baut und veröffentlicht neu; Tests und
Typprüfung laufen davor. Möglich ist das, weil die Seite vollständig im
Browser läuft — kein Server, keine API-Routen, keine Server Actions.

### Adresse

Der Basispfad wird nicht von Hand gepflegt, sondern im Build aus dem Ort des
Repositorys abgeleitet:

| Repository | Adresse | Basispfad |
|---|---|---|
| `Riantetova/ProClean-Solution` | riantetova.github.io/ProClean-Solution/ | `/ProClean-Solution` |
| `ProCleanSolution/procleansolution.github.io` | procleansolution.github.io/ | – |
| beliebig, mit `PAGES_DOMAIN` | die eigene Domain | – |

Ein Umzug oder eine Umbenennung braucht deshalb keine Codeänderung. Wichtig
ist nur: für eine Adresse **ohne** Unterpfad muss das Repository exakt
`<organisation>.github.io` heissen.

### Eigene Domain

Im Workflow steht ganz oben `PAGES_DOMAIN`. Sobald dort eine Domain
eingetragen ist, baut der nächste Lauf für die Wurzel statt für einen
Unterpfad und legt die passende `CNAME`-Datei an. Beides muss zusammen
passen — mit Domain, aber altem Basispfad lädt die Seite ohne Stylesheet.

Beim Registrar sind dazu diese Einträge nötig:

| Typ | Name | Wert |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | `<kontoname>.github.io` |

HTTPS stellt GitHub danach selbst aus („Enforce HTTPS" in Settings → Pages).

### Auslieferung

Veröffentlicht wird über den Branch `gh-pages` — reines Ergebnis, wird bei
jedem Lauf überschrieben. Dieser Weg wurde gewählt, weil die
Pages-Deployment-API voraussetzt, dass jemand von Hand
Settings → Pages → Source auf „GitHub Actions" umstellt: ein Workflow darf
eine Pages-Seite nicht selbst anlegen. Beim Anlegen eines `gh-pages`-Branches
schaltet GitHub die Vorschau bei öffentlichen Repositories dagegen von selbst
ein. Es ist also kein Handgriff mehr nötig.

Dieselbe Version lokal:

```bash
npm run preview          # baut nach out/
npm run preview:serve    # baut und liefert auf :3200 aus
```

## Entwicklung

```bash
npm install
npm run dev          # Entwicklungsserver
npm test             # Unit-Tests (Preis- und Antwort-Engine)
npm run build        # Produktionsbuild
npm run test:e2e     # Browser-Smoke-Test gegen einen laufenden Server
node e2e/shots.mjs   # Screenshots über den ganzen Scrollverlauf
```

Für `test:e2e` muss die Seite laufen (`npm run build && npm start -- -p 3100`).
Basis-URL über `SMOKE_URL` überschreibbar.

## Architektur

### Preise: eine einzige Quelle

Alle Preise stehen in `src/lib/pricing/catalog.ts`. Gerechnet wird ausschliesslich
in `calculateQuote()` (`src/lib/pricing/engine.ts`) — einer reinen Funktion ohne
Netzwerkzugriff. Rechner, Assistent und später das interne Angebots-Tool rufen
alle dieselbe Funktion. Es gibt bewusst keine zweite Preislogik.

Beträge werden durchgehend als ganzzahlige Cent geführt, nie als Fliesskommazahl.

### Kundenassistent: ohne Sprachmodell

`src/lib/answers/` beantwortet Kundenfragen aus einer handgeschriebenen
Wissensbasis (`knowledge.ts`) über eine wortbasierte Ähnlichkeitssuche
(`match.ts`). Das läuft vollständig im Browser.

Der Grund gegen ein Sprachmodell ist nicht nur der Preis: Kostenlose LLM-Zugänge
haben Rate-Limits, und ein Kunde, der wegen eines Limits keine Antwort bekommt,
ist schlechter bedient als mit einer knappen, aber verlässlichen Auskunft.

`answer()` gibt garantiert immer ein Ergebnis mit nicht-leerem Text und
mindestens einem Kontaktweg zurück. Bei unsicherer Zuordnung fragt sie nach,
statt zu raten; bei themenfremden Fragen leitet sie an einen Menschen weiter.
Diese Garantie ist in `engine.test.ts` festgeschrieben.

Neue Fragen werden einfach in `knowledge.ts` ergänzt — der Index baut sich selbst.

## Cinematic Intro

Beim Öffnen der Startseite läuft ein scrollgesteuerter Markenfilm, der nahtlos
in die bestehende Website übergeht. `src/components/intro/`.

### Der Aufbau

`IntroShell` umschliesst den **bestehenden** Hero — dieselbe Komponente, dieselbe
Stelle im Dokument, eine H1. Der Hero liegt damit *hinter* dem Glas, nicht
darunter. Deshalb wird die Website am Ende nicht eingeblendet, sondern durch das
gereinigte Glas sichtbar. Es gibt keine zweite Fassung der Inhalte.

Sechs Ebenen im gepinnten Bildschirm, von hinten nach vorn:
bestehender Hero · dunkle Studiobühne · Glasscheibe · 3D-Szene · zwei Aussagen ·
Scrollhinweis.

### Die Timeline

Vollständig am Scroll, nichts läuft von selbst. Jeder Frame berechnet **absolute**
Werte aus dem Fortschritt statt zu inkrementieren — nur so fährt Rückwärtsscrollen
den Film exakt zurück. Die Abschnitte stehen in `progress.ts`:

| Fortschritt | Was passiert |
|---|---|
| 0–15 % | fast dunkel, nur Lichtkanten zeichnen die Silhouette |
| 15–30 % | Flasche wird sichtbar, Kamera fährt näher |
| 30–45 % | Drehung |
| 45–60 % | Etikett dreht sich zur Kamera |
| 60–70 % | Kippen, Düse zielt auf das Glas |
| 70–80 % | Abzug, Sprühbeginn |
| 80–90 % | Nebel, Tröpfchen treffen das Glas |
| 88–100 % | Glas wird sauber, Website erscheint, Flasche fährt aus dem Bild |

### Sprühnebel

Ein einziges `THREE.Points` mit eigenem Shader (`spray.tsx`). Jedes Partikel trägt
Richtung im Kegel, Startzeit, Lebensdauer, Grösse und Turbulenzphase als Attribut;
die Bewegung rechnet der Vertex-Shader. Pro Frame wird auf der CPU **eine** Uniform
gesetzt, kein Positionsarray umgeschrieben. Grössenverteilung `pow(random, 2.4)` —
viele winzige, wenige grosse Tröpfchen. Dazu Tiefenabfall und weiche Auflösung.

### Glas

`GlassPane` plus `.intro-glass` in `globals.css`. Drei Schichten (Weichzeichner,
Schlieren, Tröpfchen) teilen sich eine Maske aus vier Radialverläufen mit
unterschiedlichem Tempo, verrechnet über `mask-composite: intersect`: wo *eine*
Stelle sauber ist, fällt die Schicht weg. Das ergibt einen unregelmässigen Wisch
statt einer Blende.

**Ehrliche Grenze:** Echte Refraktion des Hintergrunds kann CSS nicht.
`backdrop-filter` kann weichzeichnen und entsättigen, nicht verzerren. Die
Verzerrung liegt deshalb über `feDisplacementMap` auf der Schmutzschicht selbst.

### Platzhalter-Flasche

`bottle.tsx` ist prozedural: Lathe-Silhouette, Flüssigkeit, Etikett als
Canvas-Textur, Kragen, Sprühkopf, Abzug, Düse, Steigrohr.

**Ein fertiges .glb tritt an genau einer Stelle ein**: im Block unter dem Kommentar
`MODELL-TAUSCH`. Gruppe, Name und Ref bleiben, die Timeline greift nur auf die
Gruppe und die benannten Teile zu (`body`, `liquid`, `label`, `head`, `trigger`,
`nozzle`) — sie muss beim Tausch nicht angefasst werden.

### Leistung

- 3D wird erst **nach dem ersten Bild** geladen (`requestIdleCallback`).
  Gemessen: 842 KB JS bis `load`, die 885 KB der Szene danach.
- Nach dem Film wird der Canvas abgebaut und gibt seinen Speicher frei.
- Schwächere Geräte behalten die volle Sequenz, nur sparsamer: 700 statt 2400
  Partikel, gröbere Auflösung, kein Antialiasing, transparentes Material statt
  Transmission, gröbere Geometrie. Kein Abschalten des Intros.
- Bei `prefers-reduced-motion: reduce` läuft gar kein Film — die Website startet
  direkt, und `IntroShell` reicht ihre Kinder unverändert durch.

## Design

Abfolge dunkler "Bühnen" und heller Arbeitsflächen. Die Bühne (`.stage` in
`globals.css`) ist in beiden Themes dunkel — wie eine Apple-Produktseite eine
gestaltete Fläche, kein Theme-Fehler. Sie bringt ihren eigenen, helleren
Goldton mit, weil der Theme-Akzent auf Schwarz nur knapp über die
Kontrastschwelle kommt.

**Magnetische Knöpfe** (`magnetic.tsx`) an den zwei wichtigsten Schaltflächen,
**Mask-Reveals** (`reveal.tsx`) an den grossen Überschriften. Bewusst nicht
überall: Motion wirkt hochwertig, wenn sie selten ist.

**Der 3D-Raum** (`room-scene.tsx`, `room-viewer.tsx`) sitzt im Rechner und wächst
mit dem Flächenregler: aus "150 m²" wird ein Raum mit Massen, Arbeitsplätzen und
einem Boden, den man drehen kann. Prozedural aus der Quadratmeterzahl erzeugt,
ohne eine einzige Asset-Datei — Three.js mit React Three Fiber, ohne `drei`
(die Drehung sind zwanzig Zeilen, das Paket wären ein paar hundert Kilobyte).

Der Boden wechselt über `clean` seine Rauheit: schmutzig ist matt und schluckt
das Licht, sauber spiegelt. Das ist der sichtbare Unterschied, den die Arbeit macht.

Three.js kostet rund 870 KB und darf deshalb **niemals** im ersten Laden stecken:

- `next/dynamic` mit `ssr: false`
- geladen erst, wenn ein `IntersectionObserver` den Rechner in Sichtweite meldet
- bei `prefers-reduced-motion: reduce` gar nicht — dann zeigt eine massstäbliche
  SVG-Grundriss-Skizze dieselbe Information
- `roomFor()` liegt in `room-dimensions.ts` ohne three.js-Import, damit die
  Beschriftung die Bibliothek nicht ins Hauptbündel zieht

Gemessen: 831 KB JS beim ersten Laden, die 867 KB der 3D-Szene kommen erst beim
Scrollen dazu.

**Der Wisch** (`clean-sweep.tsx`) ist die einzige gepinnte Sektion: beim
Scrollen fährt eine Kante über eine Fläche und lässt sie sauber zurück, die
Beschriftung wechselt dabei von "Vorher" auf "Nachher". Zwei CSS-Verläufe
übereinander, die obere per `clip-path` aufgezogen — kein Bild, keine
Ladezeit, in jeder Auflösung scharf.

Regeln, an die sich alle Animationen halten:

- **Ruhezustand zuerst.** Ohne JavaScript und bei reduzierter Bewegung zeigt
  jede Sektion ihren Endzustand. Nichts wird auf `opacity: 0` geparkt.
- `gsap.matchMedia("(prefers-reduced-motion: no-preference)")` umschliesst
  jede Bewegung.
- Parallax nur auf dekorativen Flächen, nie auf Fliesstext.
- Höchstens eine gepinnte Sektion, `scrub` zwischen 0,5 und 1,5.
- Lenis läuft nur, wenn Bewegung erlaubt ist, und teilt seinen Takt mit
  ScrollTrigger.

## Preismodell

Nach Zeit, nicht nach Quadratmetern. Grundlage sind Florijans Angaben:

| | Standard | Abo, 12 Monate |
|---|---|---|
| pro Stunde | CHF 99.00 | CHF 82.50 |
| 100 m² wöchentlich, pro Termin | CHF 99.00 | CHF 82.50 |
| 100 m² wöchentlich, pro Monat | CHF 396.00 | CHF 330.00 |
| 150 m² (1,5 Std.), pro Termin | CHF 148.50 | CHF 123.75 |

100 m² entsprechen einer Stunde. Die Zimmerzahl geht bewusst nicht in die
Rechnung ein — es gibt kein Feld dafür. Enthalten sind Staubsaugen, Wischen,
WC und Nasszellen, Abfalleimer, Tische und Türgriffe. Fensterreinigung kostet
extra und hat noch keinen hinterlegten Preis: Der Rechner weist sie als offenen
Punkt aus und schätzt nichts.

Diese Zahlen stehen als Tests in `src/lib/pricing/engine.test.ts` — ändert
jemand den Katalog, schlägt der Referenzfall fehl.

## Offene Punkte vor dem Livegang

- [ ] **Fensterpreis festlegen** — `EXTRAS.fenster.priceCents` in `catalog.ts`.
      Solange `null`, führt Fensterreinigung zu einer Anfrage statt zu einem Preis.
- [ ] **MWST prüfen** — angenommen ist *nicht* pflichtig (unter CHF 100'000
      Jahresumsatz). Bei Pflicht `vatRegistered: true` setzen, dann weist der
      Rechner 8,1 % aus.
- [ ] **13 Antworten bestätigen** — alles mit `status: "entwurf"` in
      `src/lib/answers/knowledge.ts` ist von mir plausibel formuliert, aber nicht
      von Florijan bestätigt. Betrifft unter anderem Versicherung, Zahlungsart
      und Schlüsselübergabe.
- [ ] E-Mail-Adresse in `src/config/business.ts`.
- [ ] Skalierung über 200 m² bestätigen — grosse Flächen gehen pro m² meist schneller.
- [ ] Impressum, Datenschutzerklärung, AGB — anwaltlich prüfen lassen.
- [ ] Buchungskalender mit Verfügbarkeiten, Fahrzeiten und Doppelbuchungsschutz.
- [ ] Admin-Bereich für Buchungen, Preise und Personal.
- [ ] Lokales SEO: LocalBusiness-Schema, Landingpages je Einzugsgebiet.
