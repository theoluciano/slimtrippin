import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    // Attachment uploads post files through a Server Action; the 1MB default
    // would reject them. Keep in sync with MAX_ATTACHMENT_BATCH_BYTES.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
