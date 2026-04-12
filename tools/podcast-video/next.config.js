/** @type {import('next').NextConfig} */
//
// NEXT_EXPORT and NEXT_BASE_PATH are set by the unified
// Overall-Dashboard build script (`build.sh` at repo root). When
// NEXT_EXPORT is truthy we build a static export that can be served
// from a subpath of the dashboard. Local dev (no envs) keeps the
// full Next.js server features including server actions and API
// routes.
const isExport = !!process.env.NEXT_EXPORT;
const basePath = process.env.NEXT_BASE_PATH || '';

const nextConfig = {
  reactStrictMode: true,
  // Expose NEXT_PUBLIC_STATIC_EXPORT + NEXT_PUBLIC_BASE_PATH to the
  // browser bundle so the in-memory /api/* shim can detect when it's
  // running inside a static export.
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: isExport ? '1' : '0',
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(isExport
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
        basePath,
        assetPrefix: basePath || undefined,
      }
    : {
        experimental: {
          serverActions: {
            bodySizeLimit: '100mb',
          },
        },
      }),
}

module.exports = nextConfig
