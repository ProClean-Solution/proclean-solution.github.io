# Installierte Agent Skills

Design-, Motion- und Taste-Skills für Claude Code, aus öffentlichen GitHub-Repos übernommen.

| Skill | Verzeichnis | Quelle | Commit | Lizenz |
|---|---|---|---|---|
| `ui-ux-pro-max` | `ui-ux-pro-max/` | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `4aad058` (2026-09-06), v2.13.0 | MIT (`ui-ux-pro-max/LICENSE`) |
| `impeccable` | `impeccable/` | https://github.com/pbakaus/impeccable | `2bc2879` (2026-09-08), v4.2.2 | Apache 2.0 (`impeccable/LICENSE`, `impeccable/NOTICE.md`) |
| `taste` | `taste/` | https://github.com/senlindesign/taste-skill | `6dce223` (2026-07-07) | MIT laut README-Badge (keine LICENSE-Datei im Upstream-Repo) |
| `framer-motion` | `framer-motion/` | https://github.com/Schoepplake/framer-motion-skill | `1d984d5` (2026-03-20) | MIT laut README (keine LICENSE-Datei im Upstream-Repo) |
| `design-motion-principles` | `design-motion-principles/` | https://github.com/kylezantos/design-motion-principles | `4a9ca87` (2026-05-30) | MIT (`design-motion-principles/LICENSE`) |
| `animate` | `animate/` | https://github.com/delphi-ai/animate-skill | `71bc617` (2026-01-28) | Keine Lizenzdatei im Upstream-Repo |

## Was die Skills tun

**ui-ux-pro-max** — Durchsuchbare Design-Intelligenz als lokale CSV-Datenbank:
79 Styles, 192 Produkt-Paletten mit Reasoning-Profilen, 74 Font-Pairings, 119
UX-Guidelines, 105 Icons, 17 GSAP-Presets, 25 Chart-Typen und 22 Tech-Stacks
(React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui …).

Abfrage per Python-Script, kein Netz und keine Dependencies nötig:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack nextjs
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "cleaning service booking" --design-system -p "ProClean"
```

Braucht Python 3.x. Angepasst gegenüber Upstream: die Script-Pfade in `SKILL.md`
standen in der Plugin-Form `${CLAUDE_PLUGIN_ROOT}/.claude/skills/ui-ux-pro-max/…`,
die es bei einem Projekt-Skill nicht gibt — 11 Stellen auf `${CLAUDE_SKILL_DIR}/…`
umgeschrieben. `scripts/tests/` ist nicht mitkopiert (setzt das Upstream-Repo-Layout
voraus).

**impeccable** — Design-Fluency fürs Frontend. Ein Skill mit 23 Sub-Commands
(`/impeccable init`, `polish`, `audit`, `critique`, `distill`, `animate`, `bolder`,
`quieter`, `typeset`, `colorize`, `layout`, `live` …) plus deterministischer
Anti-Pattern-Erkennung. Startpunkt für ein neues Projekt ist `/impeccable init` —
das legt `PRODUCT.md` und `DESIGN.md` im Repo-Root an.

Die vier zugehörigen Subagenten liegen in `.claude/agents/`
(`impeccable-finish-reviewer`, `-documenter`, `-asset-producer`,
`-manual-edit-applier`).

**taste** — Reverse-Engineering der Design-Taste beliebiger Websites. `/taste <url>`
erzeugt `{domain}.md` + `{domain}.json` mit konkreten Tokens (Farben, Typo, Spacing,
Radii, Shadows, Grid) und der „Taste-DNA" (Trigger → Decision → Reason → Evidence).
**Benötigt den Playwright-MCP-Server** — siehe `.mcp.json` im Repo-Root.

**framer-motion** — API-Referenz für die Motion-Library (v12+, ehemals Framer Motion)
in React/Next.js: Imports nach dem Rebrand (`motion/react`, `motion/react-client` für
Server Components), MotionValues, Transitions, `AnimatePresence`, Scroll-Linked und
Layout-Animationen, Gestures, Drag, `useReducedMotion`, Performance-Regeln, typische
Fehler und fertige Rezepte (Progress Bar, Animated Counter, Page Transition,
Shimmer-Text).

Ergänzt `animate/references/framer-motion.md`, das noch vom alten `framer-motion`-Paket
ausgeht und weder `motion/react`, Server Components noch `useReducedMotion` kennt. Bei
Widersprüchen gilt dieser Skill.

**design-motion-principles** — Zwei Modi:
- *Create*: interaktive Komponenten mit gezielter Motion bauen (`workflows/create.md`)
- *Audit*: bestehende Animationen prüfen und einen HTML-Report mit Loop-Demos erzeugen (`workflows/audit.md`)

Referenzen pro Designer: Emil Kowalski, Jakub Krehel, Jhey Tompkins.

**animate** — Animationsmuster für Next.js/React auf Basis von Emil Kowalskis Kurs
„Animations on the Web": CSS-Animationen, Framer Motion, Easing/Timing, Performance
und Accessibility, plus acht fertige Beispielkomponenten in `examples/`.

## MCP-Server (Figma + Playwright)

`.mcp.json` im Repo-Root verbindet beide Server für alle, die in diesem Projekt arbeiten:

| Server | Transport | Zweck |
|---|---|---|
| `figma` | HTTP, `https://mcp.figma.com/mcp` | Designs aus Figma in Code lesen und Designs zurück nach Figma schreiben; Code Connect |
| `playwright` | stdio, `npx -y @playwright/mcp@latest --isolated` | Echter Browser für `/taste`, `/impeccable audit` und visuelle Verifikation |

Beim nächsten Start von Claude Code im Projekt wird die Freigabe der Server abgefragt.
Status prüfen mit `/mcp` bzw. `claude mcp list`.

- **Figma**: Der Remote-Server erfordert einen einmaligen OAuth-Login (Figma-Account mit
  Dev-Mode-Zugriff). Wer lieber die Figma-Desktop-App nutzt: Dev Mode MCP Server dort
  aktivieren und in `.mcp.json` die URL auf `http://127.0.0.1:3845/mcp` ändern.
- **Playwright**: `--isolated` startet jeden Lauf mit frischem Browser-State, damit
  Cookies und Logins nicht in die Analyse leaken. Browser einmalig installieren mit
  `npx playwright install chromium`.

## Nicht installiert

Das ui-ux-pro-max-Repo enthält sechs weitere Skills, die hier bewusst nicht
mitinstalliert sind: `design`, `design-system`, `brand`, `ui-styling`,
`banner-design`, `slides`. Bei Bedarf einzeln aus
`.claude/skills/` des Upstream-Repos nachkopieren.

Impeccable bringt optionale Hooks mit (`PostToolUse` auf Edit/Write und `Stop`), die nach
jeder Dateiänderung automatisch die Design-Prüfung laufen lassen. Die sind hier bewusst
**nicht** aktiviert. Wer sie will, trägt sie in `.claude/settings.json` nach — Vorlage:
`plugin/hooks/hooks.json` im Impeccable-Repo.

## Aktualisieren

Skills sind hier als Kopie eingecheckt (kein Submodule). Zum Aktualisieren das jeweilige
Repo neu klonen und den Skill-Ordner ersetzen. Für Impeccable gibt es alternativ den
offiziellen Weg `npx impeccable update`.
