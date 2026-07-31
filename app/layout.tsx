// coding-standard: maintained
import { Noto_Sans_Bengali, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { AuthHydration } from "@/components/auth-hydration";
import { LocaleSync } from "@/components/locale-sync";
import ThemeProvider from "@/components/layout/ThemeToggle/theme-provider";
import QueryProvider from "@/components/providers/query-provider";
import Toaster from "@/components/providers/toaster";
import { WorkspaceGateScreen } from "@/components/workspace-gate-screen";
import { BRAND } from "@/constants/brand";
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

export const metadata = {
  // NOTE: deliberately NO `title` here, for the same reason as `icons` below —
  // Next re-asserts root metadata on every router-integrated navigation, so a
  // title here flashed BRAND.documentTitle on every sidebar click before
  // useOrgDocumentTitle could rewrite it. Each tree now owns its own <title>:
  // (auth) via its own metadata, (protected) via a raw <title> in the layout
  // JSX that React hoists, and the storefront via per-page generateMetadata.
  description: "Modern inventory management system for businesses",
  // NOTE: deliberately NO `icons` here. The default favicon is served as the
  // static file `public/favicon.ico` (the browser's implicit request), which
  // Next does NOT manage in the <head>. Both the storefront (store logo) and
  // the admin app (org logo) then swap the tab icon in client-side via
  // useFaviconOverride (hooks/use-favicon-override).
  //
  // Why not `metadata.icons`: Next owns that <link>, duplicates it on hydration,
  // and RE-ASSERTS it on every client navigation — so the hook's in-place swap
  // lost to a stale /icon.png, causing the "default → logo" blink on each nav
  // (and the wrong icon after reload). With no metadata icon, the hook owns the
  // only <link rel="icon"> and nothing fights it. File-convention icons
  // (app/icon.*, app/favicon.ico) would re-introduce a Next-managed link — keep
  // the default in /public instead.
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
