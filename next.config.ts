import type { NextConfig } from "next";
import { MAX_ATTACHMENT_BATCH_BYTES } from "./lib/attachments";

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    // Attachment uploads post files through a Server Action; the 1MB default
    // would reject them. The headroom covers multipart encoding and the other
    // form fields, which ride along in the same body as the files.
    serverActions: {
      bodySizeLimit: MAX_ATTACHMENT_BATCH_BYTES + 1024 * 1024,
    },
  },
};

export default nextConfig;
