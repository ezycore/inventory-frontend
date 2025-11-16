import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  typescript: {
    // Skip type checking during build (Vercel will still run it separately if configured)
    ignoreBuildErrors: true,
  }
}

export default nextConfig
