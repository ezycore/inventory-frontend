"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import Link from "next/link";
import type {
  CatalogCategory,
  ContentPageLink,
  StoreCampaign,
  StoreTemplates,
  StorefrontStore,
} from "@/lib/storefront-client";
import { faviconHref } from "@/lib/storefront-client";
import { useStore, useStoreCategories } from "@/services/storefront/hooks";
import { useFaviconOverride } from "@/hooks/use-favicon-override";
import {
  useSfPreview,
  useSfPreviewImage,
} from "@/services/stores/use-sf-preview-store";
import { StoreContextProvider } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { resolveTemplates } from "@/lib/storefront-templates";
import { designAttrs, resolveDesign } from "@/lib/storefront-theme";
import { shellTheme } from "@/lib/storefront-shell-theme";
import { padCategoriesForPreview } from "@/lib/storefront-preview-samples";
import { shellCrumbLabel } from "@/lib/storefront-shell-breadcrumb";
import {
  ShellBottomNav,
  ShellMobileOverlays,
} from "@/components/storefront/shells/shell-parts";
import { StackedShell } from "@/components/storefront/shells/stacked-shell";
import { RailShell } from "@/components/storefront/shells/rail-shell";
import { useHasMobileTabs } from "@/components/storefront/mobile/mobile-chrome";
import { OwnerAdminBar } from "@/components/storefront/owner-admin-bar";
import { ContactLauncher } from "@/components/storefront/contact-launcher";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { CartSync } from "@/components/storefront/cart-sync";
import { StorePreviewBridge } from "@/components/storefront/preview-bridge";
import { money } from "@/components/storefront/format";
import { effectiveFreeShippingThreshold } from "@/lib/storefront-delivery";

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
  const pathname = useStorePathname();
  const { t } = useStorefrontUI();

  const { data: store, isError } = useStore(slug, initialStore);
  const { data: fetchedCategories } = useStoreCategories(slug, initialCategories);
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
  /* Whether this shop's mobile template ends in a bottom tab bar. Declared up
     here with the other hooks for the same reason `previewShell` is — the
     `isError` early return below is a conditional, and a hook after it would not
     run on every render. */
  const hasMobileTabs = useHasMobileTabs(store);

  /* The admin's Collections panel streams its unsaved draft; prefer it so
     reordering/hiding previews live instead of waiting on a save + refetch.

     On the THEME PICKER, a store with NO categories falls back to samples.
     This is the single most load-bearing fallback of the set: the `rail` shell
     returns null without categories, so a merchant who has not built their
     taxonomy yet — i.e. every merchant choosing their first theme — compared
     four themes with the department rail invisible, which is the whole reason
     to pick that one.

     ⚠ Gated on `previewSamples`, not on the preview store's `active` flag —
     `active` also covers the Customize editor and a bare `?preview=1` on a live
     shop, and inventing six departments a merchant does not have is a claim
     about their shop rather than a placeholder. Null samples make the call a
     no-op. */
  const resolvedCategories = previewCollections ?? fetchedCategories;
  const categories = padCategoriesForPreview(resolvedCategories, previewSamples);

  // Tab icon = the store's favicon, swapped in place so router-integrated
  // navigations (page changes AND the account tab switch's replaceState) don't
  // flash the platform default — that's why it's a client hook, not layout
  // metadata (see use-favicon-override).
  //
  // Reads the saved `store.favicon`, NOT the `logo` above: the logo is never a
  // fallback for the tab icon, and the preview-store override that feeds `logo`
  // is for the Customize editor's live brand preview, which has no business
  // repainting the tab icon while someone drags a logo around.
  useFaviconOverride(faviconHref(store?.favicon));

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

  // Live preview colours (admin Customize editor) win so the whole page repaints
  // instantly; otherwise the merchant's saved ones override --primary/--accent.
  // Draft first for the accent too: the payload always carried `accentColor`,
  // but until it was read here the Customize accent field repainted nothing
  // until a save and a reload, while the brand control above it updated live.
  const theme = shellTheme(
    previewBrand ?? store?.theme?.brandColor,
    previewAccent ?? store?.theme?.accentColor,
  );

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
  const rawAnnouncement = previewAnnouncement ?? store?.nav?.announcement;
  const threshold = effectiveFreeShippingThreshold(store);
  const announcement = rawAnnouncement?.useShippingRule
    ? threshold == null
      ? undefined
      : {
          ...rawAnnouncement,
          text: t.freeShippingOver.replace(
            "{amount}",
            money(threshold, store?.currency),
          ),
        }
    : rawAnnouncement;

  const shell = isShell(previewShell)
    ? previewShell
    : resolveTemplates(store).shell;

  const onHome = pathname === base || pathname === `${base}/` || pathname === "/";
  const crumb = !onHome ? shellCrumbLabel(pathname, t) : "";

  const Shell = SHELLS[shell] ?? StackedShell;

  return (
    <StoreContextProvider slug={slug} base={base}>
      <div
        className="sf-shell"
        data-brand={theme.brand ? "" : undefined}
        data-accent={theme.accent ? "" : undefined}
        /* Reserves — or releases — the 56px the fixed tab bar stands in.
           `--sf-bottom-nav-h` is not decoration: the sticky buy bar, the contact
           launcher and the page's own bottom padding all stack on it
           (storefront.css), so a template with no tab bar has to zero it in ONE
           place or every one of those floats 56px above nothing. An attribute
           rather than an inline var deliberately — the var is redefined inside a
           media query, and an inline style would outrank it and freeze the
           reservation on at desktop widths too. */
        data-sf-tabs={hasMobileTabs ? "1" : "0"}
        {...designAttributes}
        style={{
          ...theme.style,
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
        <ShellBottomNav slug={slug} base={base} store={store} />

        {/* The menu panel + search takeover, mounted once for every template. */}
        <ShellMobileOverlays
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
