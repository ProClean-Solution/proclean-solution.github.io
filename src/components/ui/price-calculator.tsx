"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { business } from "@/config/business";
import {
  BASE_SQM,
  EXTRAS,
  EXTRA_LIST,
  FREQUENCY_HINT,
  FREQUENCY_LABEL,
  INCLUDED_TASKS,
  MAX_SQM_ONLINE,
  MIN_SQM,
  OBJECT_LABEL,
  PACKAGES,
  TARIFFS,
} from "@/lib/pricing/catalog";
import {
  OutOfScopeError,
  calculateQuote,
  formatDuration,
  formatMoney,
  formatSqmRate,
  packagePriceCents,
  packageSqmRateCents,
} from "@/lib/pricing/engine";
import type {
  ExtraId,
  Frequency,
  ObjectType,
  PackageId,
  QuoteInput,
  Tariff,
} from "@/lib/pricing/types";
import { RoomViewer } from "./room-viewer";
import { cn } from "@/lib/utils";

const FREQUENCIES: Frequency[] = ["m1", "m2", "m3", "m4", "einmalig"];
const OBJECTS: ObjectType[] = ["buero", "wohnung"];

/**
 * Der Preisrechner.
 *
 * Rechnet ausschliesslich über calculateQuote() — dieselbe Funktion, die auch
 * der Assistent und die Angebotssektion benutzen. Es gibt keine zweite
 * Preislogik im Projekt.
 *
 * Die Reihenfolge der Eingaben ist die Reihenfolge der Entscheidung: Paket,
 * Fläche, Tarif, wie oft, und erst danach Einzelnes. Wer nur wissen will, was
 * es kostet, ist nach zwei Feldern fertig.
 */
