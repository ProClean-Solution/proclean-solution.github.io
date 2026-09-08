import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";

/**
 * Nimmt einen Durchlauf der Seite als Video auf.
 *
 * Standbilder zeigen den Film nicht — der ganze Punkt ist die Bewegung.
 * Gescrollt wird in kleinen Schritten, damit die Aufnahme dem entspricht,
 * was ein Mensch mit dem Mausrad sieht.
 */
const BASE = process.env.SMOKE_URL ?? "http://localhost:3100";
const out = process.env.REC_OUT ?? "e2e/video";
mkdirSync(out, { recursive: true });

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (root && existsSync(root)) {
    const dir = readdirSync(root).find((d) => /^chromium-\d+$/.test(d));
    if (dir) return `${root}/${dir}/chrome-linux/chrome`;
  }
  return undefined;
}

const breit = process.argv.includes("--mobil") ? 420 : 1280;
const hoch = process.argv.includes("--mobil") ? 900 : 800;
const name = process.argv.includes("--mobil") ? "proclean-mobil" : "proclean-desktop";

const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({
  viewport: { width: breit, height: hoch },
  recordVideo: { dir: out, size: { width: breit, height: hoch } },
});
const page = await context.newPage();

await page.goto(BASE, { waitUntil: "networkidle" });
// 3D nachladen lassen, und einen Moment auf dem Startbild stehen bleiben
await page.waitForTimeout(3000);

const vh = await page.evaluate(() => window.innerHeight);
const introEnde = vh * 3.2;

/** Weich scrollen: viele kleine Schritte statt Sprünge. */
async function scrolleBis(ziel, schritte, pause) {
  const start = await page.evaluate(() => window.scrollY);
  for (let i = 1; i <= schritte; i++) {
    const y = start + ((ziel - start) * i) / schritte;
    await page.evaluate((v) => window.scrollTo(0, v), Math.round(y));
    await page.waitForTimeout(pause);
  }
}

// Der Film
await scrolleBis(introEnde, 150, 55);
await page.waitForTimeout(900);

// Weiter durch die bestehende Seite
const gesamt = await page.evaluate(
  () => document.documentElement.scrollHeight - window.innerHeight,
);
await scrolleBis(Math.min(gesamt, introEnde + vh * 6), 110, 45);
await page.waitForTimeout(800);

await page.close();
await context.close();
await browser.close();

// Playwright vergibt Zufallsnamen — auf etwas Lesbares umbenennen.
const datei = readdirSync(out).find((f) => f.endsWith(".webm") && !f.startsWith("proclean"));
if (datei) {
  renameSync(`${out}/${datei}`, `${out}/${name}.webm`);
  console.log(`${out}/${name}.webm`);
}
