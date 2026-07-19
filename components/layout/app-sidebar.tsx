"use client";
// coding-standard: maintained
import { UserAvatarProfile } from "@/components/user-avatar-profile";
import { navGroups } from "@/constants/navItem";
import { useLogout } from "@/hooks";
import { filterNavItems } from "@/lib/nav-utils";
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
  SidebarRail,
  useSidebar,
} from "@ui/components/sidebar";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  LogOutIcon,
  UserCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useNavLabels } from "@/hooks/use-nav-labels";
import { DynamicIcon } from "lucide-react/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { AppTitle } from "./app-title";
import type { NavItem } from "@/types/layout";

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
              {item.icon && <DynamicIcon name={item.icon as any} />}
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
            {item.icon && <DynamicIcon name={item.icon as any} />}
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
                  <Link href={subItem.url}>
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
  const tUserMenu = useTranslations("layout.userMenu");
  const { itemLabel, groupLabel } = useNavLabels();

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
            <SidebarGroupLabel>{groupLabel(group.label)}</SidebarGroupLabel>
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
                      <Link href={item.url}>
                        <DynamicIcon name={item.icon as any} />
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
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <UserCircleIcon className="mr-2 h-4 w-4" />
                      {tUserMenu("profile")}
                    </DropdownMenuItem>
                    {/* Billing lives in Settings → Billing, not here — one entry, one place.
                        This slot gives the help guides their only route into `/help`; the
                        header's "?" only ever opens the guide for the current screen. */}
                    <DropdownMenuItem onClick={() => router.push("/help")}>
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
      <SidebarRail />
    </Sidebar>
  );
}
