// coding-standard: maintained
/**
 * Minimal, dependency-free markdown for storefront CMS pages (About/FAQ/policies).
 * Parses the practical subset the Content admin promises ("Body (Markdown / plain
 * text)") into a block model that `<MarkdownView>` renders as React nodes — no
 * HTML strings, so owner content can never inject markup. Plain text still reads
 * well: blank lines become paragraphs, and consecutive `Q:` / `A:` lines become
 * styled FAQ items.
 */

export type SfInline =
  | { kind: "text" | "bold" | "italic" | "code"; text: string }
  | { kind: "link"; text: string; href: string };

export interface SfFaqItem {
  q: SfInline[];
  a: SfInline[][];
}

export type SfBlock =
  | { kind: "heading"; level: 1 | 2 | 3; inline: SfInline[] }
  | { kind: "paragraph"; lines: SfInline[][] }
  | { kind: "list"; ordered: boolean; items: SfInline[][] }
  | { kind: "quote"; inline: SfInline[] }
  | { kind: "divider" }
  | { kind: "table"; headers: SfInline[][]; rows: SfInline[][][] }
  | { kind: "faq"; items: SfFaqItem[] };

// Links render only for schemes that can't execute script.
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/)/i;

/** `**bold**`, `*italic*`, `` `code` `` and `[text](url)` inside one line of text. */
export function parseInline(text: string): SfInline[] {
  const out: SfInline[] = [];
  // `code` is matched first so backticked text is never re-scanned for emphasis.
  const re = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ kind: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ kind: "code", text: m[1] });
    else if (m[2] !== undefined) out.push({ kind: "bold", text: m[2] });
    else if (m[3] !== undefined) out.push({ kind: "italic", text: m[3] });
    else if (SAFE_HREF.test(m[5])) out.push({ kind: "link", text: m[4], href: m[5] });
    else out.push({ kind: "text", text: m[4] });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

const HEADING_RE = /^(#{1,3})\s+(.*)$/;
const DIVIDER_RE = /^(-{3,}|\*{3,})$/;
const BULLET_RE = /^[-*]\s+/;
const ORDERED_RE = /^\d+[.)]\s+/;
const QUOTE_RE = /^>\s?/;
const Q_RE = /^q\s*[:).-]\s*/i;
const A_RE = /^a\s*[:).-]\s*/i;
const DELIMITER_CELL_RE = /^:?-{2,}:?$/;

/** `| a | b |` → `["a", "b"]`, tolerating the optional leading/trailing pipes. */
const splitTableRow = (line: string): string[] =>
  line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

/**
 * A table is recognised only by its `|---|---|` delimiter row, never by pipes alone. Owner-written
 * CMS prose contains stray pipes far more often than it contains tables, and treating those as a
 * table would mangle a page that renders fine today.
 */
const isTableDelimiter = (line: string): boolean => {
  const cells = splitTableRow(line);
  return cells.length > 1 && cells.every((cell) => DELIMITER_CELL_RE.test(cell));
};

/** One blank-line-separated group of Q/A lines → FAQ items. */
const parseFaqGroup = (lines: string[]): SfFaqItem[] => {
  const items: SfFaqItem[] = [];
  let q = "";
  let answers: string[] = [];
  const flush = () => {
    if (q) items.push({ q: parseInline(q), a: answers.map(parseInline) });
    q = "";
    answers = [];
  };
  for (const line of lines) {
    if (Q_RE.test(line)) {
      flush();
      q = line.replace(Q_RE, "");
    } else if (A_RE.test(line)) {
      answers.push(line.replace(A_RE, ""));
    } else if (answers.length > 0) {
      answers.push(line);
    } else if (q) {
      q += ` ${line}`;
    }
  }
  flush();
  return items;
};

export function parseStorefrontMarkdown(source: string): SfBlock[] {
  const groups = source
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((g) => g.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((g) => g.length > 0);

  const blocks: SfBlock[] = [];
  const last = () => blocks[blocks.length - 1];

  for (let lines of groups) {
    // Leading heading lines stand alone even inside a multi-line group.
    while (lines.length > 0) {
      const h = HEADING_RE.exec(lines[0]);
      if (!h) break;
      blocks.push({
        kind: "heading",
        level: h[1].length as 1 | 2 | 3,
        inline: parseInline(h[2]),
      });
      lines = lines.slice(1);
    }
    if (lines.length === 0) continue;

    if (lines.length === 1 && DIVIDER_RE.test(lines[0])) {
      blocks.push({ kind: "divider" });
    } else if (lines.length >= 2 && lines[0].includes("|") && isTableDelimiter(lines[1])) {
      blocks.push({
        kind: "table",
        headers: splitTableRow(lines[0]).map(parseInline),
        rows: lines.slice(2).map((l) => splitTableRow(l).map(parseInline)),
      });
    } else if (lines.every((l) => BULLET_RE.test(l))) {
      blocks.push({
        kind: "list",
        ordered: false,
        items: lines.map((l) => parseInline(l.replace(BULLET_RE, ""))),
      });
    } else if (lines.every((l) => ORDERED_RE.test(l))) {
      blocks.push({
        kind: "list",
        ordered: true,
        items: lines.map((l) => parseInline(l.replace(ORDERED_RE, ""))),
      });
    } else if (lines.every((l) => QUOTE_RE.test(l))) {
      blocks.push({
        kind: "quote",
        inline: parseInline(lines.map((l) => l.replace(QUOTE_RE, "")).join(" ")),
      });
    } else if (Q_RE.test(lines[0])) {
      // Consecutive FAQ groups (pairs separated by blank lines) merge into one.
      const items = parseFaqGroup(lines);
      const prev = last();
      if (prev?.kind === "faq") prev.items.push(...items);
      else blocks.push({ kind: "faq", items });
    } else if (A_RE.test(lines[0]) && last()?.kind === "faq") {
      // A blank line slipped between a Q and its A — attach to the open item.
      const faq = last() as Extract<SfBlock, { kind: "faq" }>;
      const item = faq.items[faq.items.length - 1];
      item.a.push(...lines.map((l) => parseInline(l.replace(A_RE, ""))));
    } else {
      blocks.push({ kind: "paragraph", lines: lines.map(parseInline) });
    }
  }
  return blocks;
}
