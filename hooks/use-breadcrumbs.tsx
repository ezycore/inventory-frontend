'use client';
// coding-standard: maintained

import { navItems } from '@/constants/navItem';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { useNavLabels } from './use-nav-labels';

type BreadcrumbItem = {
  title: string;
  /** Absent when the segment has no page of its own — rendered as plain text. */
  link?: string;
};

// Grouping-only URL segments with no page.tsx behind them — never linked.
const NON_ROUTABLE_PATHS = new Set(['/settings']);

// "/url" → "Title" from the nav config so crumbs match the sidebar labels.
// Parents are registered before children so shared URLs (e.g. /purchases is
// both "Purchases" and "New Purchase") keep the parent's more general title.
const navTitleByPath = new Map<string, string>();
for (const item of navItems) {
  if (item.url !== '#' && !navTitleByPath.has(item.url)) {
    navTitleByPath.set(item.url, item.title);
  }
  for (const sub of item.items ?? []) {
    if (!navTitleByPath.has(sub.url)) {
      navTitleByPath.set(sub.url, sub.title);
    }
  }
}

// Mongo ObjectIds / UUIDs read as noise — label the crumb generically instead.
const looksLikeId = (segment: string) => /^[0-9a-f-]{16,}$/i.test(segment);

/** Title-case a URL segment: "purchase-orders" → "Purchase Orders". */
const humanize = (segment: string) =>
  segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * Breadcrumb trail for the current route.
 *
 * Crumbs are **translated** through `useNavLabels`, the same mapping the sidebar
 * and kbar use, so a route reads identically wherever it appears. This used to
 * render `navItem.title` raw, which meant the whole trail stayed English in
 * every locale — the nav constants keep English titles as identity (keys,
 * filtering, kbar keywords), so they are never display strings.
 *
 * A segment with no nav entry (a detail page, a sub-route) falls back to the
 * humanized slug, still looked up under `layout.nav.items.*` first so it can be
 * translated by adding a key rather than a nav item.
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const { itemLabel } = useNavLabels();
  const t = useTranslations('layout.nav');

  return useMemo(() => {
    const titleFor = (path: string, segment: string): string => {
      const navTitle = navTitleByPath.get(path);
      if (navTitle) return itemLabel(navTitle);
      if (looksLikeId(segment)) {
        return t.has('items.details') ? t('items.details') : 'Details';
      }
      return itemLabel(humanize(segment));
    };

    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      const item: BreadcrumbItem = { title: titleFor(path, segment) };
      if (!NON_ROUTABLE_PATHS.has(path)) item.link = path;
      return item;
    });
  }, [pathname, itemLabel, t]);
}
