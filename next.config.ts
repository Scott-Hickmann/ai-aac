import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.arasaac.org",
      },
      {
        protocol: "https",
        hostname: "api.arasaac.org",
      },
    ],
  },
};

export default nextConfig;
