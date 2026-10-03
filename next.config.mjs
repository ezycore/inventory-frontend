// coding-standard: maintained
import createNextIntlPlugin from 'next-intl/plugin'
import createBundleAnalyzer from '@next/bundle-analyzer'
import { readFileSync } from 'node:fs'

// The release is package.json's, read at build so it can never disagree with
// the CHANGELOG. NEXT_PUBLIC_GIT_SHA comes in as a Docker build arg instead.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // Next's file tracer otherwise copies the TypeScript compiler (~19 MB) into
  // the standalone output. It's a build/dev-only tool — the production server
  // never compiles TS — so drop it from the runtime bundle.
  outputFileTracingExcludes: {
    '*': ['**/node_modules/typescript/**'],
  },
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

// Emits treemap reports to .next/analyze/*.html when ANALYZE=true (pnpm analyze).
const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})

export default withBundleAnalyzer(withNextIntl(nextConfig))
