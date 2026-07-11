// coding-standard: maintained
/**
 * Print helpers — open a dedicated print window, write a standalone HTML
 * document, wait for images, then invoke the browser print dialog. Generalizes
 * the pattern that used to live inline in the barcode label sheet so every
 * print surface (labels, list tables, and later POS documents) shares one path.
 *
 * IMPORTANT — popup blockers: call these *synchronously* from a click handler.
 * `window.open` is blocked when it is not a direct result of a user gesture, so
 * never `await` anything before calling `printHtml` / `printTable`.
 */

/** Escape a value for safe interpolation into the print document's HTML. */
export const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Injected into the print window: wait for any images to finish loading before
// printing (barcodes/logos), then close the window once printing is done.
const PRINT_BOOTSTRAP = `
  window.onload = function () {
    var images = document.images;
    var total = images.length;
    var loaded = 0;
    if (total === 0) { window.print(); return; }
    Array.prototype.forEach.call(images, function (img) {
      img.onload = img.onerror = function () {
        loaded++;
        if (loaded === total) window.print();
      };
    });
  };
  window.onafterprint = function () { window.close(); };
`;

export interface PrintHtmlOptions {
  /** Document title (shown in the print header/footer). */
  title?: string;
  /** CSS injected into the print document's <style>. */
  styles?: string;
  /**
   * Print documents open in a fresh, isolated window (`window.open("", ...)`
   * + `document.write`) — it does NOT inherit the app's self-hosted Bengali
   * font (next/font is scoped to the main document). "bn" pulls in Noto Sans
   * Bengali from Google Fonts so Bangla glyphs render instead of tofu boxes;
   * omit/"en" for the Latin-only default (no extra network request).
   */
  locale?: "en" | "bn";
}

// Google Fonts CSS for the print window's Bengali fallback. Loaded only when
// `locale: "bn"` — the print window already waits on <img> loads before
// calling window.print(), so one more network fetch here is consistent with
// that existing constraint (logo/watermark images are remote too).
const BENGALI_FONT_LINK = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap" rel="stylesheet" />
`;
const BENGALI_FONT_FAMILY = "'Noto Sans Bengali', sans-serif";

/**
 * Open a print window and render `bodyHtml` inside a standalone document.
 * Returns `false` when the popup was blocked so the caller can surface a hint.
 */
export const printHtml = (
  bodyHtml: string,
  options: PrintHtmlOptions = {},
): boolean => {
  const { title = "Print", styles = "", locale = "en" } = options;
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return false;

  const fontLink = locale === "bn" ? BENGALI_FONT_LINK : "";
  // Prepended so a document-level `body { font-family }` in `styles` still wins
  // (later rule, same specificity) while every element without its own
  // font-family falls back to the Bengali face instead of tofu boxes.
  const fontFallback =
    locale === "bn" ? `body { font-family: ${BENGALI_FONT_FAMILY}; }` : "";

  win.document.write(
    `<!DOCTYPE html>
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
      <script>${PRINT_BOOTSTRAP}<\/script>
    </body>
    </html>`,
  );
  win.document.close();
  return true;
};

export interface PrintTableColumn<TRow> {
  header: string;
  value: (row: TRow) => unknown;
}

const TABLE_STYLES = `
  body { font-family: Arial, sans-serif; margin: 16px; color: #111; }
  h1 { font-size: 18px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  thead { background: #f3f4f6; }
  @page { margin: 12mm; }
`;

/**
 * Print an array of rows as a clean tabular sheet. `columns` is a curated
 * subset (header + value accessor) — independent of the on-screen table columns.
 * Returns `false` if the popup was blocked.
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
