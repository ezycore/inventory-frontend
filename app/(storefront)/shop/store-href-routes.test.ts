// coding-standard: maintained
/**
 * **Every hardcoded storefront link must land on a route that exists.**
 *
 * The mobile bottom bar's "Track order" button pointed at `/t` for as long as it
 * had existed. `/t` is the parent segment of `shop/t/[token]`, and a segment
 * whose only child is dynamic has no page of its own — so the button 404'd on
 * every store that switched it on, live, on a real shop. Nothing caught it:
 * `storeHref` takes a string, `<Link>` takes a string, and a path that resolves
 * to no page is a perfectly well-typed string.
 *
 * So the link literals are read out of the source and resolved against the route
 * tree the way the router resolves them, dynamic segments included. This is a
 * whole class of bug rather than one link: the storefront serves from two bases
 * (`/shop` on a tenant subdomain, the root on a custom domain), which is exactly
 * the kind of indirection that makes a dead path look plausible in review.
 *
 * Only DOUBLE-QUOTED literals are checked. A template literal is a path built at
 * runtime (`/products/${slug}`), whose existence is the dynamic segment's job.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SHOP = join(ROOT, "app/(storefront)/shop");

/** Where a storefront link can be written. */
const SOURCE_DIRS = [
  "components/storefront",
  "components/storefront-builder",
  "app/(storefront)",
];

function filesUnder(dir: string): string[] {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d)) {
      const p = join(d, entry);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(p);
    }
  };
  walk(abs);
  return out;
}

/** `storeHref(base, "/cart")` → `/cart`. The base argument is whatever the call
 *  site named it, so it is matched loosely and ignored. */
const HREF = /storeHref\([^,)]+,\s*"(\/[^"]*)"/g;

const links = new Set<string>();
for (const file of SOURCE_DIRS.flatMap(filesUnder)) {
  for (const m of readFileSync(file, "utf8").matchAll(HREF)) links.add(m[1]);
}

/**
 * Resolve a public path against the route tree, preferring a literal segment and
 * falling back to a dynamic one — `[slug]`, `[...rest]`, `[[...rest]]` — which is
 * what the App Router does.
 */
function routeExists(path: string): boolean {
  const clean = path.split(/[?#]/)[0];
  const segments = clean.split("/").filter(Boolean);
  let dir = SHOP;
  for (const segment of segments) {
    const literal = join(dir, segment);
    if (existsSync(literal) && statSync(literal).isDirectory()) {
      dir = literal;
      continue;
    }
    const dynamic = readdirSync(dir).find(
      (e) => e.startsWith("[") && statSync(join(dir, e)).isDirectory(),
    );
    if (!dynamic) return false;
    dir = join(dir, dynamic);
  }
  // A directory is not a page. `/t` has `[token]` beneath it and nothing of its
  // own, which is the whole reason this file exists.
  return existsSync(join(dir, "page.tsx"));
}

describe("storefront link literals", () => {
  it("finds the links to check", () => {
    // A refactor that renames `storeHref` or switches these to template
    // literals would otherwise leave this file passing over an empty set.
    expect(links.size).toBeGreaterThanOrEqual(6);
    expect(links).toContain("/orders/track");
  });

  it.each([...links].sort())("%s is a real route", (path) => {
    expect(routeExists(path), `${path} resolves to no page under app/(storefront)/shop`).toBe(true);
  });

  it("rejects a segment that only has a dynamic child", () => {
    // The original bug, pinned directly: `/t/<token>` is a page and `/t` is not.
    expect(routeExists("/t/abc123")).toBe(true);
    expect(routeExists("/t")).toBe(false);
  });
});
