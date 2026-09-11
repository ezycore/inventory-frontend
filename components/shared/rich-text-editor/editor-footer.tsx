"use client";
// coding-standard: maintained
import { useEditorState, type Editor } from "@tiptap/react";
import { cn } from "@ui/lib/utils";

/**
 * Word/character readout, plus a size warning when the field has a cap.
 *
 * **Why two different numbers.** What a merchant counts is visible characters.
 * What the backend enforces is the length of the SERIALIZED rich-doc JSON —
 * `Product.description`'s 20000 is a payload budget (the full value rides on
 * every products-list row), and rich-doc JSON runs 3-5x the prose it holds. A
 * plain "412 / 20000" counter would therefore be a lie in both directions: it
 * would read comfortable at the moment the save starts failing.
 *
 * So the counter states the honest thing and the meter tracks the enforced
 * thing, and the meter only appears once it is worth knowing about (75%).
 * Below that it is noise on a field nobody is close to filling.
 */
const WARN_AT = 0.75;

export function EditorFooter({
  editor,
  /** Serialized length cap, from the form field's `validation.maxLength`. */
  maxLength,
  /** The stored value — this is the string the cap is measured against. */
  value,
}: {
  editor: Editor | null;
  maxLength?: number;
  value: string;
}) {
  const counts = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            characters: e.storage.characterCount.characters(),
            words: e.storage.characterCount.words(),
          }
        : null,
  });

  // `value` is the serialized document once the merchant has typed anything. On
  // first mount of a LEGACY plain-text body it is still the bare prose, which is
  // shorter than what it will serialize to — so the meter can under-read until
  // the first edit. Acceptable: a legacy body is prose that already fitted in
  // the old 2500 cap, nowhere near this one.
  const used = value?.length ?? 0;
  const ratio = maxLength ? used / maxLength : 0;
  const over = maxLength ? used > maxLength : false;
  const showMeter = maxLength !== undefined && ratio >= WARN_AT;

  if (!counts) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
      <span>
        {counts.words} {counts.words === 1 ? "word" : "words"} · {counts.characters}{" "}
        {counts.characters === 1 ? "character" : "characters"}
      </span>
      {showMeter ? (
        <span
          className={cn("font-medium", over ? "text-destructive" : "text-amber-600")}
          // The percentage is the actionable part; the raw byte figures are for
          // anyone who needs to reconcile it with the validator's message.
          title={`${used.toLocaleString()} of ${maxLength!.toLocaleString()} stored characters`}
        >
          {over
            ? "Too long to save — shorten or simplify the formatting"
            : `${Math.round(ratio * 100)}% of the size limit`}
        </span>
      ) : null}
    </div>
  );
}
