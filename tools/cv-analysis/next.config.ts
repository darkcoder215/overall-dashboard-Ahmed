import type { NextConfig } from "next";

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
