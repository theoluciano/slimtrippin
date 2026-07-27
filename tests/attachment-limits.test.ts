import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  ATTACHMENT_KINDS_LABEL,
  MAX_ATTACHMENT_BATCH_BYTES,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/attachments";

/**
 * lib/attachments.ts is the source of the limits, and next.config.ts imports
 * from it. The storage bucket in migration 0003 is what Supabase actually
 * enforces and cannot import anything — if it drifts, the UI promises a cap
 * Supabase will reject, so pin the two together here.
 */

const migration = readFileSync(
  path.resolve(__dirname, "../supabase/migrations/0003_event_attachments.sql"),
  "utf8",
);

const bucketDefinition = migration.slice(
  migration.indexOf("insert into storage.buckets"),
);

describe("attachment limits match the storage bucket", () => {
  it("uses the same per-file size cap as the bucket", () => {
    // The only bare integer in the bucket row — the other columns are the id,
    // name, a boolean, and the mime array.
    const match = bucketDefinition.match(/^\s*(\d+),\s*$/m);
    expect(match, "could not find file_size_limit in migration 0003").not.toBeNull();
    expect(Number(match![1])).toBe(MAX_ATTACHMENT_BYTES);
  });

  it("uses the same mime allowlist as the bucket", () => {
    const array = bucketDefinition.match(/array\[([\s\S]*?)\]/);
    expect(array, "could not find allowed_mime_types in migration 0003").not.toBeNull();

    const bucketTypes = [...array![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(bucketTypes.sort()).toEqual([...ALLOWED_ATTACHMENT_MIME_TYPES].sort());
  });
});

describe("attachment limits match the Server Action body limit", () => {
  it("allows a full batch to reach the server", () => {
    const limit = nextConfig.experimental?.serverActions?.bodySizeLimit;
    expect(typeof limit).toBe("number");
    expect(limit).toBeGreaterThanOrEqual(MAX_ATTACHMENT_BATCH_BYTES);
  });

  it("does not let a single file exceed a batch", () => {
    expect(MAX_ATTACHMENT_BATCH_BYTES).toBeGreaterThanOrEqual(MAX_ATTACHMENT_BYTES);
  });
});

describe("helper label", () => {
  it("names only categories the allowlist actually permits", () => {
    expect(ATTACHMENT_KINDS_LABEL).toBe("PDFs, images, and documents");
  });
});
