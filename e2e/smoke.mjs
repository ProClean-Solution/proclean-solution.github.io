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

// ---------- Angebot: die wachsende Paketkarte ----------
const karteDa = await page.locator(".offer-card[data-aktiv]").count();
check("Paketkarte läuft im Scrollmodus", karteDa === 1);

/** Liest den Zustand der Karte an einer Position innerhalb ihrer Bahn. */
const karteBei = (anteil) =>
  page.evaluate(async (a) => {
    const bahn = document.querySelector("[data-offer-track]");
    const box = bahn.getBoundingClientRect();
    const oben = box.top + window.scrollY;
    window.scrollTo(0, Math.round(oben + (box.height - window.innerHeight) * a));
    await new Promise((r) => setTimeout(r, 400));
    const karte = document.querySelector(".offer-card");
    const st = getComputedStyle(karte);
    const zeilen = [...document.querySelectorAll(".offer-add")];
    return {
      kopf: [0, 1, 2].map((i) => parseFloat(st.getPropertyValue(`--kopf-${i}`))),
      offen: zeilen.map((z) => parseFloat(getComputedStyle(z).opacity)),
      hoehe: karte.getBoundingClientRect().height,
      viewport: window.innerHeight,
    };
  }, anteil);

const start = await karteBei(0);
check(
  "Am Anfang steht Office Essential allein da",
  start.kopf[0] > 0.9 && start.kopf[1] < 0.1 && start.kopf[2] < 0.1,
  `kopf=${start.kopf.join("/")}`,
);
check(
  "Und die Zusatzleistungen sind noch zugeklappt",
  start.offen.every((o) => o < 0.05),
  `offen=${start.offen.join("/")}`,
);

const mitte = await karteBei(0.5);
check(
  "In der Mitte steht Office Plus",
  mitte.kopf[1] > 0.85,
  `kopf=${mitte.kopf.join("/")}`,
);

// Die Uebersicht steuert die Karte: ein Klick auf Complete fuehrt dorthin.
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);
await page.getByRole("button", { name: "Office Complete ansehen" }).click();
await page.waitForTimeout(1400);
const nachKlick = await page.evaluate(() => {
  const k = document.querySelector(".offer-card");
  return {
    kopf: [0, 1, 2].map((i) => parseFloat(getComputedStyle(k).getPropertyValue(`--kopf-${i}`))),
    markiert: [...document.querySelectorAll(".offer-pick")].map((b) => b.hasAttribute("data-aktiv")),
  };
});
check(
  "Ein Klick auf ein Paket führt die Karte dorthin",
  nachKlick.kopf[2] > 0.85,
  `kopf=${nachKlick.kopf.join("/")}`,
);
check(
  "Und die Übersicht markiert genau dieses Paket",
  nachKlick.markiert.filter(Boolean).length === 1 && nachKlick.markiert[2],
  JSON.stringify(nachKlick.markiert),
);

const ende = await karteBei(1);
check(
  "Am Ende steht Office Complete",
  ende.kopf[2] > 0.9 && ende.kopf[0] < 0.1,
  `kopf=${ende.kopf.join("/")}`,
);
check(
  "Und alle Zusatzleistungen sind aufgeklappt",
  ende.offen.every((o) => o > 0.9),
  `offen=${ende.offen.join("/")}`,
);
check(
  "Die Karte bleibt beim Wachsen im Bild",
  ende.hoehe < ende.viewport,
  `${Math.round(ende.hoehe)}px in ${ende.viewport}px`,
);

// Zurückscrollen muss die Karte exakt wieder zufahren.
const zurueckKarte = await karteBei(0);
check(
  "Zurückscrollen fährt die Karte wieder zu",
  zurueckKarte.kopf[0] > 0.9 && zurueckKarte.offen.every((o) => o < 0.05),
  `kopf=${zurueckKarte.kopf.join("/")} offen=${zurueckKarte.offen.join("/")}`,
);

const angebotsText = await page.locator("#angebot").innerText();

