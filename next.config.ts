import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // razorpay uses CommonJS — mark as external for server components
  serverExternalPackages: ['razorpay'],
}

export default nextConfig
