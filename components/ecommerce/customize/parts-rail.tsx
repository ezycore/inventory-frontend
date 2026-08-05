"use client";
// coding-standard: maintained

import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  GalleryHorizontalEnd,
  Home,
  LayoutGrid,
  Library,
  Megaphone,
  Package,
  Palette,
  PanelBottom,
  PanelTop,
} from "lucide-react";
import {
  asHomeVariant,
  resolveHomeSections,
} from "@/lib/storefront-home-sections";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { StorefrontSettings } from "@/types";
import { Button } from "@/ui/components/button";
import { Switch } from "@/ui/components/switch";
import { PartBlock, PartGroup } from "@/components/ecommerce/customize/part-group";
import { partSummary } from "@/components/ecommerce/customize/part-summaries";
import { HomeSectionsField } from "@/components/ecommerce/customize/home-sections-field";
import { PagePresetRow } from "@/components/ecommerce/customize/page-preset-row";
import { PromoTilesField } from "@/components/ecommerce/customize/promo-tiles-field";
import { AnnouncementPart } from "@/components/ecommerce/customize/parts/announcement-part";
import { BrandPart } from "@/components/ecommerce/customize/parts/brand-part";
import { ThemePart } from "@/components/ecommerce/customize/parts/theme-part";
import { CollectionsPart } from "@/components/ecommerce/customize/parts/collections-part";
import { FooterPart } from "@/components/ecommerce/customize/parts/footer-part";
import { HeaderPart } from "@/components/ecommerce/customize/parts/header-part";
import { HeroPart } from "@/components/ecommerce/customize/parts/hero-part";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import type { PreviewPage } from "@/components/ecommerce/customize/browser-preview";
import type {
  CustomizeDraftApi,
  PartId,
} from "@/components/ecommerce/customize/use-customize-draft";

/**
 * The Customize rail: every part of the store, in the order a shopper meets it,
 * over one save bar.
 *
 * The order is the point. It replaced three tabs named after the settings
 * objects the backend stores (`theme` / `templates` / `nav`), which split single
 * visible things across all three — the footer's layout, its copyright line and
 * its links each lived in a different tab behind a different save button.
 */
const PARTS: { id: PartId; title: string; icon?: LucideIcon }[] = [
  // First, and the one exception to "in the order a shopper meets it": a theme
  // sets most of what follows, so a merchant who wants one should meet it
  // before spending time on the individual pickers it would overwrite.
  { id: "theme", title: "Theme", icon: Palette },
  { id: "brand", title: "Brand" },
  { id: "announcement", title: "Announcement bar", icon: Megaphone },
  { id: "header", title: "Header", icon: PanelTop },
  { id: "hero", title: "Hero", icon: GalleryHorizontalEnd },
  { id: "home", title: "Home page", icon: Home },
  { id: "cards", title: "Product cards", icon: LayoutGrid },
  { id: "collections", title: "Collections", icon: Library },
  { id: "product", title: "Product page", icon: Package },
  { id: "footer", title: "Footer", icon: PanelBottom },
  { id: "checkout", title: "Checkout", icon: CreditCard },
];

/** Opening a part points the preview at a page that actually shows it. */
const PART_PAGE: Partial<Record<PartId, PreviewPage>> = {
  cards: "collection",
  collections: "collection",
  product: "product",
};

export const previewPageForPart = (id: PartId): PreviewPage =>
  PART_PAGE[id] ?? "home";

/** Narrows a `?part=` query value; anything else leaves the rail collapsed. */
export const asPartId = (value: string | null): PartId | null =>
  PARTS.some((p) => p.id === value) ? (value as PartId) : null;

