// coding-standard: maintained
/**
 * Every `tr()` key in the product form must exist in both locales.
 *
 * `tr(key, fallback)` is `t ? t(key) : fallback` — the fallback covers only the
 * one caller that has no translator (the field-settings tool). In the app `t`
 * always exists, so a key that is missing or filed under the wrong parent does
 * not fall back to English: next-intl renders the key path. The merchant sees
 * `form.sections.publishTitle` as a section heading.
 *
 * That is exactly what shipped. The "Publish to store" strings were added at
 * the TOP LEVEL of products.json — reachable as `products.form.*` — while the
 * form's translator is `useTranslations('products.products')` and needs
 * `products.products.form.*`. Seven labels per locale rendered as raw keys, and
 * nothing failed: not the type-check, not the tests, not a lint rule.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getProductFormConfig } from "../form-config";

/**
 * The path INSIDE products.json that the form's translator resolves against.
 *
 * The page binds `useTranslations('products.products')`, but only the second
 * segment is a key in this file: `i18n/request.ts` loads each file under its own
 * filename, so the first `products` is the namespace and the second is the
 * file's own top-level `products` block.
 */
const NAMESPACE = ["products"];

const messages = (locale: string) =>
  JSON.parse(
    readFileSync(
      join(__dirname, `../../../messages/${locale}/products.json`),
      "utf-8",
    ),
  );

const resolve = (root: unknown, path: string[]): unknown =>
  path.reduce<unknown>(
    (node, part) =>
      node && typeof node === "object"
        ? (node as Record<string, unknown>)[part]
        : undefined,
    root,
  );

/**
 * Collect the keys by running the real config with a translator that records
 * what it is asked for. Reading the source with a regex would miss any key
 * built at runtime and would drift the moment the file is reformatted.
 */
const requestedKeys = (): string[] => {
  const seen = new Set<string>();
  const spy = ((key: string) => {
    seen.add(key);
    return key;
  }) as never;
  getProductFormConfig(spy);
  return [...seen];
};

describe("product form translations", () => {
  const keys = requestedKeys();

  it("asks for a non-trivial number of keys", () => {
    // Guards the collector itself: if `getProductFormConfig` stops calling the
    // translator, every assertion below passes vacuously.
    expect(keys.length).toBeGreaterThan(50);
  });

  for (const locale of ["en", "bn"]) {
    it(`resolves every key under products.products in ${locale}`, () => {
      const root = messages(locale);
      const missing = keys.filter(
        (key) =>
          typeof resolve(root, [...NAMESPACE, ...key.split(".")]) !== "string",
      );
      expect(missing, `unresolvable in ${locale}`).toEqual([]);
    });
  }

  it("leaves no strings stranded outside the namespace", () => {
    // The failure mode was additive: the keys existed, just one level up. A
    // `form` block at the top of products.json is unreachable from every
    // translator in the module and can only be a misfiled addition.
    for (const locale of ["en", "bn"]) {
      expect(Object.keys(messages(locale)), locale).not.toContain("form");
    }
  });
});