// Die Staffel: Zahlen kommen aus der Engine, nicht aus dem Markup.
const staffel = await page.locator("#angebot table").innerText();
for (const [was, preis] of [
  ["Essential bei 100 m²", "99.00"],
  ["Essential bei 150 m²", "149.00"],
  ["Essential bei 200 m²", "198.00"],
  ["Essential bei 250 m²", "248.00"],
  ["Plus bei 100 m²", "139.00"],
  ["Complete bei 100 m²", "179.00"],
  ["Plus bei 200 m²", "278.00"],
]) {
  check(`Staffel: ${was} kostet CHF ${preis}`, staffel.includes(preis), was);
}
check(
  "Die drei Paketpreise stehen im Angebot",
  ["99.00", "139.00", "179.00", "82.50", "115.85", "149.15"].every((z) =>
    angebotsText.includes(z),
  ),
);
check("Genau ein Paket ist im Angebot als beliebt markiert",
  (await page.locator("#angebot").getByText("Beliebt").count()) === 2,
  "einmal in der Übersicht, einmal auf der Karte",
);
check("Der Bedingungssatz steht unter dem Angebot", angebotsText.includes("normal verschmutzte"));
check(
  "Die Zusatzleistungen stehen mit Preis da",
  ["4.50", "19.90", "2.50", "9.90"].every((z) => angebotsText.includes(z)),
);
check(
  "Das Fensterkontingent steht bei der Leistung",
  angebotsText.includes("in Complete bis 10 m² Glas enthalten"),
);
check(
  "Und der Vorbehalt zu Aussenfenstern steht auf der Karte",
  angebotsText.includes("Aussenfenster sind nicht enthalten"),
);

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);

// ---------- Rechner ----------
const preisEl = page.locator("section[aria-label='Preisrechner'] p.text-4xl");
const rechner = page.locator("section[aria-label='Preisrechner']");
const parse = (s) => Number(String(s).replace(/[^\d.]/g, ""));
const proTerminText = () => rechner.getByText(/à CHF/).first().textContent();

const startpreis = (await preisEl.textContent())?.trim();
check(
  "Referenzfall: Essential, 100 m², viermal im Monat ergibt CHF 396.00",
  parse(startpreis) === 396,
  startpreis,
);

// Paketwechsel: Florijans drei Preise, alle drei aus derselben Rechnung
for (const [name, proTermin] of [
  ["Plus", 139],
  ["Complete", 179],
  ["Essential", 99],
]) {
  await page.getByRole("button", { name: new RegExp(`^Office ${name},`) }).click();
  await page.waitForTimeout(200);
  check(
    `Paket ${name} kostet CHF ${proTermin}.00 pro Reinigung`,
    parse(await preisEl.textContent()) === proTermin * 4,
    (await preisEl.textContent())?.trim(),
  );
}

// "Beliebt" darf genau einmal vorkommen — sonst ist es keine Empfehlung mehr
check(
  "Genau ein Paket ist als beliebt ausgezeichnet",
  (await rechner.getByText("Beliebt").count()) === 1,
);

// Termine pro Monat: der Paketpreis mal der gewählten Anzahl
for (const [label, mal] of [
  ["1× im Monat", 1],
  ["2× im Monat", 2],
  ["3× im Monat", 3],
  ["4× im Monat", 4],
]) {
  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
  await page.waitForTimeout(180);
  check(
    `${label} ergibt CHF ${99 * mal}.00`,
    parse(await preisEl.textContent()) === 99 * mal,
    (await preisEl.textContent())?.trim(),
  );
}

// Einmalig schliesst das Abo aus, statt einen Preis zu zeigen, den es nicht gibt
await page.getByRole("button", { name: /^einmalig/ }).click();
await page.waitForTimeout(200);
check(
  "Einmalig sperrt das Abo",
  await page.getByRole("button", { name: /Abo 12 Monate/ }).isDisabled(),
);
check(
  "Und zeigt den Einzelpreis statt einer Sackgasse",
  parse(await preisEl.textContent()) === 99,
  (await preisEl.textContent())?.trim(),
);
await page.getByRole("button", { name: /^4× im Monat/ }).click();
await page.waitForTimeout(180);

