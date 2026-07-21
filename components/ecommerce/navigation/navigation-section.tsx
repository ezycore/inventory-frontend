"use client";
// coding-standard: maintained

import { useState } from "react";
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
 * the announcement bar. The preview-relevant draft (menu source + header items)
 * is lifted to CustomizeWorkspace so the live preview repaints as you edit;
 * footer/announcement are local since the preview doesn't render them.
 */
export function NavigationSection({
  settings,
  source,
  setSource,
  header,
  setHeader,
  announcement,
  setAnnouncement,
  collections,
  onManageCollections,
}: {
  settings: StorefrontSettings;
  source: HeaderMenuSource;
  setSource: (v: HeaderMenuSource) => void;
  header: StorefrontMenuItem[];
  setHeader: (v: StorefrontMenuItem[]) => void;
  // Announcement draft is lifted to CustomizeWorkspace so the live preview
  // repaints as it's edited (footer stays local — the preview doesn't render it).
  announcement: AnnouncementDraft;
  setAnnouncement: (patch: Partial<AnnouncementDraft>) => void;
  collections: CollectionRowValue[];
  onManageCollections: () => void;
}) {
  const save = useUpdateStorefrontSettings();
  const { data: pages } = useContentPages();

  const nav = settings.nav;
  const [footer, setFooter] = useState<StorefrontFooterGroup[]>(nav?.footer ?? []);
  // Auto content-pages column: `show` defaults on (legacy behaviour) so existing
  // stores keep showing it; blank title ⇒ the built-in "Information" heading.
  const [contentPages, setContentPages] = useState<FooterContentPagesDraft>(() => ({
    show: nav?.footerContentPages?.show ?? true,
    title: nav?.footerContentPages?.title ?? "",
  }));
  const patchContentPages = (patch: Partial<FooterContentPagesDraft>) =>
    setContentPages((c) => ({ ...c, ...patch }));

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
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
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
          setContentPages={patchContentPages}
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
