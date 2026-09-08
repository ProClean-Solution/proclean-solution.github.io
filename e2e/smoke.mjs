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
check("Seite lädt", (await page.title()) !== "");

// ---------- Cinematic Intro ----------
await page.waitForTimeout(2200); // 3D nachladen lassen

const introMasse = await page.evaluate(() => {
  const glas = document.querySelector(".intro-glass");
  const sticky = glas?.parentElement;
  const section = sticky?.parentElement;
  return {
    vorhanden: !!glas,
    sectionHoehe: section?.getBoundingClientRect().height ?? 0,
    sticky: sticky ? getComputedStyle(sticky).position : "-",
    canvas: document.querySelectorAll("canvas").length,
    einH1: document.querySelectorAll("h1").length,
  };
});
check("Intro ist aktiv", introMasse.vorhanden);
check("Intro-Sektion gibt Scrollraum", introMasse.sectionHoehe > window_innerHeight() * 3, `${Math.round(introMasse.sectionHoehe)}px`);
check("Bühne bleibt gepinnt", introMasse.sticky === "sticky");
check("Genau eine H1 trotz Intro", introMasse.einH1 === 1, `gefunden: ${introMasse.einH1}`);

function window_innerHeight() {
  return 900; // Viewport dieser Prüfung
}

const introEnde = 900 * 3.2;
const lese = () =>
  page.evaluate(() => {
    const g = document.querySelector(".intro-glass");
    const s = document.querySelector(".intro-stage");
    return {
      clean: g ? parseFloat(getComputedStyle(g).getPropertyValue("--clean")) : NaN,
      stage: s ? parseFloat(getComputedStyle(s).getPropertyValue("--stage-opacity")) : NaN,
    };
  });

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
const amAnfang = await lese();
check("Am Anfang ist das Glas blind", amAnfang.clean === 0, `clean=${amAnfang.clean}`);

await page.evaluate((y) => window.scrollTo(0, y), Math.round(introEnde));
await page.waitForTimeout(700);
const amEnde = await lese();
check("Am Ende ist das Glas klar", amEnde.clean === 1, `clean=${amEnde.clean}`);
check("Am Ende ist die Bühne weg", amEnde.stage === 0, `stage=${amEnde.stage}`);
check(
  "Website ist danach bedienbar",
  await page.getByRole("link", { name: "Preis berechnen" }).first().isVisible(),
);
check(
  "3D-Canvas wird nach dem Film abgebaut",
  (await page.locator(".intro-glass").locator("xpath=..").locator("canvas").count()) === 0,
);

// Rückwärts: der Film muss kontrolliert zurücklaufen, nicht nur vorwärts
await page.evaluate((y) => window.scrollTo(0, y), Math.round(introEnde * 0.3));
await page.waitForTimeout(700);
const zurueck = await lese();
check("Rückwärtsscrollen fährt den Film zurück", zurueck.clean === 0 && zurueck.stage === 1,
  `clean=${zurueck.clean} stage=${zurueck.stage}`);

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);

// ---------- Rechner ----------
const preisEl = page.locator("section[aria-label='Preisrechner'] p.text-4xl");
const parse = (s) => Number(String(s).replace(/[^\d.]/g, ""));

const startpreis = (await preisEl.textContent())?.trim();
check(
  "Referenzfall: 100 m² wöchentlich ergibt CHF 396.00 im Monat",
  parse(startpreis) === 396,
  startpreis,
);

// Tarifwechsel muss den Preis senken — Florijans Abopreis
await page.getByRole("button", { name: /Abo 12 Monate/ }).click();
await page.waitForTimeout(150);
const aboPreis = (await preisEl.textContent())?.trim();
check("Abo ergibt CHF 330.00 im Monat", parse(aboPreis) === 330, aboPreis);

// 150 m² im Abo: Florijans eigene Rechnung, 123.75 pro Termin
await page.locator("#sqm").fill("150");
await page.waitForTimeout(200);
const proTermin = await page
  .locator("section[aria-label='Preisrechner']")
  .getByText(/à CHF/)
  .first()
  .textContent();
check(
  "150 m² im Abo kosten CHF 123.75 pro Termin",
  /123\.75/.test(proTermin ?? ""),
  proTermin?.trim(),
);
await page.locator("#sqm").fill("100");
await page.waitForTimeout(150);

