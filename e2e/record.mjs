import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

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

// Der Wisch und der Kopf des Angebots
await scrolleBis(introEnde + vh * 2.2, 60, 45);
await page.waitForTimeout(500);

/*
  Die Paketkarte langsamer: sie wächst über ihre ganze Bahn von Essential
  über Plus zu Complete, und in normalem Scrolltempo sieht man die mittlere
  Stufe kaum. Die Bahn wird gemessen statt geschätzt — ihre Höhe steht in
  Bildschirmhöhen im Markup und darf sich ändern, ohne dass die Aufnahme
  daneben liegt.
*/
const bahn = await page.evaluate(() => {
  const el = document.querySelector("[data-offer-track]");
  if (!el) return null;
  const box = el.getBoundingClientRect();
  return { oben: box.top + window.scrollY, hoehe: box.height };
});
if (bahn) {
  await scrolleBis(bahn.oben, 40, 40);
  await page.waitForTimeout(700);
  await scrolleBis(bahn.oben + bahn.hoehe - vh, 130, 55);
  await page.waitForTimeout(900);
}

// Weiter durch Rechner und Fragen
const gesamt = await page.evaluate(
  () => document.documentElement.scrollHeight - window.innerHeight,
);
const abspann = await page.evaluate(() => {
  const f = document.querySelector("footer");
  return f ? f.getBoundingClientRect().top + window.scrollY : null;
});
if (abspann) {
  await scrolleBis(abspann - vh * 0.6, 80, 45);
  await page.waitForTimeout(400);
  // Langsamer in den Abspann: der Boden zieht dort auf den Betrachter zu,
  // und in normalem Tempo sieht man davon nichts.
  await scrolleBis(gesamt, 55, 70);
} else {
  await scrolleBis(gesamt, 90, 45);
}
await page.waitForTimeout(1400);

await page.close();
await context.close();
await browser.close();

// Playwright vergibt Zufallsnamen — auf etwas Lesbares umbenennen.
const datei = readdirSync(out).find((f) => f.endsWith(".webm") && !f.startsWith("proclean"));
if (!datei) {
  console.error("Keine Aufnahme gefunden.");
  process.exit(1);
}
renameSync(`${out}/${datei}`, `${out}/${name}.webm`);
console.log(`${out}/${name}.webm`);

/*
  Zusätzlich als H.264-MP4.
  Playwright schreibt VP8 in einem WebM-Container — das spielt auf vielen
  Geräten nicht ab, auf dem iPhone praktisch nie. Baseline-Profil und
  yuv420p, damit auch ältere Player mitkommen; faststart, damit das Video
  losläuft, bevor die Datei ganz geladen ist.
*/
execFileSync(
  ffmpeg,
  [
    "-y", "-i", `${out}/${name}.webm`,
    "-c:v", "libx264", "-profile:v", "baseline", "-level", "3.1",
    "-pix_fmt", "yuv420p", "-crf", "24", "-movflags", "+faststart",
    `${out}/${name}.mp4`,
  ],
  { stdio: "ignore" },
);
console.log(`${out}/${name}.mp4`);
