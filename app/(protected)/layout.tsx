"use client";

import KBar from "@/components/kbar";
import AppSidebar from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import { hasActiveSubscription } from "@/lib/subscription-utils";
import { useGetSubscription, useMe } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { SidebarInset, SidebarProvider } from "@ui/components/sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { getCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const verifyMe = useMe();
  const subscription = useGetSubscription();
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const subscriptionLogoutHandled = useRef(false);

  // Use consistent default for SSR, then update after mount
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const forceLogoutForSubscription = useCallback(() => {
    if (subscriptionLogoutHandled.current) return;
    subscriptionLogoutHandled.current = true;

    toast.error("No active subscription found.");
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

    if (!hasActiveSubscription(subscription.data.entitlement)) {
      forceLogoutForSubscription();
    }
  }, [forceLogoutForSubscription, subscription.data]);

  useEffect(() => {
    if (!subscription.isError) return;

    if (isSubscriptionAccessError(subscription.error)) {
      forceLogoutForSubscription();
    }
  }, [
    forceLogoutForSubscription,
    subscription.error,
    subscription.isError,
  ]);

  return (
    <KBar>
      <SidebarProvider
        defaultOpen={sidebarOpen}
        open={isMounted ? sidebarOpen : undefined}
        onOpenChange={isMounted ? setSidebarOpen : undefined}
      >
        <AppSidebar />
        <SidebarInset>
          <Header />
          <div className="min-h-screen">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
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
