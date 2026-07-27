/**
 * Shared attachment rules. The bucket in
 * supabase/migrations/0003_event_attachments.sql enforces the same size limit
 * and mime allowlist server-side — keep the two in sync.
 */

export const ATTACHMENT_BUCKET = "event-attachments";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/**
 * Ceiling for one multi-file upload. Files post through a Server Action, so the
 * whole batch is a single request body — `serverActions.bodySizeLimit` in
 * next.config.ts is derived from this.
 */
export const MAX_ATTACHMENT_BATCH_BYTES = 24 * 1024 * 1024;

/**
 * The one declaration of an accepted file type. The `accept` attribute, the
 * helper label, and the row icon all derive from this table, so adding a type
 * is a single edit here plus the bucket in migration 0003.
 */
const ATTACHMENT_TYPES = [
  { mime: "application/pdf", extensions: [".pdf"], kind: "PDFs" },
  { mime: "image/jpeg", extensions: [".jpg", ".jpeg"], kind: "images" },
  { mime: "image/png", extensions: [".png"], kind: "images" },
  { mime: "image/webp", extensions: [".webp"], kind: "images" },
  { mime: "image/gif", extensions: [".gif"], kind: "images" },
  { mime: "image/heic", extensions: [".heic"], kind: "images" },
  { mime: "image/heif", extensions: [".heif"], kind: "images" },
  { mime: "application/msword", extensions: [".doc"], kind: "documents" },
  {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: [".docx"],
    kind: "documents",
  },
  { mime: "application/vnd.ms-excel", extensions: [".xls"], kind: "documents" },
  {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extensions: [".xlsx"],
    kind: "documents",
  },
  { mime: "application/vnd.ms-powerpoint", extensions: [".ppt"], kind: "documents" },
  {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extensions: [".pptx"],
    kind: "documents",
  },
  { mime: "text/plain", extensions: [".txt"], kind: "documents" },
  { mime: "text/csv", extensions: [".csv"], kind: "documents" },
] as const;

export type AttachmentMimeType = (typeof ATTACHMENT_TYPES)[number]["mime"];

export const ALLOWED_ATTACHMENT_MIME_TYPES = ATTACHMENT_TYPES.map((type) => type.mime);

/** `accept` attribute for the file input. Extensions help browsers that report
 * empty or generic mime types for Office files. */
export const ATTACHMENT_ACCEPT = [
  ...ALLOWED_ATTACHMENT_MIME_TYPES,
  ...ATTACHMENT_TYPES.flatMap((type) => type.extensions),
].join(",");

/**
 * Human phrase for the accepted kinds — "PDFs, images, and documents". Derived
 * from the allowlist rather than hand-written so the helper text in the UI
 * cannot advertise a category we no longer accept.
 */
export const ATTACHMENT_KINDS_LABEL = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
}).format([...new Set(ATTACHMENT_TYPES.map((type) => type.kind))]);

const ALLOWED_MIME_TYPES = new Set<string>(ALLOWED_ATTACHMENT_MIME_TYPES);

export function isAllowedAttachmentType(
  mimeType: string,
): mimeType is AttachmentMimeType {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function isImageAttachment(mimeType: string) {
  return mimeType.startsWith("image/");
}

/** The `File` fields the rules below look at — so the Server Action and the
 * browser can both call them without agreeing on a `File` implementation. */
type AttachmentCandidate = { name: string; size: number; type: string };

/**
 * The single statement of what we accept, in the wording the user sees. The
 * client calls it to reject a pick before uploading and the Server Action calls
 * it again, because the client check is only a courtesy. Returns the message to
 * show, or null when the file is fine.
 */
export function rejectAttachment(file: AttachmentCandidate) {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    const size = formatFileSize(file.size);
    const cap = formatFileSize(MAX_ATTACHMENT_BYTES);

    // A file barely over the cap rounds to the cap's own figure, which would
    // otherwise read as "is 10 MB. The limit is 10 MB."
    return size === cap
      ? `"${file.name}" is just over the ${cap} limit.`
      : `"${file.name}" is ${size}. The limit is ${cap}.`;
  }

  if (!isAllowedAttachmentType(file.type)) {
    return `"${file.name}" is not a supported file type.`;
  }

  return null;
}

/** Same, for a whole pick: the per-file rules, then the batch ceiling. */
export function rejectAttachmentBatch(files: readonly AttachmentCandidate[]) {
  if (!files.length) return "Select at least one file to attach.";

  for (const file of files) {
    const rejection = rejectAttachment(file);
    if (rejection) return rejection;
  }

  const batchBytes = files.reduce((total, file) => total + file.size, 0);
  if (batchBytes > MAX_ATTACHMENT_BATCH_BYTES) {
    return `That's ${formatFileSize(batchBytes)} at once. Upload up to ${formatFileSize(MAX_ATTACHMENT_BATCH_BYTES)} per batch.`;
  }

  return null;
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
