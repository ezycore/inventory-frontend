import { AuthHydration } from "@/components/auth-hydration";
import ThemeProvider from "@/components/layout/ThemeToggle/theme-provider";
import QueryProvider from "@/components/providers/query-provider";
import Toaster from "@/components/providers/toaster";
import "@ui/styles/globals.css";

export const metadata = {
  title: "EasyStock - Inventory Management System",
  description: "Modern inventory management system for businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            {children}
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