export function PriceCalculator({ className }: { className?: string }) {
  const [input, setInput] = useState<QuoteInput>({
    objectType: "buero",
    squareMeters: 100,
    packageId: "essential",
    tariff: "standard",
    frequency: "m4",
    extras: [],
    distanceKm: 10,
  });
  const reduceMotion = useReducedMotion();

  const outcome = useMemo(() => {
    try {
      return { quote: calculateQuote(input), error: null as string | null };
    } catch (e) {
      if (e instanceof OutOfScopeError) return { quote: null, error: e.message };
      throw e;
    }
  }, [input]);

  const set = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  /**
   * Eine einzelne Reinigung und ein Zwölfmonatsabo schliessen sich aus.
   * Statt den Fehler des Rechenkerns anzuzeigen, wird die Wahl hier
   * aufgelöst — der Kunde sieht immer einen Preis, nie eine Sackgasse.
   */
  const setFrequency = (f: Frequency) =>
    setInput((prev) => ({
      ...prev,
      frequency: f,
      tariff: f === "einmalig" ? "standard" : prev.tariff,
    }));

  const menge = (id: ExtraId) => input.extras.find((e) => e.id === id)?.quantity ?? 0;

  const toggleExtra = (id: ExtraId) =>
    setInput((prev) => {
      const drin = prev.extras.some((e) => e.id === id);
      return {
        ...prev,
        extras: drin
          ? prev.extras.filter((e) => e.id !== id)
          : [...prev.extras, { id, quantity: EXTRAS[id].unit === "pauschal" ? 1 : 10 }],
      };
    });

  const setMenge = (id: ExtraId, quantity: number) =>
    setInput((prev) => ({
      ...prev,
      extras: prev.extras.map((e) =>
        e.id === id ? { ...e, quantity: Math.max(1, Math.round(quantity)) } : e,
      ),
    }));

  const quote = outcome.quote;
  const aboMoeglich = input.frequency !== "einmalig";

  return (
    <section
      className={cn("grid gap-6 lg:grid-cols-[1.1fr_1fr]", className)}
      aria-label="Preisrechner"
    >
      {/* Eingaben */}
      <div className="space-y-7 rounded-2xl border bg-card p-6 text-card-foreground">
        <Field label="Paket">
          <div className="grid gap-2 sm:grid-cols-3">
            {PACKAGES.map((paket) => (
              <button
                key={paket.id}
                type="button"
                aria-pressed={input.packageId === paket.id}
                /* Ohne eigenes Label liest der Screenreader zuerst "Beliebt"
                   und erst danach den Paketnamen — die Auszeichnung stünde
                   vor der Sache, die sie auszeichnet. */
                aria-label={`${paket.label}, ${formatMoney(
                  packagePriceCents(input.squareMeters, paket.id, input.tariff),
                )} pro Reinigung`}
                onClick={() => set("packageId", paket.id as PackageId)}
                className={cn(
                  "relative rounded-xl border px-3.5 py-3 text-left transition-colors",
                  input.packageId === paket.id
                    ? "border-accent bg-accent/10"
                    : "bg-background hover:border-ring",
                )}
              >
                {paket.beliebt ? (
                  <span className="absolute -top-2 right-3 rounded-full bg-accent px-2 py-0.5 text-[0.55rem] font-bold tracking-widest text-accent-foreground uppercase">
                    Beliebt
                  </span>
                ) : null}
                <span className="block text-sm font-semibold">
                  {paket.label.replace("Office ", "")}
                </span>
                <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                  {formatMoney(packagePriceCents(input.squareMeters, paket.id, input.tariff))} pro
                  Reinigung
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Was sollen wir reinigen?">
          <div className="grid gap-2 sm:grid-cols-2">
            {OBJECTS.map((o) => (
              <Choice
                key={o}
                selected={input.objectType === o}
                onClick={() => set("objectType", o)}
                title={OBJECT_LABEL[o]}
              />
            ))}
          </div>
        </Field>

        <Field label={`Fläche: ${input.squareMeters} m²`} htmlFor="sqm">
          <input
            id="sqm"
            type="range"
            min={MIN_SQM}
            max={MAX_SQM_ONLINE}
            step={10}
            value={input.squareMeters}
            onChange={(e) => set("squareMeters", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
          <p className="text-xs text-muted-foreground">
            Die Zimmerzahl spielt keine Rolle. Bis {BASE_SQM} m² gilt der Paketpreis,
            darüber rechnen wir mit{" "}
            {formatSqmRate(packageSqmRateCents(input.packageId, input.tariff))} pro m².
          </p>
          {/* Der Raum wächst mit dem Regler. Aus "150 m²" wird eine Grösse,
              die man sieht und drehen kann. */}
          <RoomViewer squareMeters={input.squareMeters} className="mt-4 h-56 sm:h-72" />
        </Field>

        <Field label="Wie oft im Monat?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {FREQUENCIES.map((f) => (
              <Choice
                key={f}
                selected={input.frequency === f}
                onClick={() => setFrequency(f)}
                title={FREQUENCY_LABEL[f]}
                hint={FREQUENCY_HINT[f]}
              />
            ))}
          </div>
        </Field>

        <Field label="Tarif">
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(TARIFFS) as Tariff[]).map((t) => {
              const gesperrt = t === "abo12" && !aboMoeglich;
              return (
                <Choice
                  key={t}
                  selected={input.tariff === t}
                  disabled={gesperrt}
                  onClick={() => set("tariff", t)}
                  title={`${TARIFFS[t].label} · ${formatMoney(
                    packagePriceCents(input.squareMeters, input.packageId, t),
                  )}`}
                  hint={
                    gesperrt
                      ? "Setzt regelmässige Termine voraus."
                      : TARIFFS[t].description
                  }
                />
              );
            })}
          </div>
        </Field>

        <Field label={`Entfernung ab Kloten: ${input.distanceKm} km`} htmlFor="distance">
          <input
            id="distance"
            type="range"
            min={0}
            max={50}
            step={1}
            value={input.distanceKm}
            onChange={(e) => set("distanceKm", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </Field>

        <Field label="Zusatzleistungen">
          <ul className="space-y-1.5">
            {EXTRA_LIST.map((extra) => {
              const aktiv = input.extras.some((e) => e.id === extra.id);
              const enthalten = extra.includedIn.includes(input.packageId);
              return (
                <li key={extra.id}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <button
                      type="button"
                      aria-pressed={aktiv && !enthalten}
                      disabled={enthalten}
                      onClick={() => toggleExtra(extra.id)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                        enthalten
                          ? "cursor-default border-dashed text-muted-foreground"
                          : aktiv
                            ? "border-accent bg-accent/15 text-foreground"
                            : "bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {extra.label}
                      <span className="ml-1.5 tabular-nums opacity-60">
                        {enthalten
                          ? "im Paket"
                          : extra.priceCents === null
                            ? "nach Fläche"
                            : `+${formatMoney(extra.priceCents)}${
                                extra.unit === "pauschal" ? "" : ` / ${extra.unitLabel}`
                              }`}
                      </span>
                    </button>

                    {/* Menge nur dort, wo sie den Preis wirklich verändert. */}
                    {aktiv && !enthalten && extra.unit !== "pauschal" ? (
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={menge(extra.id)}
                          onChange={(e) => setMenge(extra.id, Number(e.target.value))}
                          className="w-16 rounded-md border bg-background px-2 py-1 text-right text-xs tabular-nums"
                          aria-label={`${extra.label}: ${extra.unitLabel}`}
                        />
                        {extra.unitLabel}
                      </label>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </Field>

        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            In jedem Paket enthalten
          </p>
          <p className="mt-2 text-sm leading-relaxed">{INCLUDED_TASKS.join(" · ")}</p>
        </div>
      </div>

      {/* Ergebnis */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border bg-card p-6 text-card-foreground">
          {outcome.error ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Das rechnen wir persönlich</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{outcome.error}</p>
              <a
                href="/kontakt"
                className="inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Angebot anfragen
              </a>
            </div>
          ) : quote ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  {quote.perMonthCents !== null ? "Pro Monat" : "Einmalig"}
                </p>
                <motion.p
                  key={quote.perMonthCents ?? quote.totalPerVisitCents}
                  initial={reduceMotion ? false : { opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 text-4xl font-black tracking-tight tabular-nums"
                >
                  {formatMoney(quote.perMonthCents ?? quote.totalPerVisitCents)}
                </motion.p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {quote.perMonthCents !== null ? (
                    <>
                      {quote.visitsPerMonth}{" "}
                      {quote.visitsPerMonth === 1 ? "Reinigung" : "Reinigungen"} à{" "}
                      {formatMoney(quote.totalPerVisitCents)} ·{" "}
                      {formatDuration(quote.durationMinutes)} pro Termin
                    </>
                  ) : (
                    <>{formatDuration(quote.durationMinutes)} Arbeitszeit</>
                  )}
                </p>
              </div>

              <ul className="space-y-1.5 border-t pt-4 text-sm">
                {quote.lines.map((line, i) => (
                  <li key={`${line.label}-${i}`}>
                    <div className="flex justify-between gap-4">
                      <span>{line.label}</span>
                      <span className="tabular-nums whitespace-nowrap">
                        {formatMoney(line.amountCents)}
                      </span>
                    </div>
                    {line.detail ? (
                      <p className="text-xs text-muted-foreground">{line.detail}</p>
                    ) : null}
                  </li>
                ))}
                {business.vatRegistered ? (
                  <li className="flex justify-between gap-4 pt-1 text-muted-foreground">
                    <span>MWST</span>
                    <span className="tabular-nums">{formatMoney(quote.vatCents)}</span>
                  </li>
                ) : null}
              </ul>

              {/* Was das Paket schon abdeckt, wird sichtbar NICHT berechnet —
                  sonst wirkt der Rechner, als hätte er es vergessen. */}
              {quote.coveredItems.length > 0 ? (
                <ul className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
                  {quote.coveredItems.map((item) => (
                    <li key={item.label} className="flex justify-between gap-4">
                      <span>{item.label}</span>
                      <span className="whitespace-nowrap">in {item.packageLabel}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {quote.openItems.length > 0 ? (
                <div className="space-y-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
                  {quote.openItems.map((item) => (
                    <div key={item.label}>
                      <p className="text-sm font-semibold">{item.label}: kein Onlinepreis</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              <a
                href="/kontakt"
                className="block rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                {quote.openItems.length > 0
                  ? `Anfragen mit ${
                      quote.openItems.length === 1 ? quote.openItems[0].label : "Zusatzleistungen"
                    }`
                  : "Termin anfragen"}
              </a>

              {quote.notices.map((notice) => (
                <p key={notice} className="text-xs leading-relaxed text-muted-foreground">
                  {notice}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const Tag = htmlFor ? "label" : "span";
  return (
    <div className="space-y-2.5">
      <Tag
        {...(htmlFor ? { htmlFor } : {})}
        className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase"
      >
        {label}
      </Tag>
      {children}
    </div>
  );
}

function Choice({
  selected,
  onClick,
  title,
  hint,
  disabled,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-left transition-colors",
        disabled
          ? "cursor-not-allowed border-dashed text-muted-foreground opacity-60"
          : selected
            ? "border-accent bg-accent/10"
            : "bg-background hover:border-ring",
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </button>
  );
}
