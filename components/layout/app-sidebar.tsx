"use client";
// coding-standard: maintained
import { UserAvatarProfile } from "@/components/user-avatar-profile";
import { navGroups } from "@/constants/navItem";
import { useLogout } from "@/hooks";
import { useCanManageBilling } from "@/hooks/use-has-permission";
import { filterNavItems, navLinkTarget } from "@/lib/nav-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@ui/components/sidebar";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CreditCardIcon,
  HelpCircleIcon,
  LogOutIcon,
  UserCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useNavLabels } from "@/hooks/use-nav-labels";
import { NavIcon } from "@/components/shared/nav-icon";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { AppTitle } from "./app-title";
import type { NavItem } from "@/types/layout";

/**
 * Dismisses the mobile sidebar. On mobile the sidebar renders as an overlay
 * sheet and a client-side navigation swaps the page *behind* it, so every nav
 * click has to close it explicitly or the user never sees where they landed.
 * A no-op on desktop, where `openMobile` is not read. Mirrors `AppTitle`.
 */
function useCloseMobileNav() {
  const { setOpenMobile } = useSidebar();
  return React.useCallback(() => setOpenMobile(false), [setOpenMobile]);
}

/**
 * Renders a parent nav item with sub-items. When the sidebar is expanded we
 * use the standard inline Collapsible; when collapsed to icon-only we render
 * a hover/click DropdownMenu so nested items remain reachable.
 */
function NestedNavItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const { state, isMobile } = useSidebar();
  const closeMobileNav = useCloseMobileNav();
  const { itemLabel } = useNavLabels();
  const isCollapsed = state === "collapsed" && !isMobile;
  const subItems = item.items || [];
  const isParentActive =
    pathname === item.url || subItems.some((s) => pathname === s.url);

  if (isCollapsed) {
    // Icon-only mode: show a dropdown to the right with the nested items.
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={itemLabel(item.title)}
              isActive={isParentActive}
            >
              {item.icon && <NavIcon name={item.icon} />}
              <span>{itemLabel(item.title)}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={4}
            className="min-w-48"
          >
            <DropdownMenuLabel>{itemLabel(item.title)}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {subItems.map((subItem) => (
              <DropdownMenuItem key={subItem.title} asChild>
                <Link
                  href={subItem.url}
                  {...navLinkTarget(subItem)}
                  data-active={pathname === subItem.url}
                  className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                >
                  {itemLabel(subItem.title)}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      asChild
      defaultOpen={item.isActive || isParentActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={itemLabel(item.title)}
            isActive={pathname === item.url}
          >
            {item.icon && <NavIcon name={item.icon} />}
            <span>{itemLabel(item.title)}</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {subItems.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === subItem.url}
                >
                  <Link href={subItem.url} {...navLinkTarget(subItem)} onClick={closeMobileNav}>
                    <span>{itemLabel(subItem.title)}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { features } = user?.organization || {};
  const logout = useLogout();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const canManageBilling = useCanManageBilling();
  const tUserMenu = useTranslations("layout.userMenu");
  const { itemLabel, groupLabel } = useNavLabels();
  const closeMobileNav = useCloseMobileNav();
  // Same permission the page itself enforces — staff who cannot configure the
  // org get no entry rather than an entry that redirects them away.
  const canCustomizeWorkspace =
    user?.permissions?.includes("organization.edit") ?? false;

  // The footer menu navigates imperatively, so it closes the mobile sheet the
  // same way the nav links do — see `useCloseMobileNav`.
  const navigate = React.useCallback(
    (url: string) => {
      closeMobileNav();
      router.push(url);
    },
    [closeMobileNav, router],
  );

  // Filter each group's items based on user role, permissions, and features;
  // drop groups left empty by the filtering.
  const filteredNavGroups = React.useMemo(() => {
    if (!user?.role) return navGroups;

    return navGroups
      .map((group) => ({
        ...group,
        items: filterNavItems(
          group.items,
          user.role,
          user.permissions || [],
          features,
          !!user.organization?.posUsedAt,
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [user, features]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <AppTitle />
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        {filteredNavGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {/* An empty group label renders no heading — `SidebarGroupLabel` is a
                fixed-height row, so an empty one would leave a blank gap. */}
            {group.label && (
              <SidebarGroupLabel>{groupLabel(group.label)}</SidebarGroupLabel>
            )}
            <SidebarMenu>
              {group.items.map((item) => {
                return item?.items && item?.items?.length > 0 ? (
                  <NestedNavItem
                    key={item.title}
                    item={item}
                    pathname={pathname}
                  />
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={itemLabel(item.title)}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url} {...navLinkTarget(item)} onClick={closeMobileNav}>
                        <NavIcon name={item.icon} />
                        <span>{itemLabel(item.title)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {isAuthenticated && user && (
        <SidebarFooter>
          <SidebarMenu>
            {/* The way back from every hidden feature, so it is permanently
                visible rather than filed under Settings. Hiding is only safe
                when unhiding is obvious — a merchant who turned the online
                store off during setup has to be able to find it again without
                knowing what we called the page
                (docs/plan/onboarding-workspace.md §7). */}
            {canCustomizeWorkspace && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={itemLabel("Customize workspace")}
                  isActive={pathname === "/settings/features"}
                >
                  <Link href="/settings/features">
                    <NavIcon name="sliders-horizontal" />
                    <span>{itemLabel("Customize workspace")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <UserAvatarProfile
                      className="h-8 w-8 rounded-lg"
                      showInfo
                      user={user}
                    />
                    <ChevronDownIcon className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="px-1 py-1.5">
                      <UserAvatarProfile
                        className="h-8 w-8 rounded-lg"
                        showInfo
                        user={user}
                      />
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <UserCircleIcon className="mr-2 h-4 w-4" />
                      {tUserMenu("profile")}
                    </DropdownMenuItem>
                    {/* Billing lives here, not under Settings — one entry, one place.
                        Gated by `useCanManageBilling` (the page's own gate), so the
                        owner keeps access even if their role loses `organization.edit`. */}
                    {canManageBilling && (
                      <DropdownMenuItem
                        onClick={() => navigate("/dashboard/billing")}
                      >
                        <CreditCardIcon className="mr-2 h-4 w-4" />
                        {tUserMenu("billing")}
                      </DropdownMenuItem>
                    )}
                    {/* This slot gives the help guides their only route into `/help`; the
                        header's "?" only ever opens the guide for the current screen. */}
                    <DropdownMenuItem onClick={() => navigate("/help")}>
                      <HelpCircleIcon className="mr-2 h-4 w-4" />
                      {tUserMenu("help")}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    {tUserMenu("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
