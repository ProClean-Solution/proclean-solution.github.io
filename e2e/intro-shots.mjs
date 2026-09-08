import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "node:fs";

const BASE = process.env.SMOKE_URL ?? "http://localhost:3100";
const out = process.env.SMOKE_OUT ?? "e2e/screenshots/intro";
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

const browser = await chromium.launch({
  executablePath: findChromium(),
  args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

const fehler = [];
page.on("console", (m) => m.type() === "error" && fehler.push(m.text()));
page.on("pageerror", (e) => fehler.push(String(e)));

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(2500); // 3D nachladen lassen

const hoehe = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
// Die Intro-Sektion ist 420vh hoch; ihr Fortschritt läuft über die ersten
// (420vh - 100vh) = 320vh des Dokuments.
const introEnde = await page.evaluate(() => window.innerHeight * 3.2);
console.log("Dokumenthöhe scrollbar:", hoehe, "· Intro endet bei:", Math.round(introEnde));

const marken = [0, 0.12, 0.22, 0.38, 0.52, 0.66, 0.75, 0.84, 0.93, 1.0];
for (const p of marken) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(introEnde * p));
  await page.waitForTimeout(700);
  const name = `p${String(Math.round(p * 100)).padStart(3, "0")}`;
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(name);
}

// Rückwärts: der Film muss kontrolliert zurücklaufen
await page.evaluate((y) => window.scrollTo(0, y), Math.round(introEnde * 0.3));
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/rueckwaerts-030.png` });
console.log("rueckwaerts-030");

const cleanWert = await page.evaluate(() => {
  const g = document.querySelector(".intro-glass");
  return g ? getComputedStyle(g).getPropertyValue("--clean").trim() : "kein Glas";
});
console.log("--clean nach Rückwärtsscrollen:", cleanWert);

console.log("Konsolenfehler:", fehler.length ? fehler.slice(0, 4) : "keine");
await browser.close();
