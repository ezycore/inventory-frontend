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
  Percent,
  Package,
  PanelBottom,
  PanelTop,
  Rows3,
  Smartphone,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { StorefrontSettings } from "@/types";
import { Button } from "@/ui/components/button";
import { Switch } from "@/ui/components/switch";
import { PartGroup } from "@/components/ecommerce/customize/part-group";
import { partSummary } from "@/components/ecommerce/customize/part-summaries";
import { AnnouncementPart } from "@/components/ecommerce/customize/parts/announcement-part";
import { CampaignStripPart } from "@/components/ecommerce/customize/parts/campaign-strip-part";
import { CardsPart } from "@/components/ecommerce/customize/parts/cards-part";
import { CollectionsPart } from "@/components/ecommerce/customize/parts/collections-part";
import { ContactPart } from "@/components/ecommerce/customize/parts/contact-part";
import { FooterPart } from "@/components/ecommerce/customize/parts/footer-part";
import { HeaderPart } from "@/components/ecommerce/customize/parts/header-part";
import { HeroPart } from "@/components/ecommerce/customize/parts/hero-part";
import { HomePart } from "@/components/ecommerce/customize/parts/home-part";
import { LookPart } from "@/components/ecommerce/customize/parts/look-part";
import { MobilePart } from "@/components/ecommerce/customize/parts/mobile-part";
import { TemplatePicker } from "@/components/ecommerce/customize/parts/template-picker";
import { UtilityBarPart } from "@/components/ecommerce/customize/parts/utility-bar-part";
import type { PreviewPage } from "@/components/ecommerce/customize/browser-preview";
import type {
  CustomizeDraftApi,
  PartId,
} from "@/components/ecommerce/customize/use-customize-draft";

/**
 * The Customize rail: every part of the store over one save bar.
 *
 * It replaced three tabs named after the settings objects the backend stores
 * (`theme` / `templates` / `nav`), which split single visible things across all
 * three — the footer's layout, its copyright line and its links each lived in a
 * different tab behind a different save button.
 *
 * **Grouped by the merchant's question, ordered inside a group by the shopper's
 * journey.** The flat list this replaced was sequenced end to end by the order a
 * shopper meets each part, which is a good principle serving the wrong reader: a
 * merchant is not walking their shop top to bottom, they are hunting for one
 * thing, and seventeen equals in one column is a list you read rather than scan.
 * Inside a group the shopper's order is exactly right — announcement bar,
 * campaign strip, hero, sections is the order they appear down the page — so it
 * is kept there.
 */
interface RailPart {
  id: PartId;
  title: string;
  icon?: LucideIcon;
}

export const LOOK: RailPart = { id: "look", title: "Look" };

/**
 * The four groups. `look` is deliberately NOT one of them: it is the only part
 * that changes every other one, so it sits above the groups rather than inside a
 * group of its own — which would also have put a heading called Look directly
 * over a row called Look.
 */
export const RAIL_GROUPS: { title: string; parts: RailPart[] }[] = [
  {
    title: "Home page",
    parts: [
      { id: "announcement", title: "Announcement bar", icon: Megaphone },
      { id: "campaign", title: "Campaign strip", icon: Percent },
      { id: "hero", title: "Hero", icon: GalleryHorizontalEnd },
      { id: "home", title: "Home page", icon: Home },
    ],
  },
  {
    title: "Shop pages",
    parts: [
      { id: "cards", title: "Product cards", icon: LayoutGrid },
      { id: "collections", title: "Collections", icon: Library },
      { id: "product", title: "Product page", icon: Package },
      { id: "content", title: "Content pages", icon: FileText },
    ],
  },
  {
    title: "Buying",
    parts: [
      { id: "cart", title: "Cart", icon: ShoppingCart },
      { id: "checkout", title: "Checkout", icon: CreditCard },
      { id: "account", title: "Account area", icon: UserRound },
    ],
  },
  {
    title: "Site frame",
    parts: [
      { id: "header", title: "Header", icon: PanelTop },
      { id: "utility", title: "Utility bar", icon: Rows3 },
      /* Directly under Header, because it answers the same question for the
         other screen — and above Footer, because for these merchants far more
         shoppers see this bar than ever reach a footer. */
      { id: "mobile", title: "Phone bar", icon: Smartphone },
      { id: "footer", title: "Footer", icon: PanelBottom },
      { id: "shell", title: "Page layout", icon: Columns2 },
      { id: "contact", title: "WhatsApp button", icon: MessageCircle },
    ],
  },
];

