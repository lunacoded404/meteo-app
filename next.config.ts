// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Giữ lại cấu hình experimental của bạn
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  
  trailingSlash: true,

  env: {
    DJANGO_API_BASE: process.env.DJANGO_API_BASE,
  },
};

export default nextConfig;