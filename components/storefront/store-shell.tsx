"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type {
  CatalogCategory,
  ContentPageLink,
  StoreCampaign,
  StoreTemplates,
  StorefrontStore,
} from "@/lib/storefront-client";
import { useStore, useStoreCategories } from "@/services/storefront/hooks";
import { useFaviconOverride } from "@/hooks/use-favicon-override";
import {
  useSfPreview,
  useSfPreviewImage,
} from "@/services/stores/use-sf-preview-store";
import { StoreContextProvider } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import type { Dict } from "@/lib/storefront-i18n";
import { resolveTemplates } from "@/lib/storefront-templates";
import { designAttrs, resolveDesign } from "@/lib/storefront-theme";
import { padCategoriesForPreview } from "@/lib/storefront-preview-samples";
import { brightenForDark, readableTextOn } from "@/lib/color-contrast";
import { ShellBottomNav } from "@/components/storefront/shells/shell-parts";
import { StackedShell } from "@/components/storefront/shells/stacked-shell";
import { RailShell } from "@/components/storefront/shells/rail-shell";
import { OwnerAdminBar } from "@/components/storefront/owner-admin-bar";
import { ContactLauncher } from "@/components/storefront/contact-launcher";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { CartSync } from "@/components/storefront/cart-sync";
import { StorePreviewBridge } from "@/components/storefront/preview-bridge";

/**
 * Storefront chrome — header (admin-selectable variant) + breadcrumb + footer
 * (admin-selectable variant), the cart slide-over and the owner admin bar.
 * Rendered by the server `shop/layout.tsx`, which passes `slug`/`base`;
 * everything reads them via context.
 */
