import type { NextConfig } from "next";

const remotePatterns = [] as NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>;

if (process.env.B2_ENDPOINT && process.env.B2_BUCKET) {
  const endpoint = new URL(process.env.B2_ENDPOINT);
  remotePatterns.push({
    protocol: "https",
    hostname: endpoint.hostname,
    port: endpoint.port,
    pathname: `/${process.env.B2_BUCKET}/**`,
  });
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns,
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
