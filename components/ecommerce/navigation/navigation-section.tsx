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
import { FooterLinksCard } from "@/components/ecommerce/navigation/footer-links-card";
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
  collections,
  onManageCollections,
}: {
  settings: StorefrontSettings;
  source: HeaderMenuSource;
  setSource: (v: HeaderMenuSource) => void;
  header: StorefrontMenuItem[];
  setHeader: (v: StorefrontMenuItem[]) => void;
  collections: CollectionRowValue[];
  onManageCollections: () => void;
}) {
  const save = useUpdateStorefrontSettings();
  const { data: pages } = useContentPages();

  const nav = settings.nav;
  const [footer, setFooter] = useState<StorefrontFooterGroup[]>(nav?.footer ?? []);
  const [announcement, setAnnouncement] = useState<AnnouncementDraft>({
    enabled: nav?.announcement?.enabled ?? false,
    text: nav?.announcement?.text ?? "",
    link: nav?.announcement?.link ?? "",
    bgColor: nav?.announcement?.bgColor ?? "#2563eb",
  });

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
          value: it.value.trim(),
          children: it.children?.length
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
      announcement: {
        enabled: announcement.enabled,
        text: announcement.text.trim() || undefined,
        link: announcement.link.trim() || undefined,
        bgColor: announcement.bgColor,
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
        <AnnouncementCard
          value={announcement}
          onChange={(patch) => setAnnouncement((a) => ({ ...a, ...patch }))}
        />
        <FooterLinksCard groups={footer} setGroups={setFooter} />
      </div>
      <div className="flex flex-none justify-end">
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save navigation"}
        </Button>
      </div>
    </div>
  );
}