export function StoreShell({
  slug,
  base,
  initialStore,
  initialPages,
  initialCampaigns,
  initialCategories,
  children,
}: {
  slug: string;
  base: string;
  initialStore?: StorefrontStore;
  initialPages?: ContentPageLink[];
  initialCampaigns?: StoreCampaign[];
  /** Seeded HERE and nowhere else — see the note on `useStoreCategories`. */
  initialCategories?: CatalogCategory[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useStorefrontUI();

  const { data: store, isError } = useStore(slug, initialStore);
  const { data: fetchedCategories } = useStoreCategories(slug, initialCategories);
  const previewActive = useSfPreview((s) => s.active);
  const previewBrand = useSfPreview((s) => s.brand);
  const previewAccent = useSfPreview((s) => s.accent);
  const previewDesign = useSfPreview((s) => s.design);
  const previewCollections = useSfPreview((s) => s.collections);
  const previewSamples = useSfPreview((s) => s.samples);
  const previewAnnouncement = useSfPreview((s) => s.announcement);
  // Which SKELETON. Draft first, like every other look value, so switching it in
  // Customize repaints without a save. Declared with the other preview hooks
  // because the `isError` early return below is a conditional — a hook after it
  // would not run on every render.
  const previewShell = useSfPreview((s) => s.shell);
  const logo = useSfPreviewImage("logo", store?.logo);

  /* The admin's Collections panel streams its unsaved draft; prefer it so
     reordering/hiding previews live instead of waiting on a save + refetch.

     In the theme preview, a store with NO categories falls back to samples.
     This is the single most load-bearing fallback of the set: the `rail` shell
     returns null without categories, so a merchant who has not built their
     taxonomy yet — i.e. every merchant choosing their first theme — compared
     four themes with the department rail invisible, which is the whole reason
     to pick that one. */
  const resolvedCategories = previewCollections ?? fetchedCategories;
  const categories = previewActive
    ? padCategoriesForPreview(resolvedCategories, previewSamples)
    : resolvedCategories;

  // Tab icon = the store's favicon, swapped in place so router-integrated
  // navigations (page changes AND the account tab switch's replaceState) don't
  // flash the platform default — that's why it's a client hook, not layout
  // metadata (see use-favicon-override).
  //
  // Reads the saved `store.favicon`, NOT the `logo` above: the logo is never a
  // fallback for the tab icon, and the preview-store override that feeds `logo`
  // is for the Customize editor's live brand preview, which has no business
  // repainting the tab icon while someone drags a logo around.
  useFaviconOverride(store?.favicon?.thumbnailUrl || store?.favicon?.url);

  if (isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-xl font-semibold">Store unavailable</h1>
        <p className="text-sm text-[var(--muted)]">
          This store doesn&apos;t exist or isn&apos;t published yet.
        </p>
      </div>
    );
  }

  // Live preview brand (admin Customize editor) wins so the whole page repaints
  // instantly; otherwise the merchant's saved brand colour overrides --primary.
  // Both theme variants ship as vars — storefront.css picks per data-theme, so
  // a dark brand is auto-lifted on the dark theme and stays readable.
  const brandColor = previewBrand ?? store?.theme?.brandColor;
  const darkBrand = brandColor ? brightenForDark(brandColor) : undefined;

  /* The merchant's SECOND colour, published the same way and for the same
     reason. Only when it actually differs from the brand: an accent equal to
     the brand is not a second colour, and `--accent*` already falls back to the
     primary pair in storefront.css, so stamping it would be a no-op that costs
     two attributes and a stack of vars.
     Draft first, exactly like `brandColor` above. The payload has always carried
     `accentColor` and the preview store has always kept it, but nothing read it
     — so the Customize editor's accent field repainted nothing until a save and
     a reload, while the brand control directly above it updated live. */
  const accentColor = previewAccent ?? store?.theme?.accentColor;
  const accent =
    accentColor && accentColor.toLowerCase() !== brandColor?.toLowerCase()
      ? accentColor
      : undefined;
  const darkAccent = accent ? brightenForDark(accent) : undefined;

  const shellVars = {
    ...(brandColor
      ? {
          "--sf-brand-light": brandColor,
          "--sf-brand-dark": darkBrand,
          "--sf-brand-on-light": readableTextOn(brandColor),
          "--sf-brand-on-dark": readableTextOn(darkBrand ?? brandColor),
        }
      : {}),
    ...(accent
      ? {
          "--sf-accent-light": accent,
          "--sf-accent-dark": darkAccent,
          "--sf-accent-on-light": readableTextOn(accent),
          "--sf-accent-on-dark": readableTextOn(darkAccent ?? accent),
        }
      : {}),
  } as CSSProperties;

  // Type family + spatial rhythm. Stamped as data attributes rather than inline
  // style vars ON PURPOSE: --pad/--gap/--cols/--h1/--h2 are redefined at two
  // breakpoints in storefront.css, and an inline var would outrank every media
  // query and freeze a themed store at its phone spacing. Same live-preview-wins
  // rule as the brand colour above; `designAttrs` omits an axis left at default.
  const designAttributes = designAttrs(
    resolveDesign(previewDesign ?? store?.theme?.design),
  );

  // Live preview override (admin Navigation editor) wins so the bar repaints as
  // it's edited; otherwise the merchant's saved announcement.
  const announcement = previewAnnouncement ?? store?.nav?.announcement;

  const shell = isShell(previewShell)
    ? previewShell
    : resolveTemplates(store).shell;

  const onHome = pathname === base || pathname === `${base}/` || pathname === "/";
  const crumb = !onHome ? crumbLabel(pathname, t) : "";

  const Shell = SHELLS[shell] ?? StackedShell;

  return (
    <StoreContextProvider slug={slug} base={base}>
      <div
        className="sf-shell"
        data-brand={brandColor ? "" : undefined}
        data-accent={accent ? "" : undefined}
        {...designAttributes}
        style={{
          ...shellVars,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--page)",
          color: "var(--text)",
        }}
      >
        <Shell
          slug={slug}
          base={base}
          store={store}
          categories={categories ?? []}
          initialPages={initialPages}
          initialCampaigns={initialCampaigns}
          crumb={crumb}
          announcement={announcement}
          t={t}
        >
          {children}
        </Shell>

        {/* Mobile bottom tab bar (hidden ≥680px). Outside the shell because
            every skeleton wants it in the same place — pinned to the viewport,
            not to a layout. */}
        <ShellBottomNav
          slug={slug}
          base={base}
          store={store}
          categories={categories ?? []}
        />

        {/* Floating chat launcher — renders nothing unless the merchant has it
            on (Customize → WhatsApp button). Mounted AFTER the  early
            return above, so an unpublished store never exposes its owner's
            phone number. */}
        <ContactLauncher base={base} store={store} />
        <CartDrawer />
        <OwnerAdminBar />
        <StorePreviewBridge />
        {/* Renders nothing — mirrors the cart to the server so the merchant can
            see abandoned carts. Mounted here because it must be alive on every
            shop route, and it deliberately holds no reactive cart subscription
            (see cart-sync.tsx) so it cannot re-render this shell. */}
        <CartSync slug={slug} />
      </div>
    </StoreContextProvider>
  );
}

/**
 * The page SKELETONS. One entry per `templates.shell`.
 *
 * A shell owns where the announcement, header, rail, content and footer sit
 * relative to one another — and nothing else. Everything they arrange comes from
 * `shell-parts.tsx`, so a fix to the footer is not a fix to be repeated in
 * every skeleton that places it differently.
 *
 * **This is the axis that makes two shops different KINDS of site.** Headers,
 * sections and page layouts all vary what sits inside `<main>`; only a shell
 * changes the building around it, on every page at once.
 */
const SHELLS: Record<StoreTemplates["shell"], typeof StackedShell> = {
  stacked: StackedShell,
  rail: RailShell,
};

function isShell(v: unknown): v is StoreTemplates["shell"] {
  return v === "stacked" || v === "rail";
}

function crumbLabel(pathname: string, t: Dict): string {
  if (/\/products\/[^/]+$/.test(pathname)) return t.navProduct;
  if (/\/products(\?|$)/.test(pathname) || /\/products$/.test(pathname)) return t.navShop;
  if (pathname.includes("/search")) return t.navSearch;
  if (pathname.includes("/cart")) return t.navCart;
  if (pathname.includes("/checkout")) return t.navCheckout;
  if (pathname.includes("/account")) return t.navAccount;
  return "";
}
