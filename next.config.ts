import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
      turbopackFileSystemCacheForDev: true,
  }
};

module.exports = {
  trailingSlash: false, 
}

export default nextConfig;
