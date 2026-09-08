"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { business } from "@/config/business";
import {
  BASE_SQM,
  EXTRAS,
  FREQUENCY_LABEL,
  INCLUDED_TASKS,
  MAX_SQM_ONLINE,
  MIN_SQM,
  OBJECT_LABEL,
  TARIFFS,
} from "@/lib/pricing/catalog";
import {
  OutOfScopeError,
  calculateQuote,
  formatDuration,
  formatMoney,
  formatSqmRate,
} from "@/lib/pricing/engine";
import type { Frequency, ObjectType, QuoteInput, Tariff } from "@/lib/pricing/types";
import { RoomViewer } from "./room-viewer";
import { cn } from "@/lib/utils";

const FREQUENCIES: Frequency[] = ["woechentlich", "zweiwoechentlich", "monatlich", "einmalig"];
const OBJECTS: ObjectType[] = ["buero", "wohnung"];

/**
 * Der Preisrechner.
 *
 * Rechnet ausschliesslich über calculateQuote() — dieselbe Funktion, die auch
 * der Assistent und später das Angebots-Tool benutzen. Es gibt keine zweite
 * Preislogik im Projekt.
 */
export function PriceCalculator({ className }: { className?: string }) {
  const [input, setInput] = useState<QuoteInput>({
    objectType: "buero",
    squareMeters: 100,
    tariff: "standard",
    frequency: "woechentlich",
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

  const quote = outcome.quote;

  return (
    <section className={cn("grid gap-6 lg:grid-cols-[1.1fr_1fr]", className)} aria-label="Preisrechner">
      {/* Eingaben */}
      <div className="space-y-7 rounded-2xl border bg-card p-6 text-card-foreground">
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
            Die Zimmerzahl spielt keine Rolle. Bis {BASE_SQM} m² gilt der Grundpreis,
            darüber rechnen wir pro Quadratmeter.
          </p>
          {/* Der Raum wächst mit dem Regler. Aus "150 m²" wird eine Grösse,
              die man sieht und drehen kann. */}
          <RoomViewer
            squareMeters={input.squareMeters}
            className="mt-4 h-56 sm:h-72"
          />
        </Field>

        <Field label="Tarif">
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(TARIFFS) as Tariff[]).map((t) => (
              <Choice
                key={t}
                selected={input.tariff === t}
                onClick={() => set("tariff", t)}
                title={`${TARIFFS[t].label} · ${formatMoney(TARIFFS[t].baseCents)}`}
                hint={`bis ${BASE_SQM} m², darüber ${formatSqmRate(TARIFFS[t].perSqmCents)} pro m². ${TARIFFS[t].description}`}
              />
            ))}
          </div>
        </Field>

        <Field label="Wie oft?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FREQUENCIES.map((f) => (
              <Choice
                key={f}
                selected={input.frequency === f}
                onClick={() => set("frequency", f)}
                title={FREQUENCY_LABEL[f]}
              />
            ))}
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

        <Field label="Zusätzlich">
          <div className="flex flex-wrap gap-2">
            {Object.values(EXTRAS).map((extra) => {
              const active = input.extras.includes(extra.id);
              return (
                <button
                  key={extra.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setInput((prev) => ({
                      ...prev,
                      extras: active
                        ? prev.extras.filter((e) => e !== extra.id)
                        : [...prev.extras, extra.id],
                    }))
                  }
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-accent bg-accent/15 text-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {extra.label}
                  <span className="ml-1.5 opacity-60">
                    {extra.priceCents === null ? "auf Anfrage" : `+${formatMoney(extra.priceCents)}`}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Immer enthalten
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
                      {quote.visitsPerMonth} Termine à {formatMoney(quote.totalPerVisitCents)} ·{" "}
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
                  ? `Anfragen mit ${quote.openItems.length === 1 ? quote.openItems[0].label : "Zusatzleistungen"}`
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
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-left transition-colors",
        selected ? "border-accent bg-accent/10" : "bg-background hover:border-ring",
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </button>
  );
}
