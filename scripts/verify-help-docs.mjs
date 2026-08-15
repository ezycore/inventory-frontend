// coding-standard: maintained
/**
 * CI gate: the customer help docs must not describe a UI that no longer exists.
 *
 * Why this exists
 * ---------------
 * `verify-docs.mjs` keeps *developer* docs honest — it checks file paths and API routes, the things
 * developer docs cite. Customer help docs cite something else entirely: **what the screen says**.
 * "Click Finalize Sale" is the claim, and it goes wrong the day someone renames that button. No
 * path check catches that, because no path changed.
 *
 * So this gate binds each help page to the message keys behind the UI text it quotes. The English
 * message catalogue (`messages/en/*.json`) is the same source the app renders from, which makes it
 * the only honest thing to check a help page against.
 *
 * What it checks (all fail the build):
 *   1. STALE LABEL   — a `ui_labels` key whose current English value is absent from the page body.
 *                      The button was renamed; the sentence quoting it now lies.
 *   2. DEAD KEY      — a `ui_labels` key that no longer exists in `messages/en/`.
 *   3. PHANTOM ROUTE — `covers_routes` naming a route `constants/navItem.ts` does not serve.
 *   4. FEATURE DRIFT — frontmatter `features` disagreeing with the nav's gating for those routes.
 *   5. UNDOCUMENTED  — a nav route claimed by no page and not deferred in `docs/help/BACKLOG.md`.
 *
 * Check 5 is a ratchet, not a cliff. Only the onboarding path is written today, so most routes are
 * listed in BACKLOG.md and pass. A *newly added* route matches nothing and fails until it is either
 * documented or consciously deferred — which is the only point at which the decision is cheap.
 *
 * Reported but never fatal: pages present in `en/` with no `bn/` counterpart. Translation lagging is
 * normal; blocking an English fix until Bangla catches up would just stop people writing docs.
 *
 * Usage:  pnpm help:verify
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "./help/frontmatter.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(SCRIPT_DIR, "..");
const HELP_DIR = path.join(REPO_ROOT, "docs", "help");
const EN_DIR = path.join(HELP_DIR, "en");
const BN_DIR = path.join(HELP_DIR, "bn");
const MESSAGES_DIR = path.join(REPO_ROOT, "messages");
const NAV_FILE = path.join(REPO_ROOT, "constants", "navItem.ts");
const BACKLOG_FILE = path.join(HELP_DIR, "BACKLOG.md");

/** Routes that are real screens but deliberately outside the help docs' scope. */
const SCOPE_EXEMPT = [
  "#", // group headers with no page of their own
  // Subscription/plan management — documented by sales, not support. Reached from the sidebar's
  // user menu rather than a nav item, so this only bites if it ever returns to the sidebar.
  "/dashboard/billing",
];

/**
 * Live screens a help page may claim even though the sidebar does not list them.
 *
 * The phantom check assumes the nav is the full inventory of screens, and it nearly is. "Customize
 * workspace" is the exception by design: it is the way back from every hidden feature, so it sits in
 * the sidebar footer rather than in a nav group (see `AppSidebar`). Dropping it from `covers_routes`
 * to satisfy the gate would cost the screen its contextual help — the opposite of what this file is
 * for. Add a route here only when it is genuinely reachable and genuinely not a nav item.
 */
const NON_NAV_ROUTES = ["/settings/features"];

const errors = [];
const warnings = [];

/**
 * Flatten a string to the form worth comparing across prose and UI.
 *
 * A help page wraps at 100 columns, so any label longer than a few words lands with a newline
 * through the middle of it; prose lowercases a sentence quoted mid-sentence, and re-punctuates the
 * end of one. None of that is drift — the words are still the words. Matching on the words alone
 * keeps the check aimed at what it is for: someone renaming the button.
 *
 * The trailing set includes the Bangla danda `।`, which ends most Bangla UI sentences and which
 * Bangla prose drops when quoting mid-sentence exactly as English drops a full stop.
 */
function normalizeQuote(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?…।]+$/, "")
    .trim()
    .toLowerCase();
}

/** Flatten `messages/<locale>/*.json` into `namespace:dotted.key` → string, the form pages cite. */
function loadMessages(locale) {
  const catalogue = new Map();
  const dir = path.join(MESSAGES_DIR, locale);
  if (!fs.existsSync(dir)) return catalogue;

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const namespace = path.basename(file, ".json");
    const json = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));

    const walk = (node, prefix) => {
      for (const [key, value] of Object.entries(node)) {
        const dotted = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object") walk(value, dotted);
        else if (typeof value === "string") catalogue.set(`${namespace}:${dotted}`, value);
      }
    };
    walk(json, "");
  }
  return catalogue;
}

/**
 * The nav is the product's own statement of what screens exist and how they are gated, so it is the
 * coverage baseline. Each item block starts at `title:`, which makes splitting on it enough to keep
 * a url with its own `features` / `permissions` — no TS parser needed for a shape this regular.
 */
function loadNavRoutes() {
  if (!fs.existsSync(NAV_FILE)) return new Map();
  const source = fs.readFileSync(NAV_FILE, "utf8");
  const routes = new Map();

  for (const chunk of source.split(/\btitle:/).slice(1)) {
    const url = chunk.match(/\burl:\s*"([^"]+)"/);
    if (!url) continue;
    const featureBlock = chunk.match(/\bfeatures:\s*\[([^\]]*)\]/);
    const features = featureBlock
      ? [...featureBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
      : [];
    // A url can appear twice (parent + its own child); the child block carries the real gating.
    if (!routes.has(url[1]) || features.length) routes.set(url[1], features);
  }
  return routes;
}

