import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  ATTACHMENT_ACCEPT,
  ATTACHMENT_KINDS_LABEL,
  MAX_ATTACHMENT_BATCH_BYTES,
  MAX_ATTACHMENT_BYTES,
  rejectAttachment,
  rejectAttachmentBatch,
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

  it("offers an extension for every accepted type", () => {
    const accepted = ATTACHMENT_ACCEPT.split(",");
    for (const mime of ALLOWED_ATTACHMENT_MIME_TYPES) {
      expect(accepted, `${mime} missing from the accept attribute`).toContain(mime);
    }
    expect(accepted.filter((entry) => entry.startsWith(".")).length).toBeGreaterThanOrEqual(
      ALLOWED_ATTACHMENT_MIME_TYPES.length,
    );
  });
});

/**
 * The client and the Server Action both call these, so they are the only
 * statement of what an upload may contain.
 */
describe("upload rules", () => {
  const file = (overrides: Partial<{ name: string; size: number; type: string }> = {}) => ({
    name: "boarding-pass.pdf",
    size: 1024,
    type: "application/pdf",
    ...overrides,
  });

  it("accepts a file inside the limits", () => {
    expect(rejectAttachment(file())).toBeNull();
    expect(rejectAttachmentBatch([file(), file({ type: "image/png" })])).toBeNull();
  });

  it("rejects a file over the per-file cap, naming it and both sizes", () => {
    const message = rejectAttachment(file({ size: 13 * 1024 * 1024 }));
    expect(message).toContain("boarding-pass.pdf");
    expect(message).toContain("13 MB");
    expect(message).toContain("The limit is 10 MB.");
  });

  it("does not say a file 'is 10 MB' when the limit is also 10 MB", () => {
    // Sizes a hair over the cap round to the cap's own figure.
    const message = rejectAttachment(file({ size: MAX_ATTACHMENT_BYTES + 1 }));
    expect(message).toBe('"boarding-pass.pdf" is just over the 10 MB limit.');
  });

  it("accepts a file exactly at the cap", () => {
    expect(rejectAttachment(file({ size: MAX_ATTACHMENT_BYTES }))).toBeNull();
  });

  it("rejects a type outside the allowlist", () => {
    expect(rejectAttachment(file({ name: "run.sh", type: "application/x-sh" }))).toContain(
      "not a supported file type",
    );
    // Browsers report an empty type for files they do not recognise.
    expect(rejectAttachment(file({ type: "" }))).toContain("not a supported file type");
  });

  it("rejects an empty pick", () => {
    expect(rejectAttachmentBatch([])).toBe("Select at least one file to attach.");
  });

  it("rejects a batch over the ceiling even when every file is legal", () => {
    const files = Array.from({ length: 3 }, () => file({ size: MAX_ATTACHMENT_BYTES }));
    expect(3 * MAX_ATTACHMENT_BYTES).toBeGreaterThan(MAX_ATTACHMENT_BATCH_BYTES);
    expect(rejectAttachmentBatch(files)).toContain("per batch");
  });

  it("reports the offending file before the batch total", () => {
    const message = rejectAttachmentBatch([
      file({ size: MAX_ATTACHMENT_BYTES }),
      file({ name: "huge.pdf", size: MAX_ATTACHMENT_BYTES + 1 }),
      file({ size: MAX_ATTACHMENT_BYTES }),
    ]);
    expect(message).toContain("huge.pdf");
    expect(message).not.toContain("per batch");
  });

  it("keeps a full legal batch under the Server Action body limit", () => {
    const limit = nextConfig.experimental?.serverActions?.bodySizeLimit;
    expect(Number(limit)).toBeGreaterThan(MAX_ATTACHMENT_BATCH_BYTES);
  });
});
