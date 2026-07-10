'use client';
// coding-standard: maintained

import { navItems } from '@/constants/navItem';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

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

function titleFor(path: string, segment: string): string {
  const navTitle = navTitleByPath.get(path);
  if (navTitle) return navTitle;
  if (looksLikeId(segment)) return 'Details';
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      const item: BreadcrumbItem = { title: titleFor(path, segment) };
      if (!NON_ROUTABLE_PATHS.has(path)) item.link = path;
      return item;
    });
  }, [pathname]);
}
