import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Keep local API proxy only for development.
    if (process.env.NODE_ENV === "production") {
      return [];
    }
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:8000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
