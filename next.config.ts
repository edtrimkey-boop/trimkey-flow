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
  async headers() {
    return [
      {
        source: '/checkout/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.trimkey.in http://localhost:* *;",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
}

export default nextConfig