// Tarifwechsel muss den Preis senken — Florijans Abopreis
await page.getByRole("button", { name: /Abo 12 Monate/ }).click();
await page.waitForTimeout(200);
const aboPreis = (await preisEl.textContent())?.trim();
check("Abo ergibt CHF 330.00 im Monat", parse(aboPreis) === 330, aboPreis);

// 150 m² im Abo: Florijans eigene Rechnung, 123.75 pro Termin
await page.locator("#sqm").fill("150");
await page.waitForTimeout(250);
check(
  "150 m² im Abo kosten CHF 123.75 pro Reinigung",
  /123\.75/.test((await proTerminText()) ?? ""),
  (await proTerminText())?.trim(),
);

// 150 m² einzeln: die gerundete Zahl, nicht 148.50
await page.getByRole("button", { name: /^Einzeln/ }).click();
await page.waitForTimeout(250);
check(
  "150 m² einzeln kosten CHF 149.00 pro Reinigung",
  parse(await preisEl.textContent()) === 149 * 4,
  `${(await preisEl.textContent())?.trim()} im Monat`,
);
await page.locator("#sqm").fill("100");
await page.getByRole("button", { name: /Abo 12 Monate/ }).click();
await page.waitForTimeout(200);

// Zusatzleistung mit Menge: Stühle rechnen mit der Anzahl
await page.getByRole("button", { name: /^Stühle reinigen/ }).click();
await page.waitForTimeout(200);
const stuhlFeld = page.getByLabel("Stühle reinigen: Stuhl");
await stuhlFeld.fill("8");
await stuhlFeld.blur();
await page.waitForTimeout(250);
check(
  "Acht Stühle kosten CHF 20.00 zusätzlich",
  parse(await preisEl.textContent()) === (82.5 + 20) * 4,
  (await preisEl.textContent())?.trim(),
);
await page.getByRole("button", { name: /^Stühle reinigen/ }).click();
await page.waitForTimeout(200);

// Was das Paket abdeckt, darf nicht ein zweites Mal berechnet werden
await page.getByRole("button", { name: /^Küchenzeile reinigen/ }).click();
await page.waitForTimeout(200);
const mitKueche = parse(await preisEl.textContent());
await page.getByRole("button", { name: /^Office Plus,/ }).click();
await page.waitForTimeout(250);
const plusPreis = parse(await preisEl.textContent());
check(
  "Küchenzeile schlägt bei Essential auf",
  mitKueche === (82.5 + 14.9) * 4,
  String(mitKueche),
);
check(
  "Bei Plus ist sie enthalten und kostet nichts extra",
  plusPreis === 115.85 * 4,
  String(plusPreis),
);
check(
  "Und der Rechner sagt das auch",
  await rechner.getByText("in Office Plus").first().isVisible(),
);
await page.getByRole("button", { name: /^Office Essential,/ }).click();
await page.getByRole("button", { name: /^Küchenzeile reinigen/ }).click();
await page.waitForTimeout(200);

