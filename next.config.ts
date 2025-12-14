import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.opensymbols.org",
      },
      {
        protocol: "https",
        hostname: "d18vdu4p71yber.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
      },
      {
        protocol: "http",
        hostname: "**.arasaac.org",
      },
      {
        protocol: "https",
        hostname: "**.arasaac.org",
      },
    ],
  },
};

export default nextConfig;
