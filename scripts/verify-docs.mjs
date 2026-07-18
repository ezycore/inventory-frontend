// coding-standard: maintained
/**
 * CI gate: the frontend's docs must not lie about the code — its own, or the backend's.
 *
 * Why this exists
 * ---------------
 * The backend has `pnpm docs:verify`; the frontend had **no doc tooling at all**. Its skills and docs
 * cite frontend files (`components/…`, `utils/…`) *and* backend files (`src/services/auth.service.ts`)
 * and backend endpoints (`GET /api/brands`) — and nothing checked any of it. A skill can rot silently:
 * the backend renames a service, moves a route, deletes a file, and the frontend skill keeps pointing
 * at the ghost. This is the frontend half of `api-contract-and-skills.md` §10c — the structural
 * lie-detector, ported from the backend's `scripts/docs/verify-docs.ts`.
 *
 * What it checks (all four fail the build):
 *   1. DEAD PATH     — a doc cites `src/…`, `components/…`, etc. that resolves in **no** repo.
 *   2. DEAD LINK     — a relative `[text](./foo.md)` link whose target does not exist (so a docs
 *                      reorg that moves a skill is self-correcting instead of silently broken).
 *   3. PHANTOM ROUTE — a doc documents `GET /api/…` the backend router does not serve.
 *   4. RESURRECTED   — a doc declares an endpoint/file absent that actually exists now.
 *
 * What it deliberately does NOT check: response-DTO / query-schema coverage. That contract is
 * *declared in the backend and generated*, not owned here — mirroring it would be the exact
 * second-copy the plan says to avoid. The frontend consumes the generated types (see
 * `verify-api-types.mjs`); it does not re-document the API.
 *
 * Cross-repo, gracefully. The known-route set comes from the backend's generated
 * `docs/reference/endpoints.json`, and backend `src/…` citations are resolved against the backend
 * checked out beside this repo. When a sibling repo is absent (an isolated frontend checkout) the
 * checks that need it are skipped, never failed — so this never blocks a build that has no backend
 * to compare against.
 *
 * Usage:  pnpm docs:verify     (CI: exits 1 on any dead path, dead link, phantom or resurrected route)
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(SCRIPT_DIR, "..");
const ECOSYSTEM_ROOT = path.dirname(REPO_ROOT);
const THIS_REPO = path.basename(REPO_ROOT);

const SKIP_DIRS = new Set(["node_modules", "dist", ".next", ".git", "logs", "coverage"]);

/**
 * Docs that are not claims about today's code: `docs/archive` describes the past, `docs/plan` the
 * future — both legitimately cite paths and endpoints that do not exist right now.
 */
const EXEMPT = [path.join("docs", "archive"), path.join("docs", "plan")];

/**
 * Sibling repos in the ecosystem, resolved relative to this one. A frontend doc citing
 * `src/services/auth.service.ts` means the backend; a path is dead only if it exists in **no** repo.
 */
const SIBLING_REPOS = ["inventory-backend", "inventory-frontend", "mission-control"];
const AVAILABLE_SIBLINGS = SIBLING_REPOS.filter(
  (r) => r !== THIS_REPO && fs.existsSync(path.join(ECOSYSTEM_ROOT, r)),
);
const MISSING_SIBLINGS = SIBLING_REPOS.filter(
  (r) => r !== THIS_REPO && !fs.existsSync(path.join(ECOSYSTEM_ROOT, r)),
);

/**
 * The backend's generated flat endpoint index — the source of truth for what routes exist. The
 * frontend cannot introspect the Express router (it is another repo), but the backend emits this
 * file on every `pnpm docs:all`, so reading it is the same sibling-read pattern `verify-api-types`
 * uses for the OpenAPI spec. Absent → the phantom-route check degrades to a skip.
 */
const ENDPOINTS_FILE = path.join(
  ECOSYSTEM_ROOT,
  "inventory-backend",
  "docs",
  "reference",
  "endpoints.json",
);

/** Every root a repo-relative-ish path might legitimately be relative to, across the ecosystem. */
const PATH_ROOTS = [
  REPO_ROOT,
  ...AVAILABLE_SIBLINGS.flatMap((s) => [
    path.join(ECOSYSTEM_ROOT, s),
    path.join(ECOSYSTEM_ROOT, s, "src"),
  ]),
];

/**
 * A cited path resolves to a real file somewhere, or is dead, or cannot be judged because a sibling
 * repo isn't checked out. Reporting an unverifiable path as dead would fail CI for a reference that
 * is perfectly correct — the false alarm that gets a guard switched off.
 */
