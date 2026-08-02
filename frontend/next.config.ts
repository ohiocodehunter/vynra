import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/:path*` : 'http://localhost:5001/api/:path*'
      },
      {
        source: '/uploads/:path*',
        // We strip /api from NEXT_PUBLIC_API_URL to get the base url for uploads, or just fallback to localhost
        destination: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL.replace('/api', '')}/uploads/:path*` : 'http://localhost:5001/uploads/:path*'
      }
    ]
  }
};

export default nextConfig;
