import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "node:fs";

const BASE = process.env.SMOKE_URL ?? "http://localhost:3100";
const out = process.env.SMOKE_OUT ?? "e2e/screenshots";
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
const EXEC = findChromium();

const browser = await chromium.launch(EXEC ? { executablePath: EXEC } : {});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1400); // Auftrittsanimation abwarten

/** Scrollt in Schritten und schiesst je ein Bild — der Wisch braucht Scroll. */
const marken = [
  ["01-hero", 0],
  ["02-wisch-anfang", 0.9],
  ["03-wisch-mitte", 1.5],
  ["04-wisch-ende", 2.2],
  ["05-tarife", 3.3],
  ["06-rechner", 4.6],
];

for (const [name, faktor] of marken) {
  await page.evaluate((f) => window.scrollTo(0, window.innerHeight * f), faktor);
  await page.waitForTimeout(1600); // scrub:1 laeuft der Scrollposition nach
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`${name}.png`);
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1400);
await page.screenshot({ path: `${out}/07-mobil.png` });
console.log("07-mobil.png");

await browser.close();