// Das Fensterkontingent in Complete: enthalten bis 10 m², darueber gerechnet
await page.getByRole("button", { name: /^Office Complete,/ }).click();
await page.waitForTimeout(250);
const completePreis = parse(await preisEl.textContent());
await page.getByRole("button", { name: /^Fensterreinigung innen/ }).click();
await page.waitForTimeout(300);
check(
  "Zehn Quadratmeter Glas sind in Complete enthalten",
  parse(await preisEl.textContent()) === completePreis,
  (await preisEl.textContent())?.trim(),
);
check(
  "Und der Rechner weist das Kontingent aus",
  (await rechner.innerText()).includes("bis 10 m² Glas enthalten"),
);
const glasFeld = page.getByLabel("Fensterreinigung innen: m² Glas");
await glasFeld.fill("18");
await glasFeld.blur();
await page.waitForTimeout(300);
check(
  "Achtzehn Quadratmeter kosten CHF 36.00 zusätzlich",
  parse(await preisEl.textContent()) === completePreis + 36 * 4,
  (await preisEl.textContent())?.trim(),
);
check(
  "Complete verspricht keine unbegrenzten Fenster",
  (await rechner.innerText()).includes("Aussenfenster"),
);
await page.getByRole("button", { name: /^Fensterreinigung innen/ }).click();
await page.getByRole("button", { name: /^Office Essential,/ }).click();
await page.getByRole("button", { name: /Abo 12 Monate/ }).click();
await page.waitForTimeout(250);

// Teppichreinigung hat weiterhin keinen Onlinepreis
await page.getByRole("button", { name: /^Teppich-Tiefenreinigung/ }).click();
await page.waitForTimeout(250);
const vorTeppich = 82.5 * 4;
check(
  "Teppichreinigung wird als offen ausgewiesen",
  await page.getByText("Teppich-Tiefenreinigung: kein Onlinepreis").isVisible(),
);
check(
  "Teppichreinigung verändert den Preis nicht",
  parse(await preisEl.textContent()) === vorTeppich,
  (await preisEl.textContent())?.trim(),
);
await page.getByRole("button", { name: /^Teppich-Tiefenreinigung/ }).click();
await page.waitForTimeout(200);

// Ausserhalb des Einzugsgebiets: kein erfundener Preis
await page.locator("#distance").fill("50");
await page.waitForTimeout(250);
check(
  "Ausserhalb des Gebiets wird kein Preis erfunden",
  await page.getByText("Das rechnen wir persönlich").isVisible(),
);
await page.locator("#distance").fill("10");
await page.waitForTimeout(200);

// ---------- Assistent ----------
const input = page.locator("#assistant-input");
const log = page.locator("section[aria-label='Fragen und Antworten'] div[role='log']");

async function frage(text) {
  await input.fill(text);
  await page.getByRole("button", { name: "Fragen" }).click();
  await page.waitForTimeout(250);
  return (await log.innerText()).trim();
}

const antwortAufPreis = await frage("Was kostet das?");
check("Preisfrage nennt den echten Preis", antwortAufPreis.includes("99"));
check("Abofrage nennt CHF 82.50 und 330", (await frage("gibt es ein abo")).includes("82.50"));
check(
  "Preisfrage nennt alle drei Pakete",
  ["99", "139", "179"].every((z) => antwortAufPreis.includes(z)),
);
check(
  "Zimmerfrage wird korrekt verneint",
  (await frage("kostet es mehr wenn ich mehr zimmer habe")).includes("nach Fläche"),
);
check(
  "Leistungsumfang wird aufgezählt",
  (await frage("was ist inklusive")).includes("Türgriffe"),
);
// Die Beschriftung des Wischs trug einmal eine zweite, veraltete Leistungsliste.
check(
  "Der Wisch nennt dieselben Leistungen wie der Katalog",
  (await page.locator(".sweep-after").innerText()).includes("Sanitär"),
);

