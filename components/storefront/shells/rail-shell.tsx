"use client";
// coding-standard: maintained

import Link from "next/link";
import type { CatalogCategory, StorefrontStore } from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";
import {
  RAIL_OPEN_RULE,
  initialOpenKeys,
  isNodeActive,
} from "@/lib/storefront-menu";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { useStoreMenu } from "@/components/storefront/use-store-menu";
import { Icon } from "@/components/storefront/sf-icons";
import {
  ShellAnnouncement,
  ShellBreadcrumb,
  ShellCampaignStrip,
  ShellFooter,
  ShellHeader,
  type ShellProps,
} from "@/components/storefront/shells/shell-parts";

/**
 * Rail — a persistent department sidebar down the left of **every page**, with
 * the content beside it.
 *
 * This is the storefront's first alternative SKELETON, and it exists because
 * varying what goes inside `<main>` had run out of road: six header anatomies,
 * eighteen home sections and four layouts each for cart/checkout/account still
 * produced four shops that were recognisably the same *kind* of site, because
 * every one of them was a full-width bar over a vertical stack of full-width
 * blocks. A marketplace is not that shape. Chaldal, Daraz and every superstore
 * that sells a thousand SKUs put the departments on screen permanently, because
 * a shopper's next move is nearly always "somewhere else in the catalogue".
 *
 * What makes it a shell rather than a section:
 * - The rail is on the **collection page, the product page, the cart and the
 *   account area**, not just the home page. No section can do that.
 * - It changes the content's measure everywhere, so the product grid, the
 *   filters and the checkout all lay out differently without knowing why.
 *
 * **Below 680px the rail is gone entirely** — a 220px column on a 390px screen
 * is not a navigation aid, and the mobile bottom nav plus the header's search
 * already cover the same job. That is also why the rail is `sf-desktop-only`
 * rather than a collapsible drawer: a second mobile nav competing with the
 * bottom bar is how a shopper ends up with two half-answers.
 */
export function RailShell(props: ShellProps) {
  const { slug, base, store, categories, initialPages, initialCampaigns, crumb, announcement, t, children } = props;
  return (
    <>
      <ShellAnnouncement announcement={announcement} base={base} slug={slug} />
      {/* `hideCategoryRow`: the rail below already lists every department, and a
          header carrying its own row would print the same list twice on one
          screen. The shell knows there is a rail; the header does not. */}
      <ShellHeader
        slug={slug}
        base={base}
        store={store}
        categories={categories}
        hideCategoryRow
      />
      <ShellCampaignStrip
        slug={slug}
        base={base}
        store={store}
        initialCampaigns={initialCampaigns}
      />

      <div
        className="sf-rail-grid"
        style={{ flex: 1, maxWidth: "var(--maxw)", margin: "0 auto", width: "100%" }}
      >
        <CategoryRail base={base} store={store} categories={categories} t={t} />
        <div style={{ minWidth: 0 }}>
          <ShellBreadcrumb crumb={crumb} base={base} t={t} />
          <main>{children}</main>
        </div>
      </div>

      <ShellFooter slug={slug} base={base} store={store} initialPages={initialPages} />
    </>
  );
}

/**
 * The departments, always on screen.
 *
 * Sticky with its own scroll, so a shop with forty categories does not stretch
 * the page: the rail scrolls internally and the content scrolls normally. The
 * active department is derived from the URL rather than passed down, because
 * every page under the shell needs it and threading it would mean touching all
 * of them.
 *
 * Always the CATEGORY tree, whatever the header menu's source (owner decision C,
 * 2026-09-24) — it is literally the category sidebar.
 *
 * Which departments show their children is the merchant's `railOpen`. The
 * default is still "only the one being browsed": listing every child of every
 * department turns a wayfinding column into a wall of forty links. `first` and
 * `all` exist for the shop with two departments, where the home page otherwise
 * showed a rail of two bare names; `flyout` keeps the column one line per
 * department and pops the children out beside it.
 *
 * ⚠ `flyout` lifts the rail's internal scroll (`data-flyout`): a scroll
 * container clips on both axes, so the pop-out would be cut off at the rail's
 * right edge. It suits the few-departments shop it is for; a long rail should
 * stay on an in-place mode.
 */
function CategoryRail({
  base,
  store,
  categories,
  t,
}: {
  base: string;
  store?: StorefrontStore;
  categories: CatalogCategory[];
  t: ShellProps["t"];
}) {
  const pathname = useStorePathname();
  const menu = useStoreMenu(store, categories, base);
  const nodes = menu.categories;
  const mode = menu.settings.desktop.railOpen;
  if (!nodes.length) return null;
  const openKeys = initialOpenKeys(nodes, RAIL_OPEN_RULE[mode], pathname);
  const flyout = mode === "flyout";

  return (
    <aside className="sf-rail sf-desktop-only" aria-label={t.browseCats}>
      <div className="sf-rail-inner" data-flyout={flyout ? "" : undefined}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px 10px",
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          <Icon name="list" size={15} />
          {t.browseCats}
        </div>

        <nav style={{ display: "flex", flexDirection: "column" }}>
          {nodes.map((node) => {
            const on = isNodeActive(node, pathname);
            const kids = node.children;
            const kidLinks = kids.map((k) => (
              <Link
                key={k.key}
                href={k.href}
                className={`sf-rail-link sf-rail-link--child${
                  isNodeActive(k, pathname) ? " is-on" : ""
                }`}
              >
                {k.label}
              </Link>
            ));
            return (
              <div key={node.key} className={flyout && kids.length ? "sf-rail-fly" : undefined}>
                <Link
                  href={node.href}
                  aria-current={on ? "page" : undefined}
                  className={`sf-rail-link${on ? " is-on" : ""}`}
                >
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {node.label}
                  </span>
                  {kids.length ? (
                    <span style={{ display: "flex", flex: "none", color: "var(--faint)" }}>
                      <Icon name="chevR" size={14} />
                    </span>
                  ) : null}
                </Link>

                {flyout && kids.length ? (
                  <div className="sf-rail-flyout">{kidLinks}</div>
                ) : openKeys.has(node.key) && kids.length ? (
                  <div style={{ display: "flex", flexDirection: "column", paddingBottom: 4 }}>
                    {kidLinks}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <Link href={storeHref(base, "/products")} className="sf-rail-all">
          {t.viewAllProducts} →
        </Link>
      </div>
    </aside>
  );
}
