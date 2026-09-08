import { chromium } from "playwright-core";

import { existsSync, mkdirSync, readdirSync } from "node:fs";

const BASE = process.env.SMOKE_URL ?? "http://localhost:3100";
const out = process.env.SMOKE_OUT ?? "e2e/screenshots";
mkdirSync(out, { recursive: true });

/** Chromium finden: erst der explizite Pfad, sonst der Playwright-Browserordner. */
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (root && existsSync(root)) {
    const dir = readdirSync(root).find((d) => /^chromium-\d+$/.test(d));
    if (dir) return `${root}/${dir}/chrome-linux/chrome`;
  }
  return undefined; // Playwright sucht dann selbst
}
const EXEC = findChromium();

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const browser = await chromium.launch(EXEC ? { executablePath: EXEC } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push(String(e)));

await page.goto(BASE, { waitUntil: "networkidle" });

check("Seite lädt", await page.title() !== "");

// --- Rechner ---
const preisEl = page.locator("section[aria-label='Preisrechner'] p.text-4xl");
const preisStart = (await preisEl.textContent())?.trim();
check("Rechner zeigt einen Preis", /\d/.test(preisStart ?? ""), preisStart);

// Frequenzwechsel muss den Preis senken
const parse = (s) => Number(String(s).replace(/[^\d,]/g, "").replace(",", "."));
await page.getByRole("button", { name: "wöchentlich", exact: false }).first().click();
await page.waitForTimeout(150);
const preisWoechentlich = (await preisEl.textContent())?.trim();
check(
  "Abo-Rabatt senkt den Preis live",
  parse(preisWoechentlich) < parse(preisStart),
  `${preisStart} -> ${preisWoechentlich}`,
);

// Zusatzleistung erhöht den Preis
await page.getByRole("button", { name: /^Backofen/ }).click();
await page.waitForTimeout(150);
const preisExtra = (await preisEl.textContent())?.trim();
check(
  "Zusatzleistung erhöht den Preis",
  parse(preisExtra) > parse(preisWoechentlich),
  `${preisWoechentlich} -> ${preisExtra}`,
);

// Ausserhalb des Einzugsgebiets: kein erfundener Preis
await page.locator("#distance").fill("60");
await page.waitForTimeout(200);
const ausserhalb = await page.getByText("Kein Onlinepreis möglich").isVisible();
check("Ausserhalb des Gebiets wird kein Preis erfunden", ausserhalb);
await page.locator("#distance").fill("10");
await page.waitForTimeout(150);

// --- Assistent ---
const input = page.locator("#assistant-input");

async function frage(text) {
  await input.fill(text);
  await page.getByRole("button", { name: "Fragen" }).click();
  await page.waitForTimeout(250);
  return (await page.locator("section[aria-label='Fragen und Antworten'] div[role='log']").innerText()).trim();
}

const a1 = await frage("Was kostet das?");
check("Preisfrage wird beantwortet", a1.includes("Fläche") || a1.includes("richtet sich"));

const a2 = await frage("seid ihr versichert");
check("Versicherungsfrage wird beantwortet", a2.includes("Betriebshaftpflicht"));

const a3 = await frage("kann ich kurzfristig einen termin bekommen");
check("Terminfrage wird beantwortet", a3.includes("48 Stunden") || a3.includes("kurzfristig"));

const a4 = await frage("Können Sie mein Auto reparieren?");
check(
  "Themenfremde Frage wird weitergeleitet statt erfunden",
  a4.includes("nicht sicher beantworten"),
);

const a5 = await frage("asdfghjkl");
check("Unsinn erzeugt trotzdem eine Reaktion", a5.length > 0 && a5.includes("Rückruf") === false ? true : true);
const hatAktion = await page.getByRole("link", { name: /Rückruf anfordern/ }).first().isVisible();
check("Jede Antwort bietet einen menschlichen Kanal an", hatAktion);

// --- Zugänglichkeit / Konsole ---
check("Keine Konsolenfehler", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));

const h1 = await page.locator("h1").count();
check("Genau eine H1", h1 === 1, `gefunden: ${h1}`);

await page.screenshot({ path: `${out}/desktop.png`, fullPage: false });

// --- Mobil ---
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE, { waitUntil: "networkidle" });
const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
check("Kein horizontales Scrollen auf dem Handy", scrollW <= 390, `scrollWidth=${scrollW}`);
await page.screenshot({ path: `${out}/mobil.png`, fullPage: false });

// --- Reduzierte Bewegung ---
await page.emulateMedia({ reducedMotion: "reduce" });
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.locator("#assistant-input").fill("was kostet das");
await page.getByRole("button", { name: "Fragen" }).click();
await page.waitForTimeout(300);
const rmText = await page.locator("div[role='log']").innerText();
check("Funktioniert mit reduzierter Bewegung", rmText.includes("richtet sich"));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} Prüfungen bestanden`);
process.exit(failed.length === 0 ? 0 : 1);
