import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // serverActions is stable in 15, but keep clean
  },
};

export default nextConfig;
