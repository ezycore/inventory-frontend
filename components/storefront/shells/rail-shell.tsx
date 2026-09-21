"use client";
// coding-standard: maintained

import Link from "next/link";
import type { CatalogCategory } from "@/lib/storefront-client";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
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
        <CategoryRail base={base} categories={categories} t={t} />
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
 * Children are shown only under the OPEN parent. Listing every child of every
 * department turns a wayfinding column into a wall of forty links, which is the
 * failure mode this shape is supposed to prevent.
 */
function CategoryRail({
  base,
  categories,
  t,
}: {
  base: string;
  categories: CatalogCategory[];
  t: ShellProps["t"];
}) {
  const pathname = useStorePathname();
  if (!categories.length) return null;

  const isActive = (c: CatalogCategory) =>
    !!c.slugPath && pathname.includes(`/${c.slugPath}`);

  return (
    <aside className="sf-rail sf-desktop-only" aria-label={t.browseCats}>
      <div className="sf-rail-inner">
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
          {categories.map((c) => {
            const on = isActive(c);
            const kids = c.children ?? [];
            return (
              <div key={c._id}>
                <Link
                  href={collectionHref(base, c)}
                  aria-current={on ? "page" : undefined}
                  className={`sf-rail-link${on ? " is-on" : ""}`}
                >
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.name}
                  </span>
                  {kids.length ? (
                    <span style={{ display: "flex", flex: "none", color: "var(--faint)" }}>
                      <Icon name="chevR" size={14} />
                    </span>
                  ) : null}
                </Link>

                {/* Only the open department expands — see the note above. */}
                {on && kids.length ? (
                  <div style={{ display: "flex", flexDirection: "column", paddingBottom: 4 }}>
                    {kids.map((k) => (
                      <Link
                        key={k._id}
                        href={collectionHref(base, k)}
                        className={`sf-rail-link sf-rail-link--child${
                          isActive(k) ? " is-on" : ""
                        }`}
                      >
                        {k.name}
                      </Link>
                    ))}
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