// Fensterreinigung darf keinen Preis erfinden
await page.getByRole("button", { name: /^Fensterreinigung/ }).click();
await page.waitForTimeout(200);
const fensterOffen = await page.getByText("Fensterreinigung: kein Onlinepreis").isVisible();
const preisNachFenster = (await preisEl.textContent())?.trim();
check("Fensterreinigung wird als offen ausgewiesen", fensterOffen);
check(
  "Fensterreinigung verändert den Preis nicht",
  parse(preisNachFenster) === parse(aboPreis),
  `${aboPreis} -> ${preisNachFenster}`,
);
await page.getByRole("button", { name: /^Fensterreinigung/ }).click();

// Ausserhalb des Einzugsgebiets: kein erfundener Preis
await page.locator("#distance").fill("50");
await page.waitForTimeout(200);
check(
  "Ausserhalb des Gebiets wird kein Preis erfunden",
  await page.getByText("Das rechnen wir persönlich").isVisible(),
);
await page.locator("#distance").fill("10");
await page.waitForTimeout(150);

// ---------- Assistent ----------
const input = page.locator("#assistant-input");
const log = page.locator("section[aria-label='Fragen und Antworten'] div[role='log']");

async function frage(text) {
  await input.fill(text);
  await page.getByRole("button", { name: "Fragen" }).click();
  await page.waitForTimeout(250);
  return (await log.innerText()).trim();
}

check("Preisfrage nennt den echten Stundenpreis", (await frage("Was kostet das?")).includes("99"));
check("Abofrage nennt CHF 82.50 und 330", (await frage("gibt es ein abo")).includes("82.50"));
check(
  "Zimmerfrage wird korrekt verneint",
  (await frage("kostet es mehr wenn ich mehr zimmer habe")).includes("nach Fläche"),
);
check(
  "Leistungsumfang wird aufgezählt",
  (await frage("was ist inklusive")).includes("Türgriffe"),
);
check(
  "Fensterpreis wird nicht erfunden",
  (await frage("was kostet fensterreinigung")).includes("Festpreis"),
);
check(
  "Themenfremde Frage wird weitergeleitet statt erfunden",
  (await frage("Können Sie mein Auto reparieren?")).includes("nicht sicher beantworten"),
);
await frage("asdfghjkl");
check(
  "Jede Antwort bietet einen menschlichen Kanal an",
  await page.getByRole("link", { name: /Rückruf anfordern/ }).first().isVisible(),
);
check(
  "Telefonnummer ist anklickbar hinterlegt",
  (await page.locator('a[href^="tel:+41762500599"]').count()) > 0,
);

// ---------- Technik ----------
check("Keine Konsolenfehler", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
check("Genau eine H1", (await page.locator("h1").count()) === 1);
await page.screenshot({ path: `${out}/desktop.png` });

// ---------- Mobil ----------
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE, { waitUntil: "networkidle" });
const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
check("Kein horizontales Scrollen auf dem Handy", scrollW <= 390, `scrollWidth=${scrollW}`);

// overflow-hidden verbirgt abgeschnittenen Text vor der Scrollbreiten-Pruefung,
// deshalb jede Ueberschrift einzeln messen.
const beschnitten = await page.evaluate(() =>
  [...document.querySelectorAll("h1, h2, h3")]
    .filter((el) => el.scrollWidth > el.clientWidth + 1)
    .map((el) => `${el.tagName}: ${el.textContent?.trim().slice(0, 40)}`),
);
check("Keine Ueberschrift wird abgeschnitten", beschnitten.length === 0, beschnitten.join(" | "));
await page.screenshot({ path: `${out}/mobil.png` });

// ---------- Reduzierte Bewegung ----------
await page.emulateMedia({ reducedMotion: "reduce" });
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.locator("#assistant-input").fill("was kostet das");
await page.getByRole("button", { name: "Fragen" }).click();
await page.waitForTimeout(300);
check(
  "Funktioniert mit reduzierter Bewegung",
  (await page.locator("div[role='log']").innerText()).includes("99"),
);
check(
  "Bei reduzierter Bewegung läuft gar kein Intro",
  (await page.locator(".intro-glass").count()) === 0,
);
check(
  "Und die Website steht sofort da",
  await page.getByRole("heading", { level: 1 }).isVisible(),
);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} Prüfungen bestanden`);
process.exit(failed.length === 0 ? 0 : 1);
