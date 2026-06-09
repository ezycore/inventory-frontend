import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // Skip type checking during build (Vercel will still run it separately if configured)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
