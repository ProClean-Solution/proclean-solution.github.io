"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { answer, topQuestions, type AnswerResult } from "@/lib/answers/engine";
import type { KnowledgeEntry } from "@/lib/answers/knowledge";
import { cn } from "@/lib/utils";

interface Turn {
  id: number;
  question: string;
  result: AnswerResult;
}

/**
 * Der Kundenassistent.
 *
 * Läuft vollständig im Browser: keine API, keine Kosten, kein Rate-Limit,
 * keine Wartezeit und nichts, was halluzinieren könnte. Jede Antwort stammt
 * wörtlich aus der geprüften Wissensbasis, und jede Eingabe bekommt eine
 * Reaktion — im Zweifel die Weiterleitung an einen Menschen.
 */
export function Assistant({ className }: { className?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const nextId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    setTurns((prev) => [...prev, { id: nextId.current++, question: text, result: answer(text) }]);
    setDraft("");
    // Neue Antwort in den Blick rücken, ohne den Fokus zu stehlen.
    requestAnimationFrame(() => {
      logRef.current?.scrollTo({
        top: logRef.current.scrollHeight,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  }

  const starter = topQuestions(4);

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm",
        className,
      )}
      aria-label="Fragen und Antworten"
    >
      <header className="flex items-center gap-3 border-b px-5 py-4">
        <span className="relative flex size-2.5" aria-hidden>
          <span className="absolute inline-flex size-full rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Fragen Sie uns</h2>
          <p className="text-xs text-muted-foreground">
            Sofort geantwortet — rund um die Uhr, ohne Wartezeit
          </p>
        </div>
      </header>

      <div
        ref={logRef}
        className="max-h-[26rem] min-h-[13rem] flex-1 space-y-4 overflow-y-auto px-5 py-5"
        role="log"
        aria-live="polite"
      >
        {turns.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Häufig gefragt — tippen Sie eine Frage an oder schreiben Sie Ihre eigene:
            </p>
            <SuggestionList items={starter} onPick={ask} />
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {turns.map((turn) => (
            <motion.div
              key={turn.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3"
            >
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                {turn.question}
              </p>

              <div className="max-w-[92%] space-y-3">
                <p className="text-sm leading-relaxed">{turn.result.text}</p>

                {turn.result.actions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {turn.result.actions.map((action) => (
                      <a
                        key={action.href + action.label}
                        href={action.href}
                        className="rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent/20"
                      >
                        {action.label}
                      </a>
                    ))}
                  </div>
                ) : null}

                {turn.result.suggestions.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs text-muted-foreground">
                      {turn.result.kind === "antwort" ? "Passt vielleicht auch:" : "Wählen Sie:"}
                    </p>
                    <SuggestionList items={turn.result.suggestions} onPick={ask} />
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form
        className="flex gap-2 border-t px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
      >
        <label htmlFor="assistant-input" className="sr-only">
          Ihre Frage
        </label>
        <input
          id="assistant-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Was kostet eine Reinigung?"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
        >
          Fragen
        </button>
      </form>
    </section>
  );
}

function SuggestionList({
  items,
  onPick,
}: {
  items: KnowledgeEntry[];
  onPick: (question: string) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onPick(item.question)}
            className="rounded-full border bg-background px-3.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            {item.question}
          </button>
        </li>
      ))}
    </ul>
  );
}
