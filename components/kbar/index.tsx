'use client';
// coding-standard: maintained

import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch
} from 'kbar';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import RenderResults from './render-result';
import useThemeSwitching from './use-theme-switching';
import { navItems } from '@/constants/navItem';
import { useNavLabels } from '@/hooks/use-nav-labels';
import { filterNavItems } from '@/lib/nav-utils';
import { useAuthStore } from '@/services/stores/use-auth-store';
import type { NavItem } from '@/types/layout';

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { itemLabel } = useNavLabels();
  const tKbar = useTranslations('layout.kbar');

  // These actions are for navigation — same role/permission/feature filtering
  // as the sidebar, so search can't reach pages the user can't see.
  const actions = useMemo(() => {
    const visibleItems = user?.role
      ? filterNavItems(
          navItems,
          user.role,
          user.permissions || [],
          user.organization?.features,
          !!user.organization?.posUsedAt,
        )
      : navItems;

    const navigateTo = (item: NavItem) => {
      if (item.openInNewTab) window.open(item.url, '_blank', 'noopener,noreferrer');
      else router.push(item.url);
    };

    return visibleItems.flatMap((navItem) => {
      // Only include base action if the navItem has a real URL and is not just a container
      // English title stays in keywords alongside the translated one, so
      // search matches in either language.
      const baseAction =
        navItem.url !== '#'
          ? {
              id: `nav-${navItem.url}`,
              name: itemLabel(navItem.title),
              shortcut: navItem.shortcut,
              keywords: `${navItem.title.toLowerCase()} ${itemLabel(navItem.title).toLowerCase()}`,
              section: tKbar('navigation'),
              subtitle: tKbar('goTo', { title: itemLabel(navItem.title) }),
              perform: () => navigateTo(navItem)
            }
          : null;

      // Map child items into actions
      const childActions =
        navItem.items?.map((childItem) => ({
          id: `nav-${childItem.url}`,
          name: itemLabel(childItem.title),
          shortcut: childItem.shortcut,
          keywords: `${childItem.title.toLowerCase()} ${itemLabel(childItem.title).toLowerCase()}`,
          section: itemLabel(navItem.title),
          subtitle: tKbar('goTo', { title: itemLabel(childItem.title) }),
          perform: () => navigateTo(childItem)
        })) ?? [];

      // Return only valid actions (ignoring null base actions for containers)
      return baseAction ? [baseAction, ...childActions] : childActions;
    });
  }, [router, user, itemLabel, tKbar]);

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({ children }: { children: React.ReactNode }) => {
  useThemeSwitching();

  return (
    <>
      <KBarPortal>
        <KBarPositioner className='bg-background/80 fixed inset-0 z-99999 p-0! backdrop-blur-sm'>
          <KBarAnimator className='bg-card text-card-foreground relative mt-64! w-full max-w-[600px] -translate-y-12! overflow-hidden rounded-lg border shadow-lg'>
            <div className='bg-card border-border sticky top-0 z-10 border-b'>
              <KBarSearch className='bg-card w-full border-none px-6 py-4 text-lg outline-hidden focus:ring-0 focus:ring-offset-0 focus:outline-hidden' />
            </div>
            <div className='max-h-[400px]'>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
