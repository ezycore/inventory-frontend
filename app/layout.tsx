import { AuthHydration } from "@/components/auth-hydration";
import ThemeProvider from "@/components/layout/ThemeToggle/theme-provider";
import QueryProvider from "@/components/providers/query-provider";
import Toaster from "@/components/providers/toaster";
import { WorkspaceGateScreen } from "@/components/workspace-gate-screen";
import { BRAND } from "@/constants/brand";
import { resolveWorkspaceGate } from "@/lib/workspace-status";
import "@ui/styles/globals.css";

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

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthHydration />
            {gate.kind === "ok" ? (
              children
            ) : (
              <WorkspaceGateScreen kind={gate.kind} host={gate.host} />
            )}
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
