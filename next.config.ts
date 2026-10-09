import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // razorpay uses CommonJS
  serverExternalPackages: ['razorpay'],
  experimental: {
    staleTimes: {
      dynamic: 300,
      static: 1800,
    },
  },
}

export default nextConfig
