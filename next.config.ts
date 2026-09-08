import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // No API routes, no external services. This preview is fully static data.
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
