// coding-standard: maintained
/**
 * Print helpers — render a standalone HTML document into a hidden same-origin
 * iframe and open the browser print dialog directly over the app. The iframe
 * (vs. the old popup window) means no popup blockers, no stray browser tab to
 * close, and one shared path for every print surface (labels, list tables,
 * POS/letterhead documents).
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

export interface PrintHtmlOptions {
  /** Document title (becomes the suggested PDF filename). */
  title?: string;
  /** CSS injected into the print document's <style>. */
  styles?: string;
}

/**
 * Render `bodyHtml` as a standalone document in a hidden iframe and open the
 * print dialog. Returns `false` only if the frame couldn't be created (callers
 * historically used this to surface a popup-blocked hint; it is now near-dead).
 */
export const printHtml = (
  bodyHtml: string,
  options: PrintHtmlOptions = {},
): boolean => {
  const { title = "Print", styles = "" } = options;

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
  doc.write(
    `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #fff; }
        ${styles}
      </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
    </html>`,
  );
  doc.close();

  // Clean up only after the dialog closes — removing the frame earlier would
  // blank the print preview. If afterprint never fires (old browsers), the
  // invisible frame is swept by the next print call.
  win.onafterprint = () => frame.remove();
  void whenImagesReady(doc).then(() => {
    win.focus();
    win.print();
  });
  return true;
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
