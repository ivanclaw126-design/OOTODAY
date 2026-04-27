import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production' || process.env.NEXT_IMAGE_ALLOW_LOCAL_IP === '1',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**'
      }
    ]
  },
  turbopack: {
    root: __dirname
  }
}

export default nextConfig
