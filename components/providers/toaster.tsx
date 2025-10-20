'use client'

import { Toaster as SonnerToaster } from 'sonner'
import { useTheme } from 'next-themes'

export default function Toaster() {
  const { theme } = useTheme()

  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark' | 'system'}
      className="toaster group pointer-events-auto"
      position="bottom-right"
      richColors
      expand={true}
      visibleToasts={4}
      closeButton
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
        className: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        actionButtonStyle: {
          background: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        },
        cancelButtonStyle: {
          background: 'hsl(var(--muted))',
          color: 'hsl(var(--muted-foreground))',
        },
      }}
    />
  )
}
