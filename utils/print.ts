// coding-standard: maintained
/**
 * Print helpers — build one standalone HTML document per print surface (labels,
 * list tables, POS/letterhead documents) and open the browser print dialog on it.
 *
 * Two delivery paths, same document:
 * - **Desktop** renders it into a hidden same-origin iframe and prints that. No
 *   popup blocker, no stray tab, nothing about the app moves.
 * - **Mobile** (Android Chrome, iOS) opens a real top-level tab instead, because
 *   those browsers route a subframe's `print()` to the top document — the hidden
 *   frame prints nothing and the user gets the app UI on paper. See
 *   `needsTopLevelPrint`.
 *
 * Because of that second path, `printHtml` MUST be called synchronously from the
 * click handler, or the tab is blocked.
 *
 * Images (logos/barcodes) are awaited before printing — counting an image as
 * pending only when it isn't already `complete`. (The popup era attached
 * onload handlers to every image; cached images never fire those, so the
 * print dialog silently never opened.)
 */

/** Escape a value for safe interpolation into the print document's HTML. */
export const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const FRAME_ID = "app-print-frame";

/** Resolves when every <img> has settled — or after a grace timeout, so one
 * dead image URL can never hold the print dialog hostage. */
const whenImagesReady = (doc: Document): Promise<void> =>
  new Promise((resolve) => {
    const pending = Array.from(doc.images).filter((img) => !img.complete);
    if (pending.length === 0) {
      resolve();
      return;
    }
    let left = pending.length;
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };
    const one = () => {
      left -= 1;
      if (left <= 0) finish();
    };
    for (const img of pending) img.onload = img.onerror = one;
    setTimeout(finish, 2500);
  });

// Bengali print pulls its face from Google Fonts (see BENGALI_FONT_LINK). The
// stylesheet <link> is not covered by whenImagesReady, so without this the
// dialog can open before the webfont arrives and Bangla prints in a fallback
// face. Explicitly load both weights, then await `fonts.ready`. Same 2.5s grace
// as images so a slow/blocked font CDN can never hold the dialog hostage.
const BENGALI_FONT_LOAD_FAMILY = "'Noto Sans Bengali'";
const whenFontsReady = (doc: Document, locale: "en" | "bn"): Promise<void> => {
  const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
  if (locale !== "bn" || !fonts) return Promise.resolve();
  const ready = Promise.all([
    fonts.load(`400 16px ${BENGALI_FONT_LOAD_FAMILY}`),
    fonts.load(`700 16px ${BENGALI_FONT_LOAD_FAMILY}`),
  ])
    .then(() => fonts.ready)
    .then(() => undefined)
    .catch(() => undefined);
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2500));
  return Promise.race([ready, timeout]);
};

export interface PrintHtmlOptions {
  /** Document title (becomes the suggested PDF filename). */
  title?: string;
  /** CSS injected into the print document's <style>. */
  styles?: string;
  /**
   * The print document is a fresh, isolated document on both paths, so it does
   * NOT inherit the app's self-hosted Bengali font (next/font is scoped to the
   * main document). "bn" pulls in Noto Sans Bengali from Google Fonts so Bangla
   * glyphs render instead of tofu boxes; omit/"en" for the Latin-only default
   * (no extra network request).
   */
  locale?: "en" | "bn";
}

// Google Fonts CSS for the print document's Bengali fallback. Loaded only when
// `locale: "bn"`; the print path awaits this face (whenFontsReady) alongside
// <img> loads before calling window.print(), so the extra network fetch is
// consistent with the existing image-load wait (logos/watermarks are remote too).
const BENGALI_FONT_LINK = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap" rel="stylesheet" />
`;
const BENGALI_FONT_FAMILY = "'Noto Sans Bengali', sans-serif";

/** The standalone print document, identical on both paths below. */
const buildDocument = (
  bodyHtml: string,
  title: string,
  styles: string,
  locale: "en" | "bn",
): string => {
  const fontLink = locale === "bn" ? BENGALI_FONT_LINK : "";
  // Prepended so a document-level `body { font-family }` in `styles` still wins
  // (later rule, same specificity) while every element without its own
  // font-family falls back to the Bengali face instead of tofu boxes.
  const fontFallback =
    locale === "bn" ? `body { font-family: ${BENGALI_FONT_FAMILY}; }` : "";

  return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      ${fontLink}
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #fff; }
        ${fontFallback}
        ${styles}
      </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
    </html>`;
};

/**
 * Chrome for Android and every iOS browser route a subframe's `print()` to the
 * TOP-LEVEL document: the hidden frame contributes nothing and the browser
 * prints the app UI instead of the invoice. There is no feature test for it, so
 * this is a platform check — those platforms print from their own tab instead.
 * (iPadOS 13+ reports a Mac UA, hence the touch-point clause.)
 */
const needsTopLevelPrint = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPod|iPad/i.test(ua)) return true;
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
};

