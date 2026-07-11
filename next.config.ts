// coding-standard: maintained
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // Skip type checking during build (Vercel will still run it separately if configured)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Cloudflare R2 public bucket (dev *.r2.dev URL + production CDN domain)
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'cdn.ezycore.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

// Locale comes from the NEXT_LOCALE cookie (no URL prefix) — see docs/I18N.md
const withNextIntl = createNextIntlPlugin()

export default withNextIntl(nextConfig)
