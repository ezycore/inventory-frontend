// coding-standard: maintained
/**
 * Every feature-gated section must have a guard layout.
 *
 * `RouteAccessGuard` is generic — it reads the requirement out of
 * `constants/navItem.ts` by pathname — so gating a section is two steps: add the
 * `features` to the nav entry, and drop a `layout.tsx` into the segment. Doing
 * only the first hides the section from the sidebar and leaves the URL open,
 * which is how ten gated sections shipped with one guard between them.
 *
 * What the merchant saw was not an error. Every request under those paths 403s
 * server-side, and the screens render that as empty tables — so a shop with no
 * purchasing module opened /purchases and read "no purchase orders", which is a
 * statement about their data rather than about their plan.
 *
 * This is presentation only. `requireFeature` and `requireFeatureForWrites` are
 * what protect the data, and they were never bypassed.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { navItems } from "@/constants/navItem";

const APP_DIR = join(__dirname, "../../app/(protected)");

/** Top-level segments carrying a feature gate anywhere beneath them. */
function gatedSegments(): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();

  const walk = (items: readonly any[]) => {
    for (const item of items ?? []) {
      const features: string[] = [
        ...(item.features ?? []),
        ...(item.anyFeatures ?? []),
      ];
      const url: string | undefined = item.url;
      if (features.length > 0 && url?.startsWith("/")) {
        const segment = url.split("/").filter(Boolean)[0];
        if (segment) {
          if (!found.has(segment)) found.set(segment, new Set());
          features.forEach((f) => found.get(segment)!.add(f));
        }
      }
      if (item.items) walk(item.items);
      if (item.children) walk(item.children);
    }
  };

  walk(navItems as unknown as readonly any[]);
  return found;
}

describe("route guard coverage", () => {
  const segments = gatedSegments();

  it("finds the gated sections at all", () => {
    // Guards the walker: a nav shape change that stops it descending would make
    // every assertion below pass on an empty set.
    expect(segments.size).toBeGreaterThanOrEqual(8);
    expect([...segments.keys()]).toContain("purchases");
  });

  it("gives every gated section a layout", () => {
    const unguarded = [...segments.keys()].filter(
      (segment) => !existsSync(join(APP_DIR, segment, "layout.tsx")),
    );
    expect(unguarded, "gated in nav, reachable by URL").toEqual([]);
  });

  it("wires each layout to the guard rather than merely existing", () => {
    // A layout that renders `{children}` bare satisfies the check above and
    // gates nothing — the same silent gap in a different shape.
    const notWired = [...segments.keys()].filter((segment) => {
      const path = join(APP_DIR, segment, "layout.tsx");
      if (!existsSync(path)) return false;
      return !readFileSync(path, "utf-8").includes("RouteAccessGuard");
    });
    expect(notWired, "layout exists but does not guard").toEqual([]);
  });
});
