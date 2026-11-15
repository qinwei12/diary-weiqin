import type { NextConfig } from "next";

const remotePatterns = [] as NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>;

if (process.env.OBJECT_STORAGE_ENDPOINT && process.env.OBJECT_STORAGE_BUCKET) {
  const endpoint = new URL(process.env.OBJECT_STORAGE_ENDPOINT);
  remotePatterns.push({
    protocol: "https",
    hostname: endpoint.hostname,
    port: endpoint.port,
    pathname: `/${process.env.OBJECT_STORAGE_BUCKET}/**`,
  });
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // The diary image proxy validates `key` before redirecting to private storage.
    localPatterns: [
      { pathname: "/api/media" },
      { pathname: "/images/**", search: "" },
      { pathname: "/uploads/**", search: "" },
    ],
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
