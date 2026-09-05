// coding-standard: maintained
/**
 * Generate the merchant-persona QA appendices from the code they describe.
 *
 * Appendix A (nav destinations) runs the REAL `filterNavItems` against each
 * persona's effective feature map, so it cannot drift from `constants/navItem.ts`.
 * Appendix B (feature-gated endpoints) reads `docs/reference/endpoints.json`,
 * which now records `writeOnlyFeatures` per endpoint — so the split between
 * "must 403" and "must still answer 200" is derived rather than hand-corrected.
 *
 * Both halves were previously written by hand. Appendix A was generated against
 * a persona map that did not match any shipped plan tier, and Appendix B had to
 * be corrected by someone who happened to know which three routers gate writes
 * only. Neither would survive a route change.
 *
 * Run:  node scripts/gen-persona-appendix.mjs > /tmp/appendix.md
 */
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FE = join(HERE, "..");
const BE = join(FE, "..", "inventory-backend");
const MC = join(FE, "..", "mission-control");

/** Read `TIER_FEATURES` out of the MC seed — the one definition of a tier. */
function tierFeatures() {
  const src = readFileSync(
    join(MC, "src/scripts/seed-launch-plans.ts"),
    "utf-8",
  );
  const block = src.slice(
    src.indexOf("export const TIER_FEATURES"),
    src.indexOf("} as const satisfies"),
  );
  const tiers = {};
  for (const m of block.matchAll(/(\w+):\s*\{([^}]*)\}/g)) {
    tiers[m[1]] = Object.fromEntries(
      [...m[2].matchAll(/(\w+):\s*(true|false)/g)].map(([, k, v]) => [
        k,
        v === "true",
      ]),
    );
  }
  return tiers;
}

/** `FEATURE_REQUIRES`, read from the backend so the cascade matches production. */
function featureRequires() {
  const src = readFileSync(
    join(BE, "src/types/organization.types.ts"),
    "utf-8",
  );
  const block = src.slice(
    src.indexOf("export const FEATURE_REQUIRES"),
    src.indexOf("export function computeEffectiveFeatures"),
  );
  const out = {};
  for (const m of block.matchAll(/^\s*(\w+):\s*\[([^\]]*)\]/gm)) {
    out[m[1]] = [...m[2].matchAll(/"(\w+)"/g)].map(([, k]) => k);
  }
  return out;
}

/**
 * The plan ceiling AND the merchant's overrides, with the cascade applied.
 *
 * Same order as `computeEffectiveFeatures`: `granted && (override ?? true)`,
 * then the dependency fixpoint. An override can only ever switch something OFF —
 * it is the merchant's answer, not a way past the plan.
 */
function effective(plan, requires, overrides = {}) {
  const eff = {};
  for (const [key, granted] of Object.entries(plan)) {
    eff[key] = granted && overrides[key] !== false;
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const [key, deps] of Object.entries(requires)) {
      if (eff[key] && deps.some((d) => !eff[d])) {
        eff[key] = false;
        changed = true;
      }
    }
  }
  return eff;
}

/**
 * Nav rows a persona reaches.
 *
 * Mirrors `filterNavItems`' feature half only — permissions are assumed
 * complete (an owner), which is what the appendix describes. Kept small and
 * explicit rather than importing the TSX module, which would need a bundler.
 */
function visibleNav(groups, features) {
  const ok = (item) =>
    (item.features ?? []).every((f) => features[f] !== false) &&
    (!item.anyFeatures?.length ||
      item.anyFeatures.some((f) => features[f] !== false));

  const walk = (items) =>
    items
      .filter(ok)
      .map((item) => ({
        ...item,
        items: item.items ? walk(item.items) : undefined,
      }))
      // A parent whose children all vanished is a dead row.
      .filter((item) => !item.items || item.items.length > 0 || item.url !== "#");

  return groups
    .map((g) => ({ ...g, items: walk(g.items) }))
    .filter((g) => g.items.length > 0);
}

/**
 * The real nav table — the module's own data, not a re-parse of it.
 *
 * Two earlier attempts failed in instructive ways. Coercing the TypeScript
 * source to JSON with regexes emitted ZERO destinations for every persona and
 * said nothing about it; importing the `.ts` directly hung, because the file
 * opens with a `@/types/layout` import that needs the app's path aliases.
 *
 * A generator that fails loudly is fine. One that confidently emits an empty
 * appendix is how a whole QA pass gets run against a fiction — so this strips
 * the two type annotations and the type-only import, writes plain ESM, and
 * refuses to return an empty result.
 */
async function navGroups() {
  const src = readFileSync(join(FE, "constants/navItem.ts"), "utf-8");
  const js = src
    // The only import, and it is types-only.
    .replace(/^import\s+\{[^}]*\}\s+from\s+"@\/types\/layout";\s*$/m, "")
    .replace(/export const navGroups: NavGroup\[\] =/, "export const navGroups =")
    .replace(/export const navItems: NavItem\[\] =/, "export const navItems =");

  const tmp = join(tmpdir(), `navitem-${process.pid}.mjs`);
  writeFileSync(tmp, js);
  try {
    const mod = await import(pathToFileURL(tmp).href);
    const groups = mod.navGroups;
    if (!Array.isArray(groups) || groups.length === 0) {
      throw new Error("navGroups came back empty — refusing to emit an appendix");
    }
    return groups;
  } finally {
    rmSync(tmp, { force: true });
  }
}

