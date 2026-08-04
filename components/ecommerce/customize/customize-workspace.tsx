"use client";
// coding-standard: maintained

import { useState } from "react";
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
  const partParam = useSearchParams().get("part");
  const [slidesPanel, setSlidesPanel] = useState<number | null>(null);
  const [collectionsPanel, setCollectionsPanel] = useState(false);
  // Which part is open lives here, not in the rail: the panels replace the rail
  // entirely, and a merchant who edits their slides should come back to the Hero
  // part still open rather than to a collapsed list.
  const [openPart, setOpenPart] = useState<PartId | null>(() => asPartId(partParam));
  const [page, setPage] = useState<PreviewPage>(() =>
    openPart ? previewPageForPart(openPart) : "home",
  );

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
      <div className="flex flex-col lg:sticky lg:top-6 lg:h-[calc(100vh-8.75rem)]">
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

      {/* RIGHT — the REAL storefront in preview mode */}
      <div className="lg:sticky lg:top-6">
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
