"use client";
// coding-standard: maintained

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@ui/components/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { BRAND } from "@/constants/brand";
import { logoImageUrl } from "@/lib/storefront-image";
import { useAuthStore } from "@/services/stores/use-auth-store";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function AppTitle() {
  const { setOpenMobile } = useSidebar();
  const t = useTranslations("layout.brand");
  const user = useAuthStore((state) => state.user);

  const orgName = user?.organization?.name || BRAND.name;
  // `logoImageUrl`, never the thumbnail: that variant is a 200×200 centre crop,
  // so a wide wordmark rendered here as an unreadable slice of its own middle.
  const logoUrl = logoImageUrl(user?.organization?.logo) ?? null;

  // Deterministic initials for the fallback tile (max 2 chars).
  const initials = orgName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="gap-2 hover:bg-transparent active:bg-transparent"
          asChild
        >
          <Link
            href="/"
            onClick={() => setOpenMobile(false)}
            className="flex items-center gap-2 overflow-hidden"
          >
            <Avatar className="h-8 w-8 shrink-0 rounded-md">
              {logoUrl ? (
                <AvatarImage
                  key={logoUrl}
                  src={logoUrl}
                  alt={orgName}
                  className="object-contain bg-muted"
                />
              ) : null}
              <AvatarFallback className="rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                {initials || "ES"}
              </AvatarFallback>
            </Avatar>
            {/* Hidden when sidebar collapses to icon mode so nothing overflows */}
            <div className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-bold">{orgName}</span>
              {/* The workspace runs under the merchant's own name above, so
                  this second line is the platform's signature — it says what
                  the product does, not who they are. */}
              <span className="truncate text-xs text-muted-foreground">
                {t("tagline")}
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
