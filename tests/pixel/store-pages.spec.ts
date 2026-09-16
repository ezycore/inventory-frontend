// coding-standard: maintained
import { expect, test, type Page } from "@playwright/test";

/**
 * One store's pages, screenshotted for `pixel:capture` / `pixel:compare`
 * (`pixel.config.ts`). The pages are the ones plan §12 names: home, a collection,
 * a product, cart, checkout and every published content page — resolved from the
 * store's own public catalogue, so every store is compared at real addresses.
 *
 *   PIXEL_STORE=rafi5 pnpm pixel:capture     # before the change
 *   PIXEL_STORE=rafi5 pnpm pixel:compare     # after it — fails on a page that moved
 *
 * `PIXEL_BASE` (default `http://<store>.localhost:3000/shop`) and `PIXEL_API`
 * (default `http://localhost:5800/api`) point it elsewhere. An address that is not
 * on localhost is refused unless `PIXEL_ALLOW_LIVE=1`: a real browser runs the
 * shop's own scripts, and a live merchant's ad pixel must not count our visits.
 * Tracker requests are blocked either way.
 */
const store = process.env.PIXEL_STORE;
if (!store) throw new Error("Set PIXEL_STORE to the store's slug, e.g. PIXEL_STORE=rafi5");

const base = (process.env.PIXEL_BASE ?? `http://${store}.localhost:3000/shop`).replace(/\/$/, "");
const api = (process.env.PIXEL_API ?? "http://localhost:5800/api").replace(/\/$/, "");
const isLocal = /^https?:\/\/([a-z0-9-]+\.)*localhost(:\d+)?$/.test(new URL(base).origin);
if (!isLocal && process.env.PIXEL_ALLOW_LIVE !== "1") {
  throw new Error(
    `${base} is not a local store. Its analytics would record these visits; set PIXEL_ALLOW_LIVE=1 only with the merchant's agreement.`,
  );
}

const TRACKERS = /connect\.facebook\.net|facebook\.com\/tr|googletagmanager\.com|google-analytics\.com/;

async function storeData<T>(path: string): Promise<T> {
  const res = await fetch(`${api}/storefront/${store}/${path}`);
  if (!res.ok) throw new Error(`GET /storefront/${store}/${path} answered ${res.status}`);
  return ((await res.json()) as { data: T }).data;
}

/** `PIXEL_PAGES=home,cart` compares only those pages — one page after a change to one page. */
const only = (process.env.PIXEL_PAGES ?? "")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

async function storePages(): Promise<{ name: string; path: string }[]> {
  const [categories, products, pages] = await Promise.all([
    storeData<{ slugPath: string }[]>("categories"),
    storeData<{ items: { slug: string }[] }>("products?limit=1"),
    storeData<{ slug: string }[]>("pages"),
  ]);
  const all = [
    { name: "home", path: "" },
    ...(categories[0] ? [{ name: "collection", path: `/${categories[0].slugPath}` }] : []),
    ...(products.items[0] ? [{ name: "product", path: `/products/${products.items[0].slug}` }] : []),
    { name: "cart", path: "/cart" },
    { name: "checkout", path: "/checkout" },
    ...pages.map((page) => ({ name: `page-${page.slug}`, path: `/pages/${page.slug}` })),
  ];
  return only.length ? all.filter((page) => only.includes(page.name)) : all;
}

/**
 * Wait until the page stops changing: network quiet, lazy images scrolled into view,
 * fonts loaded. Next's dev-build indicator ("Compiling…", bottom left) is hidden: it
 * comes and goes with the dev server's own work and was the only difference between
 * two runs of an unchanged store. Production builds do not draw it.
 */
async function settle(page: Page) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    window.scrollTo(0, 0);
    await document.fonts.ready;
  });
  await page.waitForLoadState("networkidle");
}

test("store pages match", async ({ page }) => {
  await page.route(TRACKERS, (route) => route.abort());

  for (const target of await storePages()) {
    await test.step(target.name, async () => {
      const response = await page.goto(`${base}${target.path}`, { waitUntil: "domcontentloaded" });
      expect.soft(response?.status() ?? 0, `${target.name} answered`).toBeLessThan(400);
      await settle(page);
      // Soft, so one moved page does not hide the rest of the store's report.
      await expect.soft(page).toHaveScreenshot(`${store}/${target.name}.png`, { fullPage: true });
    });
  }
});