const PARTS: RailPart[] = [LOOK, ...RAIL_GROUPS.flatMap((group) => group.parts)];

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

/**
 * Which device a part is about. Everything is "desktop" except the one part that
 * is only visible on a phone — opening it against a desktop frame gives the
 * merchant a panel of controls that change nothing on screen, which is the same
 * broken-control problem `PART_PAGE` exists to solve one axis over.
 */
export const previewDeviceForPart = (
  id: PartId | null,
): "desktop" | "mobile" => (id === "mobile" ? "mobile" : "desktop");

/**
 * Ids that used to be rows. `?part=` is a documented deep link, so a bookmark or
 * a support reply written before the merge still opens the panel that absorbed
 * it rather than a collapsed rail.
 */
const RETIRED_PART_IDS: Record<string, PartId> = {
  brand: "look",
  design: "look",
};

/** Narrows a `?part=` query value; anything else leaves the rail collapsed. */
export const asPartId = (value: string | null): PartId | null => {
  if (PARTS.some((p) => p.id === value)) return value as PartId;
  return RETIRED_PART_IDS[value ?? ""] ?? null;
};

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
  /** Omitted without `storefront.manage` — see `CollectionsPart`. */
  onManageCollections?: () => void;
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
    savesDraft,
  } = api;
  const orgHasLogo = !!useAuthStore((s) => s.user?.organization?.logo);

  const dirtyNames = dirtyParts
    .map((id) => PARTS.find((p) => p.id === id)?.title)
    .filter(Boolean);

  const renderPart = (part: RailPart) => (
    <PartGroup
      key={part.id}
      icon={part.icon}
      media={
        part.id === "look" ? (
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
        ) : part.id === "campaign" ? (
          <Switch
            checked={draft.campaignStrip.enabled}
            onCheckedChange={(enabled) => {
              api.patchCampaignStrip({ enabled });
              if (enabled && open !== "campaign") onToggle("campaign");
            }}
            aria-label="Show the campaign strip"
          />
        ) : part.id === "utility" ? (
          <Switch
            checked={draft.utilityBar.enabled}
            onCheckedChange={(enabled) => {
              patch({
                utilityBar: { ...draft.utilityBar, enabled },
              });
              if (enabled && open !== "utility") onToggle("utility");
            }}
            aria-label="Show the utility bar"
          />
        ) : part.id === "contact" ? (
          <Switch
            checked={draft.contactButton.enabled}
            // No number anywhere = nothing to link to, so the switch is
            // dead rather than shipping a `wa.me/` with no digits. The
            // collapsed part says where to add one.
            disabled={
              !draft.contactButton.enabled && !settings.social?.whatsapp?.trim()
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
      {part.id === "look" ? (
        <LookPart settings={settings} draft={draft} patch={patch} />
      ) : part.id === "announcement" ? (
        <AnnouncementPart
          settings={settings}
          draft={draft}
          patchAnnouncement={api.patchAnnouncement}
        />
      ) : part.id === "campaign" ? (
        <CampaignStripPart
          draft={draft}
          patchCampaignStrip={api.patchCampaignStrip}
        />
      ) : part.id === "mobile" ? (
        <MobilePart
          settings={settings}
          draft={draft}
          patchMobile={api.patchMobile}
          patchMobileTemplate={api.patchMobileTemplate}
        />
      ) : part.id === "utility" ? (
        <UtilityBarPart settings={settings} draft={draft} patch={patch} />
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
          onChange={(v) => patchTemplate(PART_TEMPLATE_KEY[part.id] ?? part.id, v)}
          columns={part.id === "product" ? 3 : 2}
        />
      )}
    </PartGroup>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="min-h-0 flex-1 lg:overflow-y-auto">
        {renderPart(LOOK)}

        {RAIL_GROUPS.map((group) => (
          <div key={group.title}>
            {/* Sticky, because the group is the answer to "where am I?" and an
                open part is taller than the rail — scrolling into the middle of
                Site frame with the heading gone puts the merchant back where the
                flat list left them. */}
            <h3 className="sticky top-0 z-10 border-b bg-muted/60 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
              {group.title}
            </h3>
            {group.parts.map(renderPart)}
          </div>
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
          <span className="text-xs text-muted-foreground">
            {savesDraft ? "Draft saved" : "All changes saved"}
          </span>
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
            {saving ? "Saving…" : savesDraft ? "Save draft" : "Save changes"}
          </Button>
        </span>
      </div>
    </div>
  );
}
