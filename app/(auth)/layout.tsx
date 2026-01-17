import React, { Suspense } from 'react'
import '@ui/styles/globals.css'
import ThemeProvider from '@/components/layout/ThemeToggle/theme-provider'
import QueryProvider from '@/components/providers/query-provider'
import Toaster from '@/components/providers/toaster'
import { Spinner } from '@/ui/components/spinner'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
            <Suspense fallback={<Spinner className="m-auto mt-20" />}>
                {children}
            </Suspense>
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
