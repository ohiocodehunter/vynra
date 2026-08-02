import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/:path*` : 'http://localhost:5001/api/:path*'
      },
      {
        source: '/uploads/:path*',
        destination: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/uploads/:path*` : 'http://localhost:5001/uploads/:path*'
      }
    ]
  }
};

export default nextConfig;