/*
  Beide Seiten des Wischs muessen DIESELBE Flaeche zeigen. Die saubere Seite
  war einmal ein leerer Verlauf — damit war der Wisch eine Farbaenderung und
  kein Ergebnis. Geprueft wird, dass beide Ebenen dasselbe Fugenraster tragen.
*/
const wischFlaechen = await page.evaluate(() => {
  const lies = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      fugen: (cs.backgroundImage.match(/repeating-linear-gradient/g) ?? []).length,
      raster: cs.getPropertyValue("--fuge").trim(),
    };
  };
  return { stumpf: lies(".sweep-surface--dull"), sauber: lies(".sweep-surface--clean") };
});
check(
  "Beide Seiten des Wischs zeigen dieselbe Fläche",
  wischFlaechen.stumpf?.fugen === 2 &&
    wischFlaechen.sauber?.fugen === 2 &&
    wischFlaechen.stumpf.raster === wischFlaechen.sauber.raster,
  JSON.stringify(wischFlaechen),
);
check(
  "Fensterpreis wird nach Glasfläche genannt",
  (await frage("was kostet fensterreinigung")).includes("4.50"),
);
check(
  "Teppichpreis wird weiterhin nicht erfunden",
  (await frage("reinigen sie teppiche")).includes("Festpreis"),
);
check(
  "Frage nach der Häufigkeit wird beantwortet",
  (await frage("wie oft kommen sie im monat")).includes("viermal"),
);
check(
  "Flächenfrage nennt die Staffel",
  (await frage("was kostet 200 quadratmeter")).includes("198"),
);
const antwortAufPakete = await frage("unterschied essential plus complete");
check(
  "Frage nach Complete-Fenstern nennt die 10 m²",
  (await frage("sind bei complete alle fenster inklusive")).includes("10 m²"),
);
check(
  "Frage nach den Paketen nennt alle drei Preise",
  ["99", "139", "179"].every((z) => antwortAufPakete.includes(z)),
);
check(
  "Frage nach starker Verschmutzung wird ehrlich beantwortet",
  (await frage("was wenn es sehr dreckig ist")).includes("separat berechnet"),
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

// ---------- Abspann ----------
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(1400);

const abspann = await page.evaluate(() => {
  const f = document.querySelector("footer");
  const zeile = f?.querySelector(".footer-line");
  if (!f || !zeile) return null;
  const cs = getComputedStyle(zeile);
  return {
    hoehe: Math.round(f.getBoundingClientRect().height),
    farbe: cs.color,
    grundfarbe: cs.backgroundColor,
    clip: cs.webkitBackgroundClip || cs.backgroundClip,
    raster: !!f.querySelector(".footer-grid"),
    tel: f.querySelectorAll('a[href^="tel:"]').length,
    mail: f.querySelectorAll('a[href^="mailto:"]').length,
  };
});
check("Der Abspann steht", abspann !== null && abspann.hoehe > 600, `${abspann?.hoehe}px`);
check("Telefon und E-Mail stehen im Abspann", abspann.tel > 0 && abspann.mail > 0);
check("Der Boden läuft in die Tiefe", abspann.raster);

/*
  Die Wortmarke wird auf ihren eigenen Hintergrund beschnitten, damit der
  Lichtstreifen IN der Schrift laufen kann. Fehlt dann die Grundfarbe, ist
  der Text unsichtbar — genau das war er beim ersten Versuch.
*/
const markeBeschnitten = abspann.clip === "text";
check(
  "Die Wortmarke ist sichtbar, nicht nur durchsichtig beschnitten",
  !markeBeschnitten || abspann.grundfarbe !== "rgba(0, 0, 0, 0)",
  `clip=${abspann.clip} color=${abspann.farbe} bg=${abspann.grundfarbe}`,
);

// Der Assistent steht auf der Buehne und muss ihre Farben uebernommen haben,
// nicht die hellen Kartenwerte des Themes.
const assistentDunkel = await page.evaluate(() => {
  const el = document.querySelector("section[aria-label='Fragen und Antworten']");
  /*
    Ueber ein Canvas statt per Textvergleich: die Farbe steht als
    `color-mix(...)` in der Regel und wird je nach Browser als oklab, oklch
    oder color(srgb ...) berechnet. Ein Zahlenparser auf dem String las
    daraus Helligkeit 60942.
  */
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d");
  ctx.fillStyle = getComputedStyle(el).backgroundColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return { helligkeit: (r + g + b) / 3 };
});
check(
  "Der Assistent übernimmt die Farben der Bühne",
  assistentDunkel.helligkeit < 80,
  `Helligkeit ${Math.round(assistentDunkel.helligkeit)}`,
);

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);

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

