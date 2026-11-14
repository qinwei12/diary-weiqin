import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: process.env.UPYUN_PUBLIC_BASE_URL
      ? (() => {
          const imageOrigin = new URL(process.env.UPYUN_PUBLIC_BASE_URL);
          return [{
            protocol: "https" as const,
            hostname: imageOrigin.hostname,
            port: imageOrigin.port,
            pathname: `${imageOrigin.pathname.replace(/\/$/, "")}/diary/**`,
            search: "",
          }];
        })()
      : [],
  },
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
