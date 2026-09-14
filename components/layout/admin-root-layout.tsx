// coding-standard: maintained
import type { ReactNode } from "react";
import { Noto_Sans_Bengali, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { AuthHydration } from "@/components/auth-hydration";
import { LocaleSync } from "@/components/locale-sync";
import ThemeProvider from "@/components/layout/ThemeToggle/theme-provider";
import QueryProvider from "@/components/providers/query-provider";
import Toaster from "@/components/providers/toaster";
import { WorkspaceGateScreen } from "@/components/workspace-gate-screen";
import { resolveWorkspaceGate } from "@/lib/workspace-status";
import "@ui/styles/globals.css";
import { cn } from "@ui/lib/utils";
import { TooltipProvider } from "@ui/components/tooltip";

// Latin UI font — backs `--font-sans`, which `@theme inline` in globals.css
// maps onto the `font-sans` utility.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Self-hosted variable font; unicode-range subsetting means the font files are
// only fetched when Bengali glyphs actually render.
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-bengali",
  display: "swap",
});

/**
 * Metadata every admin root layout spreads into its own `metadata` export.
 * `metadata` must be exported by a layout file, so the shared part lives here.
 *
 * NOTE: deliberately NO `title` here, for the same reason as `icons` below —
 * Next re-asserts root metadata on every router-integrated navigation, so a
 * title here flashed BRAND.documentTitle on every sidebar click before
 * useOrgDocumentTitle could rewrite it. Each tree owns its own <title>:
 * (auth) via its own metadata, (protected) via a raw <title> in
 * `ProtectedShell`'s JSX that React hoists, and the storefront via per-page
 * generateMetadata.
 *
 * NOTE: deliberately NO `icons` here. The default favicon answers the
 * browser's implicit /favicon.ico request via `app/favicon.ico/route.ts` — a
 * Route Handler, not a file convention, so Next still does NOT manage a
 * <link> in the <head>. Both the storefront (store favicon) and the admin app
 * (org logo) then swap the tab icon in client-side via useFaviconOverride
 * (hooks/use-favicon-override).
 *
 * Why not `metadata.icons`: Next owns that <link>, duplicates it on hydration,
 * and RE-ASSERTS it on every client navigation — so the hook's in-place swap
 * lost to a stale /icon.png, causing the "default → logo" blink on each nav
 * (and the wrong icon after reload). With no metadata icon, the hook owns the
 * only <link rel="icon"> and nothing fights it. File-convention icons
 * (app/icon.*, a static app/favicon.ico) would re-introduce a Next-managed
 * link — the route handler deliberately is not one.
 */
export const adminRootMetadata = {
  description: "Modern inventory management system for businesses",
};

/**
 * The `<html>` document for the admin app — shared by the `(auth)` and
 * `(protected)` root layouts.
 *
 * **Why there is no `app/layout.tsx`.** The app has two root layouts: this one,
 * and the storefront's own (`app/(storefront)/layout.tsx`). Until 2026-09-14 one
 * root layout wrapped both, which cost every shopper twice:
 *  - the admin's 312 KB stylesheet (`globals.css`) was render-blocking on every
 *    shop page — Lighthouse charged it ~920 ms of a phone's first paint;
 *  - `resolveWorkspaceGate()` reads `headers()` and next-intl reads the locale
 *    cookie, which forces every route beneath into dynamic rendering, so no shop
 *    page could ever be served from the HTML cache.
 * Navigating between the two trees is a full page load, which is fine: they live
 * on different hosts, or at least on different path spaces of one host.
 */
export async function AdminRootLayout({ children }: { children: ReactNode }) {
  // Server-side workspace gate: renders the correct page in the initial HTML, so an
  // unknown/disabled subdomain never flashes the app first (see lib/workspace-status.ts).
  const gate = await resolveWorkspaceGate();

  // Locale comes from the NEXT_LOCALE cookie via i18n/request.ts (docs/I18N.md),
  // so the first paint is already in the user's language — no flash.
  const locale = await getLocale();
  const messages = await getMessages();

  // Both font variables must live on <html>: the body's `bn` branch below
  // resolves --font-bengali, and everything else falls through to --font-sans.
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn("font-sans", inter.variable, notoSansBengali.variable)}
    >
      <body
        className="font-sans antialiased"
        style={
          locale === "bn"
            ? { fontFamily: "var(--font-bengali), ui-sans-serif, system-ui, sans-serif" }
            : undefined
        }
      >
        <TooltipProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <AuthHydration />
                <LocaleSync />
                {gate.kind === "ok" ? (
                  children
                ) : (
                  <WorkspaceGateScreen kind={gate.kind} host={gate.host} />
                )}
                <Toaster />
              </ThemeProvider>
            </QueryProvider>
          </NextIntlClientProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
