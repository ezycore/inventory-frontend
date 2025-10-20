
import '@ui/styles/globals.css';
import AppSidebar from "@/components/layout/app-sidebar"
import { getCookie } from "cookies-next"
import Header from "@/components/layout/header"
import KBar from "@/components/kbar"
import ThemeProvider from "@/components/layout/ThemeToggle/theme-provider"
import QueryProvider from "@/components/providers/query-provider"
import Toaster from "@/components/providers/toaster"
import { SidebarProvider, SidebarInset } from "@ui/components/sidebar"


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans antialiased `}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <KBar>
              <SidebarProvider defaultOpen={defaultOpen}>
                <AppSidebar />
                <SidebarInset>
                  <Header />
                  {/* page main content */}
                  {children}
                  {/* page main content ends */}
                </SidebarInset>
              </SidebarProvider>
            </KBar>
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
