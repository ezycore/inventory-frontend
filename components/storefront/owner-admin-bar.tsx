"use client";
// coding-standard: maintained

import { useRef } from "react";
import Link from "next/link";
import { Eye, LayoutDashboard, Paintbrush } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useStoreContext } from "@/services/storefront/store-context";
import { useOwnerbarHeight } from "@/components/storefront/use-ownerbar-height";

/**
 * Slim owner overlay (Shopify/WordPress style) shown ONLY when a logged-in staff
 * member views their own store — i.e. their `organization.slug` matches the
 * active store slug. Shoppers and other merchants never see it.
 *
 * Deliberately client-only and post-hydration:
 *   - It renders `null` on the server and during the first client render, so the
 *     anonymous SSR HTML (and any cache derived from it) is byte-identical for
 *     every visitor — the bar is layered on afterwards, never baked in.
 *   - The staff session lives in client state (Zustand `easystock-auth` +
 *     `auth-token` cookie); we never read it on the server, so storefront
 *     rendering stays public/cacheable.
 *   - Hidden inside an iframe (`window.top !== window.self`) so it doesn't appear
 *     in the admin Customize editor's live-preview embed.
 *
 * On a tenant subdomain admin + store share one origin, so the links navigate
 * same-origin (`/ecommerce/customize`, `/dashboard`).
 */
export function OwnerAdminBar() {
  const hydrated = useHydrated();
  const { slug } = useStoreContext();
  const orgSlug = useAuthStore((s) => s.user?.organization?.slug);
  const orgName = useAuthStore((s) => s.user?.organization?.name);
  const ref = useRef<HTMLDivElement>(null);
  const active =
    hydrated &&
    typeof window !== "undefined" &&
    window.top === window.self &&
    !!orgSlug &&
    orgSlug === slug;
  useOwnerbarHeight(ref, active);

  // Until hydrated, render nothing so SSR output stays identical for everyone.
  if (!hydrated) return null;
  // Don't show inside the admin Customize editor's live-preview iframe.
  if (window.top !== window.self) return null;
  // Only the staff of THIS store see the bar.
  if (!orgSlug || orgSlug !== slug) return null;

  return (
    // Sits just above the mobile bottom nav (var is 0 on desktop) so the owner
    // never sees two stacked bottom bars.
    <div
      ref={ref}
      className="sf-owner-bar sf-noprint sticky z-50 border-t border-neutral-700 bg-neutral-900 text-white"
      style={{ bottom: "var(--sf-bottom-nav-h, 0px)" }}
    >
      <div className="sf-owner-bar-inner mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Eye className="h-4 w-4 text-emerald-400" />
          Owner preview
          {orgName ? (
            <span className="sf-owner-name font-normal text-neutral-400">
              · {orgName}
            </span>
          ) : null}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <Link
            href="/ecommerce/customize"
            className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 font-medium hover:bg-white/20"
          >
            <Paintbrush className="h-4 w-4" />
            Customize
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-neutral-300 hover:bg-white/10 hover:text-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="sf-owner-admin-label">Back to admin</span>
          </Link>
        </span>
      </div>
    </div>
  );
}