// Die Paketkarte wird beim Wachsen hoeher. Auf dem Handy ist der Abstand zum
// Rand am knappsten — deshalb hier messen, nicht nur am Desktop.
await page.waitForTimeout(600);
const karteMobil = await page.evaluate(async () => {
  const bahn = document.querySelector("[data-offer-track]");
  if (!bahn) return null;
  const box = bahn.getBoundingClientRect();
  window.scrollTo(0, Math.round(box.top + window.scrollY + box.height - window.innerHeight));
  await new Promise((r) => setTimeout(r, 500));
  const k = document.querySelector(".offer-card").getBoundingClientRect();
  return { top: Math.round(k.top), unten: Math.round(k.bottom), vh: window.innerHeight };
});
// Mit Rand, nicht bündig: exakt passend heisst, dass die naechste laengere
// Zeile oder eine andere Schrift wieder ueberlaeuft.
const LUFT = 16;
// Seitlich abgeschnittener Text: `overflow: hidden` fuer die Zeilenhoehe
// kappt sonst lange Komposita mitten im Wort, ohne dass es auffaellt.
const gekappt = await page.evaluate(() =>
  [...document.querySelectorAll(".offer-card span, .offer-card li")]
    .filter((el) => el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0)
    .map((el) => el.textContent?.trim().slice(0, 40) ?? "")
    .slice(0, 3),
);
check("Kein Text in der Paketkarte wird seitlich gekappt", gekappt.length === 0, gekappt.join(" | "));

// Nicht nur "passt rein". Drei Zeilen sind fuer ein deutsches Kompositum in
// einer 130px-Spalte normal; ab vier steckt ein mitten durchgebrochenes Wort
// dahinter, und genau das war der Fehler, den diese Pruefung gefunden hat.
const langeZeilen = await page.evaluate(() =>
  [...document.querySelectorAll(".offer-add")]
    .map((z) => {
      const text = z.querySelector(".min-w-0");
      if (!text) return null;
      const lh = parseFloat(getComputedStyle(text).lineHeight);
      const n = Math.round(z.getBoundingClientRect().height / lh);
      return n > 3 ? `${z.textContent?.trim().slice(0, 30)} (${n} Zeilen)` : null;
    })
    .filter(Boolean),
);
check(
  "Keine Zusatzzeile bricht auf dem Handy vierzeilig um",
  langeZeilen.length === 0,
  langeZeilen.join(" | "),
);

check(
  "Die ausgewachsene Paketkarte passt mit Rand aufs Handy",
  karteMobil !== null &&
    karteMobil.top >= LUFT &&
    karteMobil.unten <= karteMobil.vh - LUFT,
  karteMobil
    ? `${karteMobil.top}px bis ${karteMobil.unten}px in ${karteMobil.vh}px`
    : "keine Karte",
);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
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

// Ohne Animation muss das Angebot vollstaendig dastehen statt zugeklappt.
const ruhe = await page.evaluate(() => {
  const karte = document.querySelector(".offer-card");
  const zeilen = [...document.querySelectorAll(".offer-add")];
  return {
    imScrollmodus: karte?.hasAttribute("data-aktiv") ?? true,
    kopfzeilen: [...document.querySelectorAll(".offer-head")].filter(
      (h) => getComputedStyle(h).display !== "none" && h.closest(".grid")?.firstElementChild === h,
    ).length,
    zugeklappt: zeilen.filter((z) => z.getBoundingClientRect().height < 4).length,
    zeilen: zeilen.length,
  };
});
check("Bei reduzierter Bewegung klappt die Paketkarte nicht", !ruhe.imScrollmodus);
check(
  "Und alle Zusatzleistungen stehen offen da",
  ruhe.zeilen > 0 && ruhe.zugeklappt === 0,
  `${ruhe.zugeklappt} von ${ruhe.zeilen} zugeklappt`,
);

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} Prüfungen bestanden`);
process.exit(failed.length === 0 ? 0 : 1);
