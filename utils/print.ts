// coding-standard: maintained
/**
 * Print helpers — build one standalone HTML document per print surface (labels,
 * list tables, POS/letterhead documents) and open the browser print dialog on it.
 *
 * Two delivery paths, same markup:
 * - **Desktop** renders it into a hidden same-origin iframe and prints that. No
 *   popup blocker, no stray tab, nothing about the app moves.
 * - **Mobile** (Android Chrome, iOS) mounts it into the app's own top-level
 *   document behind `@media print`, because those browsers will print nothing
 *   else: a subframe's `print()` is routed to the top document, and a document
 *   they never navigated to (`document.write` into `about:blank`, or a `blob:`
 *   URL) errors out with "There was a problem printing the page". See
 *   `needsTopLevelPrint` and `printInTopDocument`.
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
 * dead image URL can never hold the print dialog hostage. Takes the images
 * rather than a Document: on the mobile path they live in a shadow root, which
 * `document.images` does not see. */
const whenImagesReady = (images: ArrayLike<HTMLImageElement>): Promise<void> =>
  new Promise((resolve) => {
    const pending = Array.from(images).filter((img) => !img.complete);
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
  void Promise.all([
    whenImagesReady(doc.images),
    whenFontsReady(doc, locale),
  ]).then(() => {
    win.focus();
    win.print();
  });
};

const PRINT_ROOT_ID = "app-print-root";
const PRINT_STYLE_ID = "app-print-style";
const PRINT_FONT_ID = "app-print-font";

/** Floor on how long the injected invoice lives, so a focus event in the same
 *  tick as `print()` cannot tear it down before the print UI reads the page. */
const TEARDOWN_MIN_AGE_MS = 4000;

/** `@page` is a page-level at-rule: valid only in a document stylesheet. */
const PAGE_AT_RULE = /@page[^{]*\{[^}]*\}/g;
/** `body { … }` selectors, which match nothing inside a shadow root. */
const BODY_SELECTOR = /\bbody\b(?=\s*[,{])/g;

/** A named paper in `@page size` — `A4`, `Letter`, … as opposed to `80mm auto`. */
const NAMED_PAGE_SIZE = /\bsize\s*:\s*(a[0-9]|letter|legal|ledger|tabloid)\b[^;}]*;?/gi;

/**
 * Drop a NAMED `@page size` so the paper chosen in the print dialog wins.
 *
 * A phone lays the printed page out at the app's viewport (~412px), never at the
 * paper, and Chrome rescues that by scaling the result up to fill the sheet —
 * but only while the CSS and the dialog agree on the paper. Declare `size: A4`
 * and pick Letter, and the scale-to-fit is skipped: the invoice prints as a
 * narrow column in the corner at unreadable size. Since the dialog's paper is
 * the one actually in the tray, CSS has no business overriding it here.
 *
 * A *physical* size (`80mm auto` for thermal) is kept: that is a receipt roll,
 * not a preference, and there is no sensible fallback if it is dropped.
 * `margin: 0` is always kept — it is what suppresses the browser's own
 * title/URL/date header and footer.
 */
const dialogPaperWins = (pageRules: string): string =>
  pageRules.replace(NAMED_PAGE_SIZE, "");

/**
 * Mobile path: print the app's OWN top-level document, with everything except
 * the injected invoice hidden by `@media print`.
 *
 * Neither a hidden iframe nor a synthetic tab works on Chrome for Android. The
 * subframe's `print()` is routed to the top document (that is the original
 * "it printed the whole app" bug), and a document the browser did not navigate
 * to — `document.write` into `about:blank`, or a `blob:` URL — fails outright
 * with "There was a problem printing the page", printer or not. The one thing
 * proven to print on that device is an ordinary top-level page, so the invoice
 * becomes part of one.
 *
 * The markup goes in a **shadow root** so the app's stylesheet cannot reach it
 * (Tailwind preflight and the dark-theme `color` would otherwise repaint an
 * invoice that is supposed to be black on white), which forces two rewrites of
 * the caller's CSS, both handled here:
 *   - `@page` rules are hoisted out to a document-level <style>.
 *   - `body` selectors are retargeted to `:host`, the shadow root's own box.
 */
const printInTopDocument = (
  bodyHtml: string,
  title: string,
  styles: string,
  locale: "en" | "bn",
): boolean => {
  document.getElementById(PRINT_ROOT_ID)?.remove();
  document.getElementById(PRINT_STYLE_ID)?.remove();

  const pageRules = styles.match(PAGE_AT_RULE)?.join("\n") ?? "";
  const scopedStyles = styles
    .replace(PAGE_AT_RULE, "")
    .replace(BODY_SELECTOR, ":host");
  const fontFallback =
    locale === "bn" ? `:host { font-family: ${BENGALI_FONT_FAMILY}; }` : "";

  if (locale === "bn" && !document.getElementById(PRINT_FONT_ID)) {
    const link = document.createElement("link");
    link.id = PRINT_FONT_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap";
    document.head.appendChild(link);
  }

  const sheet = document.createElement("style");
  sheet.id = PRINT_STYLE_ID;
  sheet.textContent = `
    ${dialogPaperWins(pageRules)}
    #${PRINT_ROOT_ID} { display: none; }
    @media print {
      /* The app is hidden rather than unmounted: unmounting would lose scroll
         position, focus and any open dialog for the rest of the session. */
      body > *:not(#${PRINT_ROOT_ID}) { display: none !important; }
      #${PRINT_ROOT_ID} { display: block !important; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
      }
    }`;
  document.head.appendChild(sheet);

  const host = document.createElement("div");
  host.id = PRINT_ROOT_ID;
  document.body.appendChild(host);

  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>
      /* all:initial severs every inherited value from the app — colour, font,
         line-height — so the sheet below starts from the same blank slate a
         standalone document would have. */
      :host { all: initial; display: block; color: #111827; background: #fff; }
      * { box-sizing: border-box; }
      ${fontFallback}
      ${scopedStyles}
    </style>${bodyHtml}`;

  // The PDF filename comes from the document title on this path, since the
  // invoice has no document of its own to name.
  const previousTitle = document.title;
  document.title = title;

  /**
   * NOT `afterprint`. On Chrome for Android `print()` hands the page to the
   * system print UI and returns immediately, firing `afterprint` before that UI
   * has rendered anything — tearing the invoice down mid-flight, so the preview
   * snapshots the plain app. That looks identical to the original "it printed
   * the whole app" bug and is the reason this path appeared not to work.
   *
   * Instead, tear down once this tab is genuinely interactive again (the print
   * UI takes focus / hides the page, and returning restores it). A minimum
   * lifetime guards against a stray focus event arriving in the same tick.
   * Overstaying costs nothing: the root is `display: none` on screen, and the
   * next print removes it by id.
   */
  const bornAt = Date.now();
  const onVisible = () => {
    if (document.visibilityState === "visible") finish();
  };
  const finish = () => {
    const age = Date.now() - bornAt;
    if (age < TEARDOWN_MIN_AGE_MS) {
      setTimeout(finish, TEARDOWN_MIN_AGE_MS - age);
      return;
    }
    window.removeEventListener("focus", finish);
    document.removeEventListener("visibilitychange", onVisible);
    document.title = previousTitle;
    host.remove();
    sheet.remove();
  };
  window.addEventListener("focus", finish);
  document.addEventListener("visibilitychange", onVisible);

  void Promise.all([
    whenImagesReady(root.querySelectorAll("img")),
    whenFontsReady(document, locale),
  ]).then(() => window.print());

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
 * Render `bodyHtml` and open the print dialog. Returns `false` only when the
 * dialog could not be started at all; callers surface that as a toast.
 *
 * Still safest called synchronously from the click — nothing here needs a popup
 * any more, but the print dialog is a user-gesture affordance in every browser.
 */
export const printHtml = (
  bodyHtml: string,
  options: PrintHtmlOptions = {},
): boolean => {
  const { title = "Print", styles = "", locale = "en" } = options;

  return needsTopLevelPrint()
    ? printInTopDocument(bodyHtml, title, styles, locale)
    : printInHiddenFrame(buildDocument(bodyHtml, title, styles, locale), locale);
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