function resolveCitation(cited) {
  if (PATH_ROOTS.some((root) => fs.existsSync(path.join(root, cited)))) return "found";
  return MISSING_SIBLINGS.length ? "unverifiable" : "dead";
}

/**
 * A `src/…` reference (the backend, since the frontend has no `src/`) or a qualified sibling path
 * (`inventory-backend/docs/features/tax.md`). Both are unambiguous claims that the file exists.
 */
const SRC_PATH = /(?<![\w/.-])(src\/[A-Za-z0-9_@/.-]+\.(?:tsx|ts|js))/g;

/**
 * Bare, repo-relative-ish paths the docs use as shorthand — `utils/tax.ts`,
 * `components/sales/sell/use-sell-page.ts`, `services/api/query-keys.ts`. Union of the frontend's
 * own top-level dirs and the backend's, so a bare path from either side is recognised.
 */
const BARE_PATH =
  /(?<![\w/.-])((?:app|components|config|constants|hooks|i18n|lib|messages|public|scripts|services|types|ui|utils|tests|models|controllers|routes|validators|middleware|jobs)\/[A-Za-z0-9_@/.-]+\.(?:tsx|ts|js))/g;

const HTTP_VERB = "(?:GET|POST|PUT|PATCH|DELETE)";

/**
 * What may sit between the verb and the path. Docs write endpoints as `**GET `/api/x`**` (backtick),
 * in tables (`| GET | /api/x |`, pipe) and plainly. Letters are excluded so a table row like
 * `| POST | Creates a thing | /api/x |` does not bind the verb to that path.
 */
const VERB_PATH_GAP = "[\\s`'\"*:|—-]*";

