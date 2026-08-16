"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ReadyMadeTheme } from "@/lib/storefront-themes";
import type { StorefrontSettings } from "@/types";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { SECTION_LABELS } from "@/lib/storefront-section-ids";
import {
  BrowserPreview,
  type PreviewPage,
} from "@/components/ecommerce/customize/browser-preview";
import {
  applyThemeToDraft,
  seedDraft,
  type CustomizeDraft,
} from "@/components/ecommerce/customize/use-customize-draft";
import { Button } from "@/ui/components/button";

/**
 * The selected theme, rendered as **the merchant's own shop** — permanently on
 * screen beside the picker rather than behind a button.
 *
 * This replaced a modal. The modal was not merely an extra click: because it
 * mounted a fresh iframe per open, every preview server-rendered the merchant's
 * SAVED theme, painted it, and only then applied the draft — so opening a
 * preview flashed the currently-active theme first, every time. Keeping one
 * frame alive and swapping the draft over `postMessage` removes that entirely;
 * switching themes now repaints in place with no reload at all.
 *
 * It writes nothing. Apply routes to the unchanged `?theme=` staging flow, where
 * Save and Discard sit beside the same preview.
 */
export function ThemeStage({
  theme,
  settings,
  active,
}: {
  theme: ReadyMadeTheme;
  /** The merchant's saved settings — the preview's base, before the theme. */
  settings?: StorefrontSettings;
  /** The selected theme is the one the shop already runs. */
  active: boolean;
}) {
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  // Same org-logo fallback the Customize preview applies, or a shop with no
  // store-specific logo previews with a blank header.
  const orgLogo = useAuthStore((s) => s.user?.organization?.logo);
  const [page, setPage] = useState<PreviewPage>("home");

  const draft = useMemo<CustomizeDraft | null>(() => {
    if (!settings) return null;
    /* `collections: []` satisfies the type — `seedDraft` omits them because in
       Customize they come from their own query, which this page does not run.
       It is NOT a claim that the shop has none: `hasCollections={false}` below
       stops it reaching the preview, so the storefront keeps the categories it
       fetched itself. Sent as a draft, it emptied the taxonomy — which under the
       `rail` shell removed the aside and collapsed the page into its 218px
       track. */
    const base = { ...seedDraft(settings), collections: [] } as CustomizeDraft;
    return { ...base, ...applyThemeToDraft(base, theme) };
  }, [theme, settings]);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{theme.label}</h2>
          <p className="mt-0.5 max-w-prose text-sm text-muted-foreground">
            {theme.tagline}
          </p>
        </div>
        <Button asChild variant={active ? "outline" : "default"} className="flex-none">
          <Link href={`/ecommerce/customize?theme=${theme.id}`}>
            <Sparkles className="h-3.5 w-3.5" />
            {active ? "Customize" : "Apply this theme"}
          </Link>
        </Button>
      </div>

      {draft ? (
        <BrowserPreview
          slug={slug}
          draft={draft}
          page={page}
          onPageChange={setPage}
          // Neither Customize panel exists here, so neither force applies: the
          // preview must show the hero source and menu the merchant really has.
          forceHeroSlides={false}
          forceCollectionsMenu={false}
          hasCollections={false}
          // What an empty shop is previewed WITH — this theme's own trade, so a
          // merchant with no catalogue yet still sees a pharmacy in Meridian and
          // a grocery in Fresh Market rather than four blank shells. Their real
          // products, categories and badges win wherever they have any.
          samples={theme.sample}
          socialWhatsapp={settings?.social?.whatsapp}
          logo={settings?.logo ?? orgLogo ?? null}
          banner={settings?.banner ?? null}
          viewportHeight="min(66vh, 720px)"
        />
      ) : (
        <div className="rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Loading your store…
        </div>
      )}

      {/* The honesty line for the sample content, and it belongs HERE rather
          than inside the preview: a banner painted over the shop would obscure
          the very thing the merchant is trying to judge. Sample product names
          are prefixed "Sample" for the same reason this exists, but departments
          and promises are not — prefixing every rail entry would wreck the
          layout being assessed, so the disclosure is made once, in the admin
          chrome, where it cannot be mistaken for part of the design. */}
      <p className="text-xs text-muted-foreground">
        Sections your shop has no data for are filled with sample content so you
        can see the layout. Your own products, collections and badges are shown
        wherever you have them, and nothing here is saved.
      </p>

      {/* The running order in words, under the shop. The preview shows what the
          page looks like; this says what it is MADE of, which is what separates
          two themes that both look fine. */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Home page:</span>
        {theme.sections.map((id, i) => (
          <span key={id}>
            {i > 0 ? <span className="mr-2 opacity-40">→</span> : null}
            {SECTION_LABELS[id] ?? id}
          </span>
        ))}
      </div>
    </div>
  );
}
