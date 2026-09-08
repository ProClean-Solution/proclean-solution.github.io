# ProClean Solution

Website mit Preisrechner, Terminbuchung und Kundenassistent.

## Stand

**Phase 1 (Fundament) — begonnen.** Preis-Engine, Antwort-Engine, Designsystem und
Startseite stehen und sind getestet. Buchungskalender, Admin-Bereich und die
kinematische Ebene folgen.

## Entwicklung

```bash
npm install
npm run dev          # Entwicklungsserver
npm test             # Unit-Tests (Preis- und Antwort-Engine)
npm run build        # Produktionsbuild
npm run test:e2e     # Browser-Smoke-Test gegen einen laufenden Server
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

## Offene Punkte vor dem Livegang

- [ ] **Preise ersetzen.** `catalog.ts` enthält Platzhalterwerte.
- [ ] **Stammdaten ersetzen.** Telefon, E-Mail und Firmierung in `src/config/business.ts`.
- [ ] **Land prüfen.** Angenommen sind Deutschland, EUR und 19 % USt.; für
      Österreich oder die Schweiz nur `src/config/business.ts` anpassen.
- [ ] Impressum, Datenschutzerklärung, AGB, Widerrufsbelehrung — anwaltlich prüfen lassen.
- [ ] Buchungskalender mit Verfügbarkeiten, Fahrzeiten und Doppelbuchungsschutz.
- [ ] Admin-Bereich für Buchungen, Preise und Personal.
- [ ] Lokales SEO: LocalBusiness-Schema, Landingpages je Einzugsgebiet.
