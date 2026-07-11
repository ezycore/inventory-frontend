// coding-standard: maintained
import { Noto_Sans_Bengali } from "next/font/google";
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

// Self-hosted variable font; unicode-range subsetting means the font files are
// only fetched when Bengali glyphs actually render.
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-bengali",
  display: "swap",
});

export const metadata = {
  title: `${BRAND.name} - Inventory Management System`,
  description: "Modern inventory management system for businesses",
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

  return (
    <html lang={locale} suppressHydrationWarning className={notoSansBengali.variable}>
      <body
        className="font-sans antialiased"
        style={
          locale === "bn"
            ? { fontFamily: "var(--font-bengali), ui-sans-serif, system-ui, sans-serif" }
            : undefined
        }
      >
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
      </body>
    </html>
  );
}
