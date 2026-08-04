"use client";
// coding-standard: maintained

import {
  useContentPages,
  useUpdateStorefrontSettings,
} from "@/services/api";
import type { HeaderMenuSource } from "@/lib/storefront-client";
import type {
  StorefrontFooterGroup,
  StorefrontMenuItem,
  StorefrontNav,
  StorefrontSettings,
} from "@/types";
import { Button } from "@/ui/components/button";
import type { CollectionRowValue } from "@/components/ecommerce/collections/collection-row";
import {
  AnnouncementCard,
  type AnnouncementDraft,
} from "@/components/ecommerce/navigation/announcement-card";
import {
  FooterLinksCard,
  type FooterContentPagesDraft,
} from "@/components/ecommerce/navigation/footer-links-card";
import { HeaderMenuCard } from "@/components/ecommerce/navigation/header-menu-card";
import type { NavOption } from "@/components/ecommerce/navigation/menu-item-fields";

/**
 * Customize → Navigation: header menu (+ its source), footer link groups, and
 * the announcement bar. **Every draft here is lifted to CustomizeWorkspace** so
 * the live preview repaints as you edit — this section owns no preview-relevant
 * state of its own. Footer groups were the last local holdout (they were the one
 * Customize control with no live preview, which read as a bug); keep it that way.
 */
export function NavigationSection({
  settings,
  source,
  setSource,
  header,
  setHeader,
  announcement,
  setAnnouncement,
  footer,
  setFooter,
  contentPages,
  setContentPages,
  collections,
  onManageCollections,
}: {
  settings: StorefrontSettings;
  source: HeaderMenuSource;
  setSource: (v: HeaderMenuSource) => void;
  header: StorefrontMenuItem[];
  setHeader: (v: StorefrontMenuItem[]) => void;
  announcement: AnnouncementDraft;
  setAnnouncement: (patch: Partial<AnnouncementDraft>) => void;
  footer: StorefrontFooterGroup[];
  setFooter: (v: StorefrontFooterGroup[]) => void;
  contentPages: FooterContentPagesDraft;
  setContentPages: (patch: Partial<FooterContentPagesDraft>) => void;
  collections: CollectionRowValue[];
  onManageCollections: () => void;
}) {
  const save = useUpdateStorefrontSettings();
  const { data: pages } = useContentPages();

  // Menu links target categories by slug; slugless ones (legacy seed data) are
  // unlinkable — and Radix Select crashes on empty-string item values.
  const categoryOptions: NavOption[] = collections.flatMap((c) =>
    c.slug ? [{ label: c.displayName || c.name, value: c.slug }] : [],
  );
  const pageOptions: NavOption[] = (pages ?? []).map((p) => ({
    label: p.title,
    value: p.slug,
  }));

  const submit = () => {
    const clean = (items: StorefrontMenuItem[]): StorefrontMenuItem[] =>
      items
        .filter((it) => it.label.trim())
        .map((it) => ({
          label: it.label.trim(),
          type: it.type,
          value: it.type === "collections" ? "" : it.value.trim(),
          // A collections block expands inline; drop children left over from
          // before the row's type was switched.
          children: it.type !== "collections" && it.children?.length
            ? it.children
                .filter((c) => c.label.trim())
                .map((c) => ({
                  label: c.label.trim(),
                  type: c.type,
                  value: c.value.trim(),
                }))
            : undefined,
        }));
    const nextNav: StorefrontNav = {
      header: clean(header),
      footer: footer
        .filter((g) => g.title.trim())
        .map((g) => ({
          title: g.title.trim(),
          links: g.links.filter((l) => l.label.trim()),
        })),
      footerContentPages: {
        show: contentPages.show,
        title: contentPages.title.trim() || undefined,
      },
      announcement: {
        enabled: announcement.enabled,
        text: announcement.text.trim() || undefined,
        link: announcement.link.trim() || undefined,
        bgColor: announcement.bgColor,
        textColor: announcement.textColor.trim() || undefined,
        icon: announcement.icon.trim() || undefined,
        ctaLabel: announcement.ctaLabel.trim() || undefined,
        dismissible: announcement.dismissible,
        size: announcement.size,
        // Sent wholesale (nav replaces on PATCH); null clears a removed image
        // and the backend deletes the orphaned asset.
        bgImage: announcement.bgImage,
        overlay: announcement.overlay,
        overlayOpacity: announcement.overlayOpacity,
        bgFit: announcement.bgFit,
      },
    };
    save.mutate({
      nav: nextNav,
      // The settings PATCH replaces `templates` wholesale (shallow Object.assign
      // server-side), so spread the saved ids or this save would wipe the page
      // layout choices made in the Templates section.
      templates: { ...settings.templates, headerMenu: source },
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {/* `overflow-y-auto` forces overflow-x to `auto` too, so it clips at the
          padding box — without this inset the cards' left border and focus ring
          get shaved off. The negative margin keeps the rail width. */}
      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-1">
        <HeaderMenuCard
          source={source}
          setSource={setSource}
          header={header}
          setHeader={setHeader}
          collections={collections}
          categoryOptions={categoryOptions}
          pageOptions={pageOptions}
          onManageCollections={onManageCollections}
        />
        <AnnouncementCard value={announcement} onChange={setAnnouncement} />
        <FooterLinksCard
          groups={footer}
          setGroups={setFooter}
          contentPages={contentPages}
          setContentPages={setContentPages}
        />
      </div>
      <div className="flex flex-none justify-end">
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save navigation"}
        </Button>
      </div>
    </div>
  );
}
