// coding-standard: maintained
import { defineConfig, devices } from "@playwright/test";

/**
 * Pixel diff for moving a store onto the Storefront Builder (backend plan
 * storefront-builder.md §12, §17 Phase 5). Not a test suite: `pnpm pixel:capture`
 * records one store's pages before a change, `pnpm pixel:compare` fails on any page
 * that no longer matches. See `store-pages.spec.ts` for the pages and the variables.
 *
 * Everything it writes goes to `.pixel/` (git-ignored): baselines are per-store
 * screenshots, and the HTML report shows each difference side by side.
 */
export default defineConfig({
  testDir: ".",
  testMatch: "store-pages.spec.ts",
  outputDir: "../../.pixel/results",
  snapshotPathTemplate: "{testDir}/../../.pixel/baseline/{projectName}/{arg}{ext}",
  workers: 1,
  retries: 0,
  // One test walks every page of the store, on each device.
  timeout: 5 * 60_000,
  reporter: [["list"], ["html", { outputFolder: "../../.pixel/report", open: "never" }]],
  expect: {
    toHaveScreenshot: {
      // An absolute count, not a ratio: a ratio is of the whole full-page image, and
      // a changed line of footer text (~1,400 px) stayed under 0.1% of a tall home
      // page and passed. Two runs of an unchanged store differ by none.
      maxDiffPixels: 50,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  projects: [
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1280, height: 900 } } },
    // A Chromium phone, so both projects use the Chromium build already installed.
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