/**
 * A persona is a plan tier PLUS what the merchant answered — not a tier alone.
 *
 * T2 is the case that forces this. "Storefront + stock, no counter" is not a
 * tier: `growth` grants `sales`, and the merchant switches the counter off by
 * answering "Online" to the wizard's first question, which writes a
 * `featureOverrides` entry. Modelling it as a tier that withholds `sales` would
 * describe a plan nobody sells and would test the wrong locked screen — a
 * withheld capability offers an upgrade, a merchant-disabled one offers a
 * switch.
 *
 * `overrides` here are exactly what onboarding would write.
 */
const PERSONAS = [
  // Same reasoning as T2, and it was inconsistent to omit it: `start` grants
  // `sales`, so a persona described as "storefront only — create products, take
  // orders, deliver, return" has to answer "Online" too. Without the override
  // this persona kept New Sale, Sales History, Sales Report and Discounts —
  // four destinations a merchant who never opens a till does not have.
  ["T3", "start", "Storefront only", { sales: false }],
  ["T2", "growth", "Storefront + Stock", { sales: false }],
  ["T1", "business", "Full ERP", {}],
];

const tiers = tierFeatures();
const requires = featureRequires();
const groups = await navGroups();
const endpoints = JSON.parse(
  readFileSync(join(BE, "docs/reference/endpoints.json"), "utf-8"),
).endpoints;

const out = [];
out.push("# Appendix A — nav destinations per persona\n");
out.push(
  "Generated by `node scripts/gen-persona-appendix.mjs` from the REAL tier maps",
  "(`mission-control/src/scripts/seed-launch-plans.ts` → `TIER_FEATURES`), the real",
  "cascade (`FEATURE_REQUIRES`) and the real nav table. Regenerate after changing any",
  "of the three.\n",
);

const summary = [];
for (const [label, tier, name, overrides] of PERSONAS) {
  const eff = effective(tiers[tier], requires, overrides);
  const visible = visibleNav(groups, eff);
  const urls = new Set();
  const lines = [];
  for (const group of visible) {
    lines.push(`### ${group.label}`);
    const emit = (items, depth) => {
      for (const item of items) {
        if (item.url && item.url !== "#") urls.add(item.url);
        const ro = item.readOnly ? " `[RO]`" : "";
        lines.push(
          `- ${"  ".repeat(depth)}**${item.title}** — \`${item.url}\`${ro}`,
        );
        if (item.items) emit(item.items, depth + 1);
      }
    };
    emit(group.items, 0);
  }
  const off = Object.entries(eff)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  const chose = Object.keys(overrides);
  summary.push([label, name, tier, urls.size, off, chose]);
  out.push(`\n## ${label} — ${name} (\`${tier}\`) — ${urls.size} distinct URLs\n`);
  out.push(
    `Plan: \`${tier}\`${chose.length ? ` · merchant switched off: ${chose.join(", ")}` : ""}`,
  );
  // Two different locked screens, so they are listed apart: a plan-withheld
  // capability offers an upgrade, a merchant-disabled one offers a switch.
  out.push(`Off (withheld, suppressed or switched off): ${off.join(", ") || "(nothing)"}\n`);
  out.push(...lines);
}

out.push("\n---\n\n# Appendix B — feature-gated endpoints per persona\n");
out.push(
  "Derived from `docs/reference/endpoints.json`, which records `writeOnlyFeatures`",
  "per endpoint — so the 403/200 split is computed, not hand-corrected.\n",
);

for (const [label, tier, name, overrides] of PERSONAS) {
  const eff = effective(tiers[tier], requires, overrides);
  const blocked = [];
  const readable = [];
  for (const ep of endpoints) {
    const feats = ep.features ?? [];
    if (feats.length === 0) continue;
    const missing = feats.filter((f) => eff[f] === false);
    if (missing.length === 0) continue;

    const isRead = ["GET", "HEAD", "OPTIONS"].includes(ep.method);
    const writeOnly = ep.writeOnlyFeatures ?? [];
    // Readable only when EVERY missing gate lets reads through. One hard gate
    // among them and the read is refused like any write.
    const stillReadable = isRead && missing.every((f) => writeOnly.includes(f));
    (stillReadable ? readable : blocked).push(
      `- \`${ep.method} ${ep.path}\` — ${missing.join(" + ")}`,
    );
  }
  out.push(
    `\n## ${label} — ${name}: ${blocked.length} must 403 · ${readable.length} reads must still answer 200\n`,
  );
  out.push(...(blocked.length ? blocked : ["- (none)"]));
  if (readable.length) {
    out.push(
      "\n_Reads that MUST still answer 200 — `requireFeatureForWrites`, so history stays reachable:_\n",
    );
    out.push(...readable);
  }
}

out.push("\n---\n\n## Summary\n");
out.push("| | Persona | Plan | Merchant switched off | Nav URLs | Off in total |");
out.push("|---|---|---|---|---|---|");
for (const [label, name, tier, count, off, chose] of summary) {
  out.push(
    `| **${label}** | ${name} | \`${tier}\` | ${chose.join(", ") || "—"} | **${count}** | ${off.join(", ") || "—"} |`,
  );
}

console.log(out.join("\n"));
