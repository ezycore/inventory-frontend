"use client";
// coding-standard: maintained

import type { LucideIcon } from "lucide-react";
import {
  Columns2,
  CreditCard,
  FileText,
  GalleryHorizontalEnd,
  Home,
  LayoutGrid,
  Library,
  Megaphone,
  MessageCircle,
  Package,
  PanelBottom,
  PanelTop,
  ShoppingCart,
  Type,
  UserRound,
} from "lucide-react";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { StorefrontSettings } from "@/types";
import { Button } from "@/ui/components/button";
import { Switch } from "@/ui/components/switch";
import { PartGroup } from "@/components/ecommerce/customize/part-group";
import { partSummary } from "@/components/ecommerce/customize/part-summaries";
import { AnnouncementPart } from "@/components/ecommerce/customize/parts/announcement-part";
import { BrandPart } from "@/components/ecommerce/customize/parts/brand-part";
import { CardsPart } from "@/components/ecommerce/customize/parts/cards-part";
import { CollectionsPart } from "@/components/ecommerce/customize/parts/collections-part";
import { ContactPart } from "@/components/ecommerce/customize/parts/contact-part";
import { DesignPart } from "@/components/ecommerce/customize/parts/design-part";
import { FooterPart } from "@/components/ecommerce/customize/parts/footer-part";
import { HeaderPart } from "@/components/ecommerce/customize/parts/header-part";
import { HeroPart } from "@/components/ecommerce/customize/parts/hero-part";
import { HomePart } from "@/components/ecommerce/customize/parts/home-part";
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
  { id: "brand", title: "Brand" },
  { id: "design", title: "Design", icon: Type },
  { id: "announcement", title: "Announcement bar", icon: Megaphone },
  { id: "header", title: "Header", icon: PanelTop },
  { id: "hero", title: "Hero", icon: GalleryHorizontalEnd },
  { id: "home", title: "Home page", icon: Home },
  { id: "cards", title: "Product cards", icon: LayoutGrid },
  { id: "collections", title: "Collections", icon: Library },
  { id: "product", title: "Product page", icon: Package },
  { id: "contact", title: "WhatsApp button", icon: MessageCircle },
  { id: "footer", title: "Footer", icon: PanelBottom },
  { id: "account", title: "Account area", icon: UserRound },
  { id: "shell", title: "Page layout", icon: Columns2 },
  { id: "cart", title: "Cart", icon: ShoppingCart },
  { id: "content", title: "Content pages", icon: FileText },
  { id: "checkout", title: "Checkout", icon: CreditCard },
];

/** Opening a part points the preview at a page that actually shows it. */
const PART_PAGE: Partial<Record<PartId, PreviewPage>> = {
  cards: "collection",
  collections: "collection",
  product: "product",
};

/** Parts whose `templates.*` key is not simply their own id. */
const PART_TEMPLATE_KEY: Partial<Record<PartId, string>> = {
  account: "accountLayout",
  cart: "cartLayout",
  content: "contentLayout",
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
  const {
    draft,
    patch,
    patchTemplate,
    patchHomeTemplate,
    dirtyParts,
    isDirty,
    validationErrors,
    isValid,
    discard,
    save,
    saving,
  } = api;
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
              ) : part.id === "contact" ? (
                <Switch
                  checked={draft.contactButton.enabled}
                  // No number anywhere = nothing to link to, so the switch is
                  // dead rather than shipping a `wa.me/` with no digits. The
                  // collapsed part says where to add one.
                  disabled={
                    !draft.contactButton.enabled &&
                    !settings.social?.whatsapp?.trim()
                  }
                  onCheckedChange={(enabled) => {
                    api.patchContactButton({ enabled });
                    if (enabled && open !== "contact") onToggle("contact");
                  }}
                  aria-label="Show the WhatsApp button"
                />
              ) : undefined
            }
          >
            {part.id === "brand" ? (
              <BrandPart settings={settings} draft={draft} patch={patch} />
            ) : part.id === "design" ? (
              <DesignPart draft={draft} patch={patch} />
            ) : part.id === "announcement" ? (
              <AnnouncementPart
                settings={settings}
                draft={draft}
                patchAnnouncement={api.patchAnnouncement}
              />
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
                onManageCollections={onManageCollections}
              />
            ) : part.id === "contact" ? (
              <ContactPart
                settings={settings}
                draft={draft}
                patchContactButton={api.patchContactButton}
              />
            ) : part.id === "footer" ? (
              <FooterPart
                draft={draft}
                patch={patch}
                patchTemplate={patchTemplate}
                patchContentPages={api.patchContentPages}
              />
            ) : part.id === "cards" ? (
              <CardsPart draft={draft} patchTemplate={patchTemplate} />
            ) : part.id === "home" ? (
              <HomePart
                draft={draft}
                patch={patch}
                patchTemplate={patchTemplate}
                patchHomeTemplate={patchHomeTemplate}
              />
            ) : (
              // product / account / checkout are a single layout choice each, so
              // the part IS its picker. Its id is usually the template key too —
              // `account` is the one that is not, because the key it writes
              // (`accountLayout`) selects a whole page component rather than a
              // variation, and naming it plainly is worth one map entry.
              <TemplatePicker
                templateKey={PART_TEMPLATE_KEY[part.id] ?? part.id}
                value={draft.templates[PART_TEMPLATE_KEY[part.id] ?? part.id]}
                onChange={(v) =>
                  patchTemplate(PART_TEMPLATE_KEY[part.id] ?? part.id, v)
                }
                columns={part.id === "product" ? 3 : 2}
              />
            )}
          </PartGroup>
        ))}
      </div>

      {/* Wraps: the status line plus both buttons sit right on the width of a
          360px phone, and Save is the one control that must never be clipped. */}
      <div className="flex flex-none flex-wrap items-center gap-x-3 gap-y-2 border-t bg-muted/30 px-3.5 py-2.5">
        {!isValid ? (
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
            <span className="h-1.5 w-1.5 flex-none rounded-full bg-destructive" />
            <span className="truncate">{validationErrors[0]}. Fix it before saving.</span>
          </span>
        ) : isDirty ? (
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
          <Button size="sm" onClick={save} disabled={!isDirty || !isValid || saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </span>
      </div>
    </div>
  );
}
