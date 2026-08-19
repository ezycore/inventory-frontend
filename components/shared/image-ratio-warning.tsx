"use client";
// coding-standard: maintained

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { checkImageRatio, type ImageSize } from "@/lib/image-ratio";

/**
 * The one way a wrong-shaped upload is reported, everywhere.
 *
 * Three components take image uploads — `MediaField` (Customize),
 * `ImageGalleryUpload` (products, brands, categories) and the hero slides panel,
 * which rolls its own control. Each renders this, so the wording and the
 * styling cannot drift into three dialects of the same warning.
 *
 * Amber and inline, matching the house pattern for "this is fine but you should
 * know" (`receive-items-dialog`, `letterhead-builder`). Deliberately NOT a
 * destructive red and not a toast: the upload succeeded, nothing is broken, and
 * a toast would be gone by the time they looked at the picture.
 */
export function ImageRatioWarning({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className="flex items-start gap-1.5 text-xs leading-snug text-amber-600"
    >
      <ImageOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

/**
 * Measure what the merchant picked and hold the warning for it.
 *
 * `recommended` being optional is what keeps this opt-in: a field that has no
 * recommended shape — or has one nobody has decided yet — passes nothing and
 * behaves exactly as it did before.
 *
 * The check is async (the browser has to decode the file), so a fast second
 * pick could otherwise resolve after a slow first one and show the warning for
 * the picture the merchant already replaced. A token guards that.
 */
export function useImageRatioWarning(recommended?: ImageSize) {
  const [warning, setWarning] = useState<string | null>(null);
  // A ref, not state: this is bookkeeping about which decode is current, and
  // putting it in state would both re-render for nothing and rebuild `check` on
  // every pick, changing its identity for every consumer that memoises on it.
  const latest = useRef(0);

  useEffect(() => {
    // A field whose recommendation is removed must not keep showing a warning
    // derived from it.
    if (!recommended) setWarning(null);
  }, [recommended]);

  const check = useCallback(
    async (file: File | null | undefined) => {
      if (!recommended || !file) {
        latest.current += 1; // cancel anything in flight
        setWarning(null);
        return;
      }
      const mine = (latest.current += 1);
      const message = await checkImageRatio(file, recommended);
      // Decoding is async, so a fast second pick can finish before a slow first
      // one. Without this the merchant sees the warning for a picture they have
      // already replaced.
      if (latest.current === mine) setWarning(message);
    },
    [recommended],
  );

  const clear = useCallback(() => {
    latest.current += 1;
    setWarning(null);
  }, []);

  return { warning, check, clear };
}

/**
 * The same check for a field that takes SEVERAL images — a product gallery.
 *
 * Reports a count rather than one sentence per file. Five wrong-shaped photos
 * would otherwise stack five near-identical amber paragraphs under the
 * dropzone, which is a wall of text that gets scrolled past; "3 of these 5 are
 * not square" is the fact the merchant needs, and the first one's detail tells
 * them what "not square" looked like.
 *
 * Only `File`s are measured. An already-uploaded image arrives as a URL string
 * or a stored object, and re-warning about a photo the merchant uploaded weeks
 * ago — and cannot fix from here — is nagging, not help.
 */
export function useImageRatioWarnings(recommended?: ImageSize) {
  const [warning, setWarning] = useState<string | null>(null);
  const latest = useRef(0);

  const check = useCallback(
    async (items: readonly unknown[]) => {
      const files = items.filter((i): i is File => i instanceof File);
      if (!recommended || files.length === 0) {
        latest.current += 1;
        setWarning(null);
        return;
      }
      const mine = (latest.current += 1);
      const results = await Promise.all(
        files.map((f) => checkImageRatio(f, recommended)),
      );
      if (latest.current !== mine) return;

      const bad = results.filter((r): r is string => Boolean(r));
      if (bad.length === 0) {
        setWarning(null);
      } else if (bad.length === 1 && files.length === 1) {
        setWarning(bad[0]);
      } else {
        setWarning(
          `${bad.length} of these ${files.length} images are not ` +
            `${recommended.w} × ${recommended.h}, so they will be cropped where ` +
            `they are shown. They will still upload.`,
        );
      }
    },
    [recommended],
  );

  return { warning, check };
}

/**
 * Declarative form of the check: hand it the field's current value and it
 * measures and reports on its own.
 *
 * This exists because `renderFileUpload` is a plain function, not a component —
 * DynamicForm's field renderers are called as helpers, so a hook inside one
 * breaks the Rules of Hooks (it happens to work while the call order never
 * varies, and stops working the day a field renders conditionally). Pushing the
 * state into a real component makes that structural rather than a rule someone
 * has to remember.
 *
 * It is also simply less to wire: no `check()` call to remember in an onChange
 * handler, and a value replaced from outside the field is measured too.
 */
export function ImageRatioNotice({
  files,
  recommended,
}: {
  /** The field's current value — `File`s are measured, anything else ignored. */
  files: readonly unknown[];
  recommended?: ImageSize;
}) {
  const { warning, check } = useImageRatioWarnings(recommended);

  // The array is rebuilt every render, so it cannot be the dependency. A
  // signature over the identifying fields re-runs when the SET of files really
  // changes and stays quiet when the parent merely re-rendered.
  const signature = files
    .map((f) => (f instanceof File ? `${f.name}:${f.size}:${f.lastModified}` : ""))
    .join("|");

  useEffect(() => {
    void check(files);
    // `files` is intentionally absent: `signature` is its stable projection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, check]);

  return <ImageRatioWarning message={warning} />;
}
