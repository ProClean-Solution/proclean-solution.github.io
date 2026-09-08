# ProClean Solution

Website mit Preisrechner, Terminbuchung und Kundenassistent.

## Stand

**Phase 1 (Fundament) — begonnen.** Preis-Engine, Antwort-Engine, Designsystem und
Startseite stehen und sind getestet (33 Unit-Tests, 19 Browser-Prüfungen).
Buchungskalender, Admin-Bereich und die kinematische Ebene folgen.

Standort Kloten, Einzugsgebiet Zürich und Umgebung. Währung CHF.

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

## Design

Abfolge dunkler "Bühnen" und heller Arbeitsflächen. Die Bühne (`.stage` in
`globals.css`) ist in beiden Themes dunkel — wie eine Apple-Produktseite eine
gestaltete Fläche, kein Theme-Fehler. Sie bringt ihren eigenen, helleren
Goldton mit, weil der Theme-Akzent auf Schwarz nur knapp über die
Kontrastschwelle kommt.

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
