"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { StorefrontSettings } from "@/types";
import {
  BrowserPreview,
  type PreviewPage,
} from "@/components/ecommerce/customize/browser-preview";
import { CollectionsPanel } from "@/components/ecommerce/customize/collections-panel";
import { HeroSlidesPanel } from "@/components/ecommerce/customize/hero-slides-panel";
import {
  PartsRail,
  asPartId,
  previewPageForPart,
} from "@/components/ecommerce/customize/parts-rail";
import {
  useCustomizeDraft,
  type PartId,
} from "@/components/ecommerce/customize/use-customize-draft";

/**
 * Customize: the store's parts on the left, the store itself on the right.
 *
 * All editing state lives in `useCustomizeDraft`, one level above everything
 * that renders it. Parts collapse and the two panels take the rail over, so any
 * state held inside them would be discarded the moment a merchant opened
 * something else — while the preview, fed from the same draft, went on showing
 * the edit that had just been lost.
 */
export function CustomizeWorkspace({ settings }: { settings: StorefrontSettings }) {
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  // The shop inherits the org logo when it has no store-specific one — the
  // preview applies the same fallback, or removing the store logo would blank
  // the header instead of reverting to the org mark.
  const orgLogo = useAuthStore((s) => s.user?.organization?.logo);
  const api = useCustomizeDraft(settings);

  // ?part= deep-links a part open — the retired /ecommerce/navigation route and
  // the catalog's collections tab both point here.
  const params = useSearchParams();
  const partParam = params.get("part");
  // ?theme= stages a ready-made theme from Online Store → Themes as an UNSAVED
  // edit, which is the whole apply flow: the preview repaints, the save bar
  // lists what changed, Discard undoes it and Save confirms.
  //
  // Staged during render via STATE — the same "adjust state on prop change"
  // pattern `useCustomizeDraft` uses to re-seed, and it must stage exactly once
  // per id or it would re-stamp over the merchant's own edits on every render.
  // Not an effect (it would paint the old look for a frame first) and not a ref
  // (`react-hooks` rejects reading or writing one during render).
  const themeParam = params.get("theme");
  const [stagedTheme, setStagedTheme] = useState<string | null>(null);
  if (themeParam && stagedTheme !== themeParam) {
    setStagedTheme(themeParam);
    api.applyTheme(themeParam);
  }
  const [slidesPanel, setSlidesPanel] = useState<number | null>(null);
  const [collectionsPanel, setCollectionsPanel] = useState(false);
  // Which part is open lives here, not in the rail: the panels replace the rail
  // entirely, and a merchant who edits their slides should come back to the Hero
  // part still open rather than to a collapsed list.
  const [openPart, setOpenPart] = useState<PartId | null>(() => asPartId(partParam));
  const [page, setPage] = useState<PreviewPage>(() =>
    openPart ? previewPageForPart(openPart) : "home",
  );

  // Drop `?theme=` once it has been staged, so reloading after a Discard does
  // not silently re-stage the theme the merchant just rejected. In an effect
  // because it mutates the URL — `history.replaceState` rather than
  // `router.replace`, since this is a tidy-up and not a navigation.
  useEffect(() => {
    if (stagedTheme) window.history.replaceState(null, "", window.location.pathname);
  }, [stagedTheme]);

  const togglePart = (id: PartId) => {
    const next = openPart === id ? null : id;
    setOpenPart(next);
    if (next) setPage(previewPageForPart(next));
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[440px_minmax(0,1fr)]">
      {/* LEFT — fixed-height sticky rail: content scrolls INSIDE it and each
          mode fills the same frame, so a panel takeover never changes the
          column height. */}
      <div className="flex min-w-0 flex-col lg:sticky lg:top-6 lg:h-[calc(100vh-8.75rem)]">
        {slidesPanel !== null ? (
          <HeroSlidesPanel
            slides={api.draft.heroSlides}
            setSlides={(heroSlides) => api.patch({ heroSlides })}
            initialExpanded={slidesPanel}
            onClose={() => setSlidesPanel(null)}
          />
        ) : collectionsPanel ? (
          <CollectionsPanel
            collections={api.draft.collections}
            setCollections={(collections) => api.patch({ collections })}
            onClose={() => setCollectionsPanel(false)}
          />
        ) : (
          <PartsRail
            settings={settings}
            api={api}
            open={openPart}
            onToggle={togglePart}
            onManageCollections={() => setCollectionsPanel(true)}
            onEditSlide={(index) => setSlidesPanel(index)}
          />
        )}
      </div>

      {/* RIGHT — the REAL storefront in preview mode.
          `min-w-0` on both columns: stacked into one grid track on a phone, the
          track's default `min-width: auto` sizes it to the WIDER child's minimum
          — so the preview's toolbar was dragging the rail past the viewport. */}
      <div className="min-w-0 lg:sticky lg:top-6">
        <BrowserPreview
          slug={slug}
          draft={api.draft}
          page={page}
          onPageChange={setPage}
          // While a panel is open, force-preview its own subject even if the
          // saved setting points elsewhere — otherwise reordering collections or
          // writing slides changes nothing on screen.
          forceHeroSlides={slidesPanel !== null}
          forceCollectionsMenu={collectionsPanel}
          // The contact button's number lives in Settings → General, not in this
          // draft, so the preview needs it to mirror the blank-number fallback.
          socialWhatsapp={settings.social?.whatsapp}
          // Media is saved by its own PATCH the moment it uploads, so these come
          // straight off `settings` (already refreshed by the mutation) rather
          // than from the draft.
          logo={settings.logo ?? orgLogo ?? null}
          banner={settings.banner ?? null}
        />
      </div>
    </div>
  );
}
