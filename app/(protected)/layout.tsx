"use client";
// coding-standard: maintained

import KBar from "@/components/kbar";
import AppSidebar from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import { BillingAlertBanner } from "@/components/shared/billing-alert-banner";
import { DemoBanner } from "@/components/shared/demo-banner";
import {
  needsReactivation,
  shouldBlockWorkspaceAccess,
} from "@/lib/subscription-utils";
import { useGetSubscription, useMe } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useOrgDocumentTitle } from "@/hooks/use-org-document-title";
import { useOrgFavicon } from "@/hooks/use-org-favicon";
import { SidebarInset, SidebarProvider } from "@ui/components/sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { getCookie } from "cookies-next";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BRAND } from "@/constants/brand";

/**
 * The workspace's own <title>, which React 19 hoists into <head>.
 *
 * Raw element rather than route metadata, exactly like the storefront's tab icon
 * (see app/(storefront)/shop/layout.tsx): Next re-asserts metadata on every
 * router-integrated navigation, so a metadata title here would overwrite
 * `useOrgDocumentTitle` on every sidebar click and flash the platform default.
 *
 * The value is CONSTANT on purpose. React only touches the DOM when a rendered
 * value changes, so rendering the same string forever means React writes this
 * once and then never fights the hook, which rewrites the text to
 * "<Page> · <Org>" client-side. It ships in the SSR HTML so the pre-hydration
 * tab shows the product name rather than the raw URL.
 *
 * Rendered from both return branches below — SSR takes the `!hydrated` one, so
 * omitting it there would mean no title in the server HTML at all.
 */
const workspaceTitle = <title>{BRAND.documentTitle}</title>;

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const verifyMe = useMe();
  const subscription = useGetSubscription();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const subscriptionLogoutHandled = useRef(false);

  // Browser tab = the organization's identity: its logo as the icon, and
  // "<Page> · <Org>" as the title (both client-side — see each hook).
  useOrgFavicon();
  useOrgDocumentTitle();

  // Use consistent default for SSR, then update after mount
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const forceLogoutForSubscription = useCallback(() => {
    if (subscriptionLogoutHandled.current) return;
    subscriptionLogoutHandled.current = true;

    toast.error("Your subscription is inactive. Please renew to continue.");
    clearAuth();
    queryClient.clear();
    router.replace("/login?subscription=inactive");
  }, [clearAuth, queryClient, router]);

  useEffect(() => {
    // Read cookie only after component mounts to avoid hydration mismatch
    const cookieValue = getCookie("sidebar_state");
    if (cookieValue === "false") {
      setSidebarOpen(false);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    verifyMe.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run once on mount
  }, []);

  useEffect(() => {
    if (!subscription.data) return;

    // Only hard-block terminated subscriptions. A past_due/read-only workspace
    // keeps read access and sees <BillingAlertBanner> instead of a logout.
    if (shouldBlockWorkspaceAccess(subscription.data.entitlement)) {
      forceLogoutForSubscription();
      return;
    }

    // Canceled workspaces are let in but confined to billing (the backend 403s
    // every other route). Route them there so they land on a working page, not a
    // wall of failed requests.
    if (
      needsReactivation(subscription.data.entitlement) &&
      pathname !== "/dashboard/billing"
    ) {
      router.replace("/dashboard/billing");
    }
  }, [forceLogoutForSubscription, subscription.data, pathname, router]);

  useEffect(() => {
    if (!subscription.isError) return;

    if (isSubscriptionAccessError(subscription.error)) {
      forceLogoutForSubscription();
    }
  }, [forceLogoutForSubscription, subscription.error, subscription.isError]);

  // The org/user identity lives in the persisted auth store, which the server
  // can't read — SSR HTML would show brand defaults that visibly "blink" into
  // the real organization after hydration. Hold the shell behind a neutral
  // splash until the client store is available (one frame; localStorage
  // rehydrates synchronously), so the first thing painted is correct.
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <>
        {workspaceTitle}
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      {workspaceTitle}
      <KBar>
        <SidebarProvider
          defaultOpen={sidebarOpen}
          open={isMounted ? sidebarOpen : undefined}
          onOpenChange={isMounted ? setSidebarOpen : undefined}
        >
          <AppSidebar />
          <SidebarInset>
            <BillingAlertBanner />
            <DemoBanner />
            <Header />
            <div className="min-h-screen">
              {/* Not `container`: its max-widths are keyed to the VIEWPORT, so inside
                  an inset that is one sidebar narrower they never bind — it was a
                  no-op that read like a constraint. 96rem is the cap `container`
                  actually reached, so the rendered width is unchanged. */}
              <div className="mx-auto w-full max-w-[96rem] p-4 sm:p-6">
                {children}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </KBar>
    </>
  );
}

function isSubscriptionAccessError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    status?: number;
    statusCode?: number;
    message?: string;
    error?: string;
  };
  const status = candidate.status ?? candidate.statusCode;
  const message = `${candidate.message ?? ""} ${candidate.error ?? ""}`.toLowerCase();

  if (status === 402) return true;
  if (status !== 403 && status !== 404) return false;

  return (
    message.includes("subscription") ||
    message.includes("entitlement") ||
    message.includes("plan")
  );
}
