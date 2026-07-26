/**
 * Shared attachment rules. The bucket in
 * supabase/migrations/0003_event_attachments.sql enforces the same size limit
 * and mime allowlist server-side — keep the two in sync.
 */

export const ATTACHMENT_BUCKET = "event-attachments";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * Ceiling for one multi-file upload. Files post through a Server Action, so the
 * whole batch is a single request body — this must stay under the
 * `serverActions.bodySizeLimit` in next.config.ts.
 */
export const MAX_ATTACHMENT_BATCH_BYTES = 24 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
] as const;

/** `accept` attribute for the file input. Extensions help browsers that report
 * empty or generic mime types for Office files. */
export const ATTACHMENT_ACCEPT = [
  ...ALLOWED_ATTACHMENT_MIME_TYPES,
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
].join(",");

/**
 * Human phrase for the accepted kinds — "PDFs, images, and documents". Derived
 * from the allowlist rather than hand-written so the helper text in the UI
 * cannot advertise a category we no longer accept.
 */
export const ATTACHMENT_KINDS_LABEL = buildAttachmentKindsLabel();

function buildAttachmentKindsLabel() {
  const types = ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[];
  const kinds: string[] = [];

  if (types.includes("application/pdf")) kinds.push("PDFs");
  if (types.some(isImageAttachment)) kinds.push("images");
  if (types.some((type) => type !== "application/pdf" && !isImageAttachment(type))) {
    kinds.push("documents");
  }

  return new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(
    kinds,
  );
}

export function isAllowedAttachmentType(mimeType: string) {
  return (ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isImageAttachment(mimeType: string) {
  return mimeType.startsWith("image/");
}

/** Strips directory components and characters that are awkward in storage keys. */
export function sanitizeFileName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\- ]+/g, "_").trim();
  return (cleaned || "file").slice(0, 120);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

/** Short, human label for the file list — "PDF", "JPG", "DOCX". */
export function attachmentKindLabel(fileName: string, mimeType: string) {
  const extension = fileName.includes(".") ? fileName.split(".").pop() : null;
  if (extension && extension.length <= 4) return extension.toUpperCase();
  return mimeType.split("/").pop()?.toUpperCase() ?? "FILE";
}
