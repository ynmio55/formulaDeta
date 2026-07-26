import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/_app/:path*',
        destination: 'https://ppv.st/_app/:path*',
      }
    ];
  },
};

export default nextConfig;
