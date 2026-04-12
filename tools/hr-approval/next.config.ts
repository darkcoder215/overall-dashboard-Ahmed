import type { NextConfig } from "next";

// NEXT_EXPORT and NEXT_BASE_PATH are set by the unified
// Overall-Dashboard build script (`build.sh` at repo root). When
// NEXT_EXPORT is truthy we build a static export that can be served
// from a subpath of the dashboard. Local dev (no envs) keeps the
// full Next.js server features.
const isExport = !!process.env.NEXT_EXPORT;
const basePath = process.env.NEXT_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        basePath,
        assetPrefix: basePath || undefined,
      }
    : {}),
};

export default nextConfig;