/** Routes consciously deferred, read from the BACKLOG checklist so deferral stays reviewable. */
function loadBacklog() {
  if (!fs.existsSync(BACKLOG_FILE)) return new Set();
  const raw = fs.readFileSync(BACKLOG_FILE, "utf8");
  return new Set([...raw.matchAll(/^\s*-\s*\[[ x]\]\s*`([^`]+)`/gm)].map((m) => m[1]));
}

function loadPages(dir, locale) {
  if (!fs.existsSync(dir)) {
    if (locale === "en") errors.push("docs/help/en/ does not exist — no customer help docs to verify");
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const parsed = parseFrontmatter(fs.readFileSync(path.join(dir, file), "utf8"));
      if (!parsed) {
        errors.push(`docs/help/${locale}/${file}: missing YAML frontmatter block`);
        return null;
      }
      return { file, ...parsed };
    })
    .filter(Boolean);
}

/**
 * Check that every label a page quotes still reads that way in its own locale's catalogue.
 *
 * Run per locale against its own messages: an English page is checked against `messages/en`, a
 * Bangla page against `messages/bn`. Without the Bangla pass a translated page could quote a button
 * that was reworded months ago and nothing would notice — and translations are exactly where that
 * happens, because they are written once and rarely revisited.
 */
function checkQuotedLabels(pages, catalogue, locale) {
  for (const { file, data, body } of pages) {
    const where = `docs/help/${locale}/${file}`;

    for (const key of data.ui_labels ?? []) {
      const value = catalogue.get(key);
      if (value === undefined) {
        errors.push(`${where}: DEAD KEY — \`${key}\` no longer exists in messages/${locale}/`);
        continue;
      }
      // Interpolated messages ({count}, {amount}) are quoted only up to their first placeholder.
      const quotable = normalizeQuote(value.split("{")[0]);
      if (quotable.length >= 3 && !normalizeQuote(body).includes(quotable)) {
        errors.push(
          `${where}: STALE LABEL — \`${key}\` now reads "${value}", which this page never quotes`,
        );
      }
    }
  }
}

const messages = loadMessages("en");
const navRoutes = loadNavRoutes();
const backlog = loadBacklog();
const pages = loadPages(EN_DIR, "en");
const bnPages = loadPages(BN_DIR, "bn");
const claimed = new Set();

checkQuotedLabels(pages, messages, "en");
checkQuotedLabels(bnPages, loadMessages("bn"), "bn");

// A Bangla page whose English source is gone is a leftover, and will never be found by a reader
// coming from the English side.
const enSlugs = new Set(pages.map((p) => path.basename(p.file, ".md")));
for (const { file } of bnPages) {
  if (!enSlugs.has(path.basename(file, ".md"))) {
    errors.push(`docs/help/bn/${file}: no English source page — orphaned translation`);
  }
}

for (const { file, data, body } of pages) {
  const where = `docs/help/en/${file}`;

  for (const field of ["title", "slug", "summary", "order", "covers_routes"]) {
    if (!data[field] || data[field].length === 0) {
      errors.push(`${where}: frontmatter is missing required field \`${field}\``);
    }
  }

  if (data.slug && data.slug !== path.basename(file, ".md")) {
    errors.push(`${where}: slug \`${data.slug}\` does not match filename`);
  }

  // 3 + 4 — the routes claimed must exist, and be gated the way the page says they are.
  for (const route of data.covers_routes ?? []) {
    claimed.add(route);
    if (NON_NAV_ROUTES.includes(route)) continue;
    if (!navRoutes.has(route)) {
      errors.push(`${where}: PHANTOM ROUTE — \`${route}\` is not a route in constants/navItem.ts`);
      continue;
    }
    const navFeatures = navRoutes.get(route);
    const declared = data.features ?? [];
    for (const feature of navFeatures) {
      if (!declared.includes(feature)) {
        errors.push(
          `${where}: FEATURE DRIFT — \`${route}\` is gated on \`${feature}\`, not declared in frontmatter`,
        );
      }
    }
  }

  if (!fs.existsSync(path.join(BN_DIR, file))) {
    warnings.push(`${where}: no Bangla translation yet (docs/help/bn/${file})`);
  }
}

// 5 — the ratchet. A route nobody documented and nobody deferred is a new feature that shipped dark.
for (const [route] of navRoutes) {
  if (SCOPE_EXEMPT.includes(route) || claimed.has(route) || backlog.has(route)) continue;
  errors.push(
    `UNDOCUMENTED — \`${route}\` is in the sidebar but no help page covers it. ` +
      `Write one, or defer it explicitly in docs/help/BACKLOG.md.`,
  );
}

// Counted against the nav, so a claim on a non-nav screen is not a documented *nav* route — leaving
// it in printed 58/57.
const documented = [...claimed].filter((route) => !NON_NAV_ROUTES.includes(route)).length;
const total = navRoutes.size - SCOPE_EXEMPT.filter((r) => navRoutes.has(r)).length;

console.log(`help:verify — ${pages.length} pages, ${documented}/${total} routes documented`);

for (const warning of warnings) console.log(`  warn  ${warning}`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log("  ok    no stale labels, phantom routes or undocumented screens");
