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
 * The attachment limits are stated in three places that cannot import each
 * other: lib/attachments.ts (validation + the helper label shown to the user),
 * the storage bucket in migration 0003 (what Supabase actually enforces), and
 * the Server Action body limit in next.config.ts (what can reach the server).
 *
 * If they drift, the UI promises a cap Supabase will reject — so pin them here.
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
    const match = bucketDefinition.match(/\bfalse,\s*(\d+)\b/);
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
    expect(typeof limit).toBe("string");

    const megabytes = Number(String(limit).replace(/mb$/i, ""));
    expect(Number.isNaN(megabytes)).toBe(false);
    expect(megabytes * 1024 * 1024).toBeGreaterThanOrEqual(MAX_ATTACHMENT_BATCH_BYTES);
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