/** Wait for the document's assets, then raise the dialog. */
const printWhenReady = (
  win: Window,
  doc: Document,
  locale: "en" | "bn",
): void => {
  void Promise.all([whenImagesReady(doc), whenFontsReady(doc, locale)]).then(
    () => {
      win.focus();
      win.print();
    },
  );
};

/** Give up waiting for the tab's document rather than polling forever. */
const TAB_READY_TIMEOUT_MS = 10_000;
const TAB_READY_POLL_MS = 60;

/**
 * Mobile path: a real top-level tab, which is the only frame those browsers
 * will print. Opened synchronously so it still counts as the user's click.
 * `onafterprint` closes it again; if the browser never fires that event the tab
 * simply stays, which is a visible, recoverable outcome — unlike printing the
 * wrong document.
 *
 * The document is served from a **blob: URL**, not `document.write` into
 * `about:blank`: Chrome for Android refuses to print a written-into blank
 * document and answers "There was a problem printing the page" — with no
 * printer involved, since even Save-as-PDF goes through the same pipeline. A
 * blob URL is a real navigation and prints normally. It also inherits this
 * origin, so the document stays readable for the image/font wait below.
 *
 * Readiness is polled rather than hung off a `load` listener: the listener would
 * have to be attached to the initial about:blank window, which is discarded when
 * the blob document replaces it.
 */
const printInNewTab = (html: string, locale: "en" | "bn"): boolean => {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }

  const release = () => URL.revokeObjectURL(url);
  const deadline = Date.now() + TAB_READY_TIMEOUT_MS;

  const whenLoaded = () => {
    let doc: Document | null = null;
    try {
      // Until the blob navigation commits, this is still the opener's initial
      // about:blank — which reports `readyState: "complete"` and would print a
      // blank sheet. The URL check is what distinguishes the two.
      doc = win.location.href === url ? win.document : null;
    } catch {
      // Cross-origin only while the blob navigation is still in flight.
      doc = null;
    }

    if (win.closed) {
      release();
      return;
    }
    if (!doc || doc.readyState !== "complete") {
      if (Date.now() > deadline) {
        release();
        return;
      }
      setTimeout(whenLoaded, TAB_READY_POLL_MS);
      return;
    }

    win.onafterprint = () => {
      release();
      win.close();
    };
    printWhenReady(win, doc, locale);
  };

  whenLoaded();
  return true;
};

/** Desktop path: a hidden same-origin iframe, so nothing about the app moves. */
const printInHiddenFrame = (html: string, locale: "en" | "bn"): boolean => {
  // One print frame at a time — a leftover frame belongs to a finished dialog.
  document.getElementById(FRAME_ID)?.remove();
  const frame = document.createElement("iframe");
  frame.id = FRAME_ID;
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(frame);

  const win = frame.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    frame.remove();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Clean up only after the dialog closes — removing the frame earlier would
  // blank the print preview. If afterprint never fires (old browsers), the
  // invisible frame is swept by the next print call.
  win.onafterprint = () => frame.remove();
  printWhenReady(win, doc, locale);
  return true;
};

/**
 * Render `bodyHtml` as a standalone document and open the print dialog.
 * Returns `false` when printing could not be started — on mobile that means the
 * new tab was blocked, which callers surface as the popup-blocked hint.
 *
 * MUST be called synchronously from the user's click: the mobile path opens a
 * tab, and a deferred `window.open` is blocked.
 */
export const printHtml = (
  bodyHtml: string,
  options: PrintHtmlOptions = {},
): boolean => {
  const { title = "Print", styles = "", locale = "en" } = options;
  const html = buildDocument(bodyHtml, title, styles, locale);

  return needsTopLevelPrint()
    ? printInNewTab(html, locale)
    : printInHiddenFrame(html, locale);
};

export interface PrintTableColumn<TRow> {
  header: string;
  value: (row: TRow) => unknown;
}

const TABLE_STYLES = `
  body { font-family: Arial, sans-serif; margin: 12mm; color: #111; }
  h1 { font-size: 18px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  thead { background: #f3f4f6; }
  /* Zero page margin = the browser has nowhere to paint its default
     title/URL/date header-footer; body margin provides the whitespace. */
  @page { margin: 0; }
`;

/**
 * Print an array of rows as a clean tabular sheet. `columns` is a curated
 * subset (header + value accessor) — independent of the on-screen table columns.
 * Returns `false` if printing couldn't start.
 */
export const printTable = <TRow>(
  rows: TRow[],
  columns: PrintTableColumn<TRow>[],
  options: { title?: string } = {},
): boolean => {
  const head = `<tr>${columns
    .map((column) => `<th>${escapeHtml(column.header)}</th>`)
    .join("")}</tr>`;
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => `<td>${escapeHtml(column.value(row))}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  const heading = options.title ? `<h1>${escapeHtml(options.title)}</h1>` : "";
  const html = `${heading}<table><thead>${head}</thead><tbody>${body}</tbody></table>`;

  return printHtml(html, { title: options.title ?? "Print", styles: TABLE_STYLES });
};