export function PartsRail({
  settings,
  api,
  open,
  onToggle,
  onManageCollections,
  onEditSlide,
}: {
  settings: StorefrontSettings;
  api: CustomizeDraftApi;
  /** Owned by the workspace so it survives a panel taking the rail over. */
  open: PartId | null;
  onToggle: (id: PartId) => void;
  onManageCollections: () => void;
  onEditSlide: (index: number) => void;
}) {
  const { draft, patch, patchTemplate, dirtyParts, isDirty, discard, save, saving } =
    api;
  const orgHasLogo = !!useAuthStore((s) => s.user?.organization?.logo);

  const dirtyNames = dirtyParts
    .map((id) => PARTS.find((p) => p.id === id)?.title)
    .filter(Boolean);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="min-h-0 flex-1 lg:overflow-y-auto">
        {PARTS.map((part) => (
          <PartGroup
            key={part.id}
            icon={part.icon}
            media={
              part.id === "brand" ? (
                <span
                  className="h-8 w-8 flex-none rounded-lg border"
                  style={{
                    background: `linear-gradient(135deg, ${draft.brandColor}, ${draft.accentColor})`,
                  }}
                />
              ) : undefined
            }
            title={part.title}
            summary={partSummary(part.id, draft, settings, orgHasLogo)}
            open={open === part.id}
            onToggle={() => onToggle(part.id)}
            dirty={dirtyParts.includes(part.id)}
            control={
              part.id === "announcement" ? (
                <Switch
                  checked={draft.announcement.enabled}
                  onCheckedChange={(enabled) => {
                    api.patchAnnouncement({ enabled });
                    // Turning it on with nothing written is the one state a
                    // merchant never wants, so open the editor with it.
                    if (enabled && open !== "announcement") onToggle("announcement");
                  }}
                  aria-label="Show the announcement bar"
                />
              ) : undefined
            }
          >
            {part.id === "theme" ? (
              <ThemePart draft={draft} applyTheme={api.applyTheme} />
            ) : part.id === "brand" ? (
              <BrandPart settings={settings} draft={draft} patch={patch} />
            ) : part.id === "announcement" ? (
              <AnnouncementPart draft={draft} patchAnnouncement={api.patchAnnouncement} />
            ) : part.id === "header" ? (
              <HeaderPart
                draft={draft}
                patch={patch}
                patchTemplate={patchTemplate}
                onManageCollections={onManageCollections}
              />
            ) : part.id === "hero" ? (
              <HeroPart
                settings={settings}
                draft={draft}
                patch={patch}
                patchTemplate={patchTemplate}
                onEditSlide={onEditSlide}
              />
            ) : part.id === "collections" ? (
              <CollectionsPart
                draft={draft}
                patchTemplate={patchTemplate}
                applyPagePreset={api.applyPagePreset}
                onManageCollections={onManageCollections}
              />
            ) : part.id === "footer" ? (
              <FooterPart
                draft={draft}
                patch={patch}
                patchTemplate={patchTemplate}
                patchContentPages={api.patchContentPages}
              />
            ) : part.id === "cards" ? (
              // Two independent questions: how much room a card takes, and what
              // it offers. Keeping them in one part is right — they are the same
              // card — but they must not read as one nine-option picker.
              <>
                <PartBlock label="Card style">
                  <TemplatePicker
                    templateKey="productCard"
                    value={draft.templates.productCard}
                    onChange={(v) => patchTemplate("productCard", v)}
                  />
                </PartBlock>
                <PartBlock
                  label="Buttons on each card"
                  hint="Independent of the style above — a compact card can still show two buttons."
                >
                  <TemplatePicker
                    templateKey="cardActions"
                    value={draft.templates.cardActions}
                    onChange={(v) => patchTemplate("cardActions", v)}
                  />
                </PartBlock>
              </>
            ) : part.id === "home" ? (
              // Two questions again: which look the blocks are drawn in, and
              // which blocks there are. The look styles every section; the list
              // decides what a shopper actually scrolls past.
              <>
                <PartBlock
                  label="Start from"
                  hint="Sets the layout and the section list together — then change anything below."
                >
                  <PagePresetRow
                    pageKey="home"
                    draft={draft}
                    onApply={api.applyPagePreset}
                  />
                </PartBlock>
                <PartBlock label="Layout">
                  <TemplatePicker
                    templateKey="home"
                    value={draft.templates.home}
                    onChange={(v) => patchTemplate("home", v)}
                  />
                </PartBlock>
                <PartBlock
                  label="Sections"
                  hint="Top to bottom, as shoppers scroll. Switching the layout above changes how each one looks, not which ones show."
                >
                  <HomeSectionsField
                    value={draft.homepageSections}
                    variant={asHomeVariant(draft.templates.home)}
                    onChange={(homepageSections) => patch({ homepageSections })}
                  />
                </PartBlock>
                {/* Only when the tiles actually render — otherwise this is a
                    form for something the shopper will never see. */}
                {resolveHomeSections(
                  draft.homepageSections,
                  asHomeVariant(draft.templates.home),
                ).includes("promo") && (
                  <PartBlock
                    label="Promo tiles"
                    hint="The two boxes at the bottom of the home page. Leave a field empty to keep the default wording."
                  >
                    <PromoTilesField
                      tiles={draft.promoTiles}
                      setTile={(i, p) =>
                        patch({
                          promoTiles: draft.promoTiles.map((tile, idx) =>
                            idx === i ? { ...tile, ...p } : tile,
                          ),
                        })
                      }
                    />
                  </PartBlock>
                )}
              </>
            ) : (
              // product / checkout are a single layout choice each, so the part
              // IS its picker and its id IS the template key.
              <TemplatePicker
                templateKey={part.id}
                value={draft.templates[part.id]}
                onChange={(v) => patchTemplate(part.id, v)}
                columns={part.id === "checkout" ? 2 : 3}
              />
            )}
          </PartGroup>
        ))}
      </div>

      <div className="flex flex-none items-center gap-3 border-t bg-muted/30 px-3.5 py-2.5">
        {isDirty ? (
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500">
            <span className="h-1.5 w-1.5 flex-none rounded-full bg-amber-500" />
            <span className="truncate">{dirtyNames.join(", ")} changed</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">All changes saved</span>
        )}
        <span className="ml-auto flex flex-none gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={discard}
            disabled={!isDirty || saving}
          >
            Discard
          </Button>
          <Button size="sm" onClick={save} disabled={!isDirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </span>
      </div>
    </div>
  );
}