/** A relative markdown link to another doc. Skips absolute URLs and pure in-page anchors. */
const DOC_LINK = /\[[^\]]*\]\(\s*(?!https?:|mailto:|#)([^)\s#]+\.md)(?:#[^)\s]*)?\s*\)/g;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Hidden dirs are skipped except the two that hold docs/skills.
    if (entry.name.startsWith(".") && entry.name !== ".github" && entry.name !== ".claude") continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function isExempt(relFile) {
  return EXEMPT.some((prefix) => relFile.startsWith(prefix));
}

/**
 * `/api/products/{id}`, `/api/products/:id` and `/api/storefront/<slug>` are one endpoint written
 * three ways. Collapse every path parameter to one placeholder so they compare equal.
 */
function normalizePath(p) {
  return p
    .split("?")[0]
    .replace(/\{[^}]+\}/g, ":param")
    .replace(/<[^>]+>/g, ":param")
    .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, ":param")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function routeKey(method, p) {
  return `${method.toUpperCase()} ${normalizePath(p)}`;
}

/**
 * Docs use compact shorthand that is not a claim about a single endpoint:
 *   `POST/GET /api/products/import[/template]`   — optional segment
 *   `PATCH /api/users/:id/...`                   — elided tail
 *   `GET /api/{resource}/export`                 — generic pattern across all resources
 * A placeholder in the *first* segment after `/api/` means the doc describes a shape, not an address.
 */
function isShorthand(pathText) {
  if (pathText.includes("[") || pathText.includes("...")) return true;
  const firstSegment = pathText.replace(/^\/api\//, "").split("/")[0] ?? "";
  return /^[<{:]/.test(firstSegment);
}

/** Tutorials whose endpoints are deliberately hypothetical opt out of the route check only. */
function isIllustrative(content) {
  return content.includes("<!-- docs-verify: illustrative -->");
}

/**
 * A doc can declare that certain endpoints/files deliberately do **not** exist, and the check is
 * inverted: if the thing actually exists, that is a finding (it got built; the doc is stale).
 *
 *     <!-- docs-verify: absent
 *       POST /api/auth/logout
 *       src/services/twoFactor.service.ts
 *     -->
 */
function declaredAbsent(content) {
  const routes = new Map();
  const files = new Map();
  const block = /<!--\s*docs-verify:\s*absent\s*([\s\S]*?)-->/g;

  for (const match of content.matchAll(block)) {
    const startLine = content.slice(0, match.index).split("\n").length;
    const body = match[1];

    for (const entry of body.matchAll(new RegExp(`(${HTTP_VERB})${VERB_PATH_GAP}(/api/\\S+)`, "g"))) {
      routes.set(routeKey(entry[1], entry[2]), startLine);
    }
    for (const entry of body.matchAll(/((?:src|components|utils|services|lib|hooks|app)\/[A-Za-z0-9_@/.-]+\.(?:tsx|ts|js))/g)) {
      files.set(entry[1], startLine);
    }
  }
  return { routes, files };
}

/**
 * Endpoints served by a *different* service in the ecosystem that this backend does not — declared so
 * the phantom check does not flag them.
 *
 *     <!-- docs-verify: external
 *       POST /api/mc/entitlement
 *     -->
 */
function declaredExternal(content) {
  const external = new Set();
  const block = /<!--\s*docs-verify:\s*external\s*([\s\S]*?)-->/g;
  for (const match of content.matchAll(block)) {
    for (const entry of match[1].matchAll(new RegExp(`(${HTTP_VERB})${VERB_PATH_GAP}(/\\S+)`, "g"))) {
      external.add(routeKey(entry[1], entry[2]));
    }
  }
  return external;
}

/**
 * Does a documented path satisfy a real route, allowing concrete values where the route takes a
 * parameter? `POST /api/jobs/dunning/run` is a legitimate way to document `POST /api/jobs/:name/run`.
 * A pattern match clears the phantom check but is not exact documentation of an endpoint.
 */
function matchesPattern(key, known) {
  const [method, docPath] = key.split(" ");
  const docSegments = docPath.split("/");

  for (const route of known) {
    const [routeMethod, routePath] = route.split(" ");
    if (routeMethod !== method) continue;

    const routeSegments = routePath.split("/");
    if (routeSegments.length !== docSegments.length) continue;

    const ok = routeSegments.every((seg, i) => seg === ":param" || seg === docSegments[i]);
    if (ok) return true;
  }
  return false;
}

/** Suggest the real route when a doc names one that doesn't exist. */
function suggest(phantom, known) {
  const [, phantomPath = ""] = phantom.split(" ");
  const tail = phantomPath.split("/").filter(Boolean).slice(-2).join("/");
  if (!tail) return undefined;
  for (const k of known) {
    if (k.toLowerCase().includes(tail.toLowerCase())) return k;
  }
  return undefined;
}

/** A broken doc link most often means the target MOVED — point at a same-named file so a reorg self-corrects. */
function suggestDoc(target) {
  const base = path.basename(target).toLowerCase();
  for (const file of walk(REPO_ROOT)) {
    if (path.basename(file).toLowerCase() === base) return path.relative(REPO_ROOT, file);
  }
  return undefined;
}

function loadKnownRoutes() {
  if (!fs.existsSync(ENDPOINTS_FILE)) return null;
  const parsed = JSON.parse(fs.readFileSync(ENDPOINTS_FILE, "utf8"));
  const rows = Array.isArray(parsed) ? parsed : (parsed.endpoints ?? []);
  return new Set(rows.map((r) => routeKey(r.method, r.path)));
}

function main() {
  const knownRoutes = loadKnownRoutes();
  if (!knownRoutes) {
    console.warn(
      `⚠ Backend endpoint index not found at ${path.relative(REPO_ROOT, ENDPOINTS_FILE)}.\n` +
        "  Skipping the phantom-route check (expected the inventory-backend repo beside this one,\n" +
        "  with `pnpm docs:all` having generated docs/reference/endpoints.json). Path/link checks still run.",
    );
  }

  const findings = [];
  const unverifiable = [];
  const ambiguous = [];

  for (const file of walk(REPO_ROOT)) {
    const rel = path.relative(REPO_ROOT, file);
    if (isExempt(rel)) continue;

    const content = fs.readFileSync(file, "utf8");
    const illustrative = isIllustrative(content);
    const absent = declaredAbsent(content);
    const external = declaredExternal(content);

    // Assert the negative: anything declared absent must really be absent.
    if (knownRoutes) {
      for (const [key, line] of absent.routes) {
        if (knownRoutes.has(key)) {
          findings.push({ file: rel, line, kind: "resurrected-route", detail: key });
        }
      }
    }
    for (const [cited, line] of absent.files) {
      if (resolveCitation(cited) === "found") {
        findings.push({ file: rel, line, kind: "resurrected-route", detail: cited });
      }
    }

    content.split("\n").forEach((text, i) => {
      const line = i + 1;

      // 0. Dead doc→doc links. A relative `.md` link is an unambiguous claim the target exists —
      //    this is what lets the docs be REORGANISED safely. This repo authors links two ways:
      //    file-relative (`../../docs/x.md`) and repo-root-relative (`ui/components/x-doc.md`, the
      //    convention the skills use). Both are legitimate, so a link is dead only when it resolves
      //    against NEITHER root — which still catches a genuinely deleted target.
      for (const m of text.matchAll(DOC_LINK)) {
        const target = m[1];
        const fromFile = path.resolve(path.dirname(file), target);
        const fromRoot = path.join(REPO_ROOT, target);
        if (!fs.existsSync(fromFile) && !fs.existsSync(fromRoot)) {
          findings.push({ file: rel, line, kind: "dead-link", detail: target, hint: suggestDoc(target) });
        }
      }

      // 1a. `src/…` (backend) references — an unambiguous claim about a file on disk.
      for (const m of text.matchAll(SRC_PATH)) {
        const cited = m[1];
        if (absent.files.has(cited)) continue;
        const found = resolveCitation(cited);
        if (found === "dead") findings.push({ file: rel, line, kind: "dead-path", detail: cited });
        else if (found === "unverifiable") unverifiable.push({ file: rel, line, cited });
      }

      // 1b. Bare paths (`utils/tax.ts`, `components/…`) — advisory only. The same string can mean
      //     this repo, the backend, or a tutorial placeholder, so resolve against every plausible
      //     root and only ADVISE when it resolves nowhere. Failing on these cries wolf.
      for (const m of text.matchAll(BARE_PATH)) {
        const cited = m[1];
        if (absent.files.has(cited)) continue;
        if (resolveCitation(cited) === "found") continue;
        if (MISSING_SIBLINGS.length) continue; // could live in an unseen sibling — don't guess
        ambiguous.push({ file: rel, line, cited });
      }

      // 2. Documented endpoints the backend router does not serve.
      if (illustrative || !knownRoutes) return;

      for (const m of text.matchAll(
        new RegExp(`\\b(${HTTP_VERB})${VERB_PATH_GAP}(/api/[A-Za-z0-9_:{}<>/.\\[\\]-]+)`, "g"),
      )) {
        const [, verb, pathText] = m;
        if (isShorthand(pathText)) continue;

        const key = routeKey(verb, pathText);
        if (absent.routes.has(key)) continue;
        if (external.has(key)) continue;
        if (knownRoutes.has(key)) continue;
        if (matchesPattern(key, knownRoutes)) continue;

        findings.push({
          file: rel,
          line,
          kind: "phantom-route",
          detail: `${verb} ${pathText}`,
          hint: suggest(key, knownRoutes),
        });
      }
    });
  }

  const deadPaths = findings.filter((f) => f.kind === "dead-path");
  const phantoms = findings.filter((f) => f.kind === "phantom-route");
  const resurrected = findings.filter((f) => f.kind === "resurrected-route");
  const deadLinks = findings.filter((f) => f.kind === "dead-link");

  if (deadLinks.length) {
    console.log(`\n✗ ${deadLinks.length} broken doc link(s) — the target does not exist:\n`);
    for (const f of deadLinks) {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    links to  ${f.detail}`);
      if (f.hint) console.log(`    moved to?  ${f.hint}`);
    }
  }

  if (deadPaths.length) {
    console.log(`\n✗ ${deadPaths.length} dead file reference(s) — the doc cites code that does not exist:\n`);
    for (const f of deadPaths) {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    cites  ${f.detail}`);
    }
  }

  if (phantoms.length) {
    console.log(`\n✗ ${phantoms.length} phantom endpoint(s) — the doc documents a route the backend does not serve:\n`);
    for (const f of phantoms) {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    documents  ${f.detail}`);
      if (f.hint) console.log(`    did you mean?  ${f.hint}`);
    }
  }

  if (resurrected.length) {
    console.log(`\n✗ ${resurrected.length} thing(s) documented as NOT existing, which now do:\n`);
    for (const f of resurrected) {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    listed as absent  ${f.detail}`);
      console.log(`    but it exists now — update the doc.`);
    }
  }

  if (unverifiable.length) {
    console.log(
      `\n⚠ ${unverifiable.length} reference(s) could not be verified — ` +
        `${MISSING_SIBLINGS.join(", ")} not checked out alongside this repo.`,
    );
    for (const u of unverifiable.slice(0, 5)) console.log(`  ${u.file}:${u.line}  ${u.cited}`);
    if (unverifiable.length > 5) console.log(`  … and ${unverifiable.length - 5} more`);
  }

  if (ambiguous.length) {
    console.log(`\n⚠ ${ambiguous.length} bare path(s) that resolve nowhere in the ecosystem (advisory):\n`);
    for (const a of ambiguous) console.log(`  ${a.file}:${a.line}  ${a.cited}`);
  }

  const failed =
    deadPaths.length > 0 || phantoms.length > 0 || resurrected.length > 0 || deadLinks.length > 0;

  if (failed) {
    console.log("\nDocs do not match the code.\n");
    process.exit(1);
  }

  console.log("✓ Docs match the code.\n");
}

main();
