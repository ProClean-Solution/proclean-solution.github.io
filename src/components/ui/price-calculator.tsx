"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { EXTRAS, FREQUENCY_LABEL, SERVICES } from "@/lib/pricing/catalog";
import { OutOfScopeError, calculateQuote, formatDuration, formatMoney } from "@/lib/pricing/engine";
import type { Condition, ExtraId, Frequency, QuoteInput, ServiceId } from "@/lib/pricing/types";
import { cn } from "@/lib/utils";

const CONDITIONS: Array<{ id: Condition; label: string; hint: string }> = [
  { id: "normal", label: "Normal", hint: "regelmäßig genutzt und gepflegt" },
  { id: "stark", label: "Stark verschmutzt", hint: "länger nicht gereinigt" },
  { id: "extrem", label: "Sehr stark", hint: "Renovierung, Umzug, Sonderfall" },
];

const FREQUENCIES: Frequency[] = ["einmalig", "monatlich", "zweiwoechentlich", "woechentlich"];

/**
 * Der Preisrechner.
 *
 * Rechnet ausschliesslich über calculateQuote() — dieselbe Funktion, die auch
 * das interne Angebots-Tool benutzt. Ändert sich ein Preis im Katalog, ändert
 * er sich hier automatisch mit. Es gibt keine zweite Preislogik im Projekt.
 */
export function PriceCalculator({ className }: { className?: string }) {
  const [input, setInput] = useState<QuoteInput>({
    service: "unterhaltsreinigung",
    squareMeters: 80,
    bathrooms: 1,
    frequency: "einmalig",
    condition: "normal",
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

  const toggleExtra = (id: ExtraId) =>
    setInput((prev) => ({
      ...prev,
      extras: prev.extras.includes(id)
        ? prev.extras.filter((e) => e !== id)
        : [...prev.extras, id],
    }));

  return (
    <section className={cn("grid gap-6 lg:grid-cols-[1.15fr_1fr]", className)} aria-label="Preisrechner">
      {/* Eingaben */}
      <div className="space-y-7 rounded-2xl border bg-card p-6 text-card-foreground">
        <Field label="Leistung">
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.values(SERVICES).map((s) => (
              <Choice
                key={s.id}
                selected={input.service === s.id}
                onClick={() => set("service", s.id as ServiceId)}
                title={s.label}
                hint={s.description}
              />
            ))}
          </div>
        </Field>

        <Field label={`Fläche: ${input.squareMeters} m²`} htmlFor="sqm">
          <input
            id="sqm"
            type="range"
            min={10}
            max={400}
            step={5}
            value={input.squareMeters}
            onChange={(e) => set("squareMeters", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={`Bäder: ${input.bathrooms}`} htmlFor="bathrooms">
            <input
              id="bathrooms"
              type="range"
              min={1}
              max={5}
              step={1}
              value={input.bathrooms}
              onChange={(e) => set("bathrooms", Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </Field>
          <Field label={`Entfernung: ${input.distanceKm} km`} htmlFor="distance">
            <input
              id="distance"
              type="range"
              min={0}
              max={60}
              step={1}
              value={input.distanceKm}
              onChange={(e) => set("distanceKm", Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </Field>
        </div>

        <Field label="Wie oft sollen wir kommen?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FREQUENCIES.map((f) => (
              <Choice
                key={f}
                selected={input.frequency === f}
                onClick={() => set("frequency", f)}
                title={FREQUENCY_LABEL[f]}
                hint={f === "woechentlich" ? "günstigster Preis" : undefined}
              />
            ))}
          </div>
        </Field>

        <Field label="Zustand">
          <div className="grid gap-2 sm:grid-cols-3">
            {CONDITIONS.map((c) => (
              <Choice
                key={c.id}
                selected={input.condition === c.id}
                onClick={() => set("condition", c.id)}
                title={c.label}
                hint={c.hint}
              />
            ))}
          </div>
        </Field>

        <Field label="Zusatzleistungen">
          <div className="flex flex-wrap gap-2">
            {Object.values(EXTRAS).map((extra) => {
              const active = input.extras.includes(extra.id);
              return (
                <button
                  key={extra.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleExtra(extra.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-accent bg-accent/15 text-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {extra.label}
                  <span className="ml-1.5 opacity-60">+{formatMoney(extra.priceCents)}</span>
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      {/* Ergebnis */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border bg-card p-6 text-card-foreground">
          {outcome.error ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Kein Onlinepreis möglich</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{outcome.error}</p>
              <a
                href="/kontakt"
                className="inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Individuelles Angebot anfragen
              </a>
            </div>
          ) : outcome.quote ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Ihr Richtpreis
                </p>
                <motion.p
                  key={outcome.quote.grossCents}
                  initial={reduceMotion ? false : { opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 text-4xl font-black tracking-tight tabular-nums"
                >
                  {formatMoney(outcome.quote.grossCents)}
                </motion.p>
                <p className="mt-1 text-xs text-muted-foreground">
                  inkl. MwSt. · ca. {formatDuration(outcome.quote.durationMinutes)} Arbeitszeit
                  {input.frequency !== "einmalig" ? " · pro Termin" : ""}
                </p>
              </div>

              <ul className="space-y-1.5 border-t pt-4 text-sm">
                {outcome.quote.lines.map((line, i) => (
                  <li key={`${line.label}-${i}`} className="flex justify-between gap-4">
                    <span className={cn(line.amountCents < 0 && "text-accent")}>{line.label}</span>
                    <span className="tabular-nums whitespace-nowrap">
                      {formatMoney(line.amountCents)}
                    </span>
                  </li>
                ))}
                <li className="flex justify-between gap-4 pt-1 text-muted-foreground">
                  <span>zzgl. MwSt.</span>
                  <span className="tabular-nums">{formatMoney(outcome.quote.vatCents)}</span>
                </li>
              </ul>

              <a
                href="/buchen"
                className="block rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                Termin zu diesem Preis buchen
              </a>

              {outcome.quote.notices.map((notice) => (
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
