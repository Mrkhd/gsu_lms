import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow larger course-material / assignment uploads through Server Actions
    // (default is 1 MB). Keep nginx `client_max_body_size` >= this value.
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
