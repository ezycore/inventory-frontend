"use client";
// coding-standard: maintained

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { StorefrontSite } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";
import type { StorefrontSettings } from "@/types";
import { settingsWithSiteLook } from "@/components/ecommerce/customize/site-look";
import { SitePublishBar } from "@/components/ecommerce/customize/site-publish-bar";
import {
  BrowserPreview,
  type PreviewPage,
} from "@/components/ecommerce/customize/browser-preview";
import { CollectionsPanel } from "@/components/ecommerce/customize/collections-panel";
import {
  MOVED_TO_PAGES,
  PartsRail,
  asPartId,
  previewDeviceForParam,
  previewDeviceForPart,
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
export function CustomizeWorkspace({
  settings: savedSettings,
  site,
}: {
  settings: StorefrontSettings;
  /** The store's look: published, and the draft Customize edits (see `SitePublishBar`). */
  site: StorefrontSite;
}) {
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  // The shop inherits the org logo when it has no store-specific one — the
  // preview applies the same fallback, or removing the store logo would blank
  // the header instead of reverting to the org mark.
  const orgLogo = useAuthStore((s) => s.user?.organization?.logo);
  // Customize is a `storefront.design` page, but collections are catalog
  // records behind `storefront.manage` — a designer can arrange the look, not
  // rename or hide the shop's collections. Reached from the Menu part, which
  // is the one site-wide part that lists them.
  const canManageCollections = useHasPermission(PERMISSIONS.storefrontManage);
  // Memoised: `useCustomizeDraft` re-seeds when this object changes, so it must
  // change only when the settings or the Site do.
  const settings = useMemo(
    () => settingsWithSiteLook(savedSettings, site),
    [savedSettings, site],
  );
  const api = useCustomizeDraft(settings, site);

  // ?part= deep-links a part open — the retired /ecommerce/navigation route and
  // the catalog's collections tab both point here.
  const params = useSearchParams();
  const partParam = params.get("part");
  /* Seven rows became pages on 2026-09-20, and `?part=` is a documented deep
     link — the retired /ecommerce/navigation route, the catalog's collections
     tab, bookmarks and old support replies all write one. A moved id has no row
     to open, so it goes to Pages rather than landing on a collapsed rail, which
     reads as a dead link. The Pages screen names the page it wants (the Home
     page card, the Shop pages card); jumping straight into one editor would
     need its id, and a query for that is not worth a redirect. */
  const movedTo = partParam ? MOVED_TO_PAGES[partParam] : undefined;
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
  const [collectionsPanel, setCollectionsPanel] = useState(false);
  // Which part is open lives here, not in the rail: the panels replace the rail
  // entirely, and a merchant who edits their slides should come back to the Hero
  // part still open rather than to a collapsed list.
  const [openPart, setOpenPart] = useState<PartId | null>(() => asPartId(partParam));
  const [page, setPage] = useState<PreviewPage>(() =>
    openPart ? previewPageForPart(openPart) : "home",
  );
  /* Which device the preview should jump to, and a token so re-opening the same
     part jumps again. Header, Menu and Filters ask for one on opening (see
     `previewDeviceForPart`), and Header's and Filters' own Phone / Computer
     switches ask again. A retired `?part=utility` link opens on Computer, where
     the strip it names now lives. */
  const [deviceRequest, setDeviceRequest] = useState(() => ({
    device: previewDeviceForParam(partParam),
    token: 0,
  }));

  // Drop `?theme=` once it has been staged, so reloading after a Discard does
  // not silently re-stage the theme the merchant just rejected. In an effect
  // because it mutates the URL — `history.replaceState` rather than
  // `router.replace`, since this is a tidy-up and not a navigation.
  //
  // Only that one param: this used to rewrite to `location.pathname`, which
  // dropped every other key. Nothing links here with both today, but `?part=`
  // is a documented deep link and "the theme link silently closed the panel you
  // asked for" is not a bug anyone would think to look for here.
  const router = useRouter();
  useEffect(() => {
    if (movedTo) router.replace("/ecommerce/pages");
  }, [movedTo, router]);

  useEffect(() => {
    if (!stagedTheme) return;
    const next = new URLSearchParams(window.location.search);
    next.delete("theme");
    const query = next.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }, [stagedTheme]);

  const togglePart = (id: PartId) => {
    const next = openPart === id ? null : id;
    setOpenPart(next);
    if (next) {
      setPage(previewPageForPart(next));
      setDeviceRequest((r) => ({
        device: previewDeviceForPart(next),
        token: r.token + 1,
      }));
    }
  };

  return (
    <div className="space-y-4">
    <SitePublishBar site={site} unsavedEdits={api.isDirty} />
    <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[440px_minmax(0,1fr)]">
      {/* LEFT — fixed-height sticky rail: content scrolls INSIDE it and each
          mode fills the same frame, so a panel takeover never changes the
          column height, less the publish bar above it. */}
      <div className="flex min-w-0 flex-col lg:sticky lg:top-6 lg:h-[calc(100vh-12.25rem)]">
        {collectionsPanel ? (
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
            onManageCollections={
              canManageCollections ? () => setCollectionsPanel(true) : undefined
            }
            device={deviceRequest.device}
            onPreviewDevice={(device) =>
              setDeviceRequest((r) => ({ device, token: r.token + 1 }))
            }
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
          published={settings.published}
          draft={api.draft}
          page={page}
          onPageChange={setPage}
          deviceRequest={deviceRequest}
          // While the panel is open, force-preview its own subject even if the
          // saved setting points elsewhere — otherwise reordering collections
          // changes nothing on screen.
          forceCollectionsMenu={collectionsPanel}
          // The contact button's number lives in Settings → General, not in this
          // draft, so the preview needs it to mirror the blank-number fallback.
          socialWhatsapp={settings.social?.whatsapp}
          // Media is saved by its own PATCH the moment it uploads, so these come
          // straight off `settings` (already refreshed by the mutation) rather
          // than from the draft.
          logo={settings.logo ?? orgLogo ?? null}
          // Raw, with no fallback chain: the storefront falls back from this to
          // the desktop logo itself, so resolving it here would make removing
          // the phone mark preview as though nothing had changed.
          mobileLogo={settings.mobileLogo ?? null}
        />
      </div>
    </div>
    </div>
  );
}
