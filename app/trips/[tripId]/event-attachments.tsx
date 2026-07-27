"use client";

import {
  File as FileIcon,
  FileCsv,
  FileDoc,
  FileImage,
  FilePdf,
  FilePpt,
  FileText,
  FileXls,
  Paperclip,
  Plus,
  SpinnerGap,
  Trash,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import {
  deleteAttachmentAction,
  uploadAttachmentsAction,
} from "@/app/trips/[tripId]/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_KINDS_LABEL,
  MAX_ATTACHMENT_BYTES,
  type AttachmentMimeType,
  attachmentKindLabel,
  formatFileSize,
  isAllowedAttachmentType,
  isImageAttachment,
  rejectAttachmentBatch,
} from "@/lib/attachments";
import type { EventAttachment } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  tripId: string;
  eventId: string;
  attachments: EventAttachment[];
};

export function EventAttachments({ tripId, eventId, attachments }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Reset immediately so re-picking the same file still fires a change event.
    event.target.value = "";
    if (!files.length) return;

    // Same rules the Server Action enforces, run here so the user hears about a
    // bad pick before the bytes go over the wire.
    const rejection = rejectAttachmentBatch(files);
    if (rejection) {
      setError(rejection);
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("tripId", tripId);
    formData.set("eventId", eventId);
    files.forEach((file) => formData.append("files", file));

    startUpload(async () => {
      try {
        await uploadAttachmentsAction(formData);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Upload failed. Try again.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Paperclip aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium leading-5">Attachments</span>
          {attachments.length > 0 && (
            <span className="text-[13px] leading-[18px] text-muted-foreground">
              {attachments.length}
            </span>
          )}
        </div>
        {/* The input itself is the click target — full size, transparent, on
            top of the styled face below it. Do not hide it behind a label or a
            button calling input.click(): browsers decline to open the file
            picker for inputs that are `display: none` or clipped to 1px, and a
            programmatic click can be swallowed by the focus trap Radix puts
            around SheetContent. Clicking the real input avoids all of that. */}
        <div className="relative inline-flex rounded-lg has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50">
          <span
            aria-hidden="true"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              isUploading && "opacity-50",
            )}
          >
            {isUploading ? (
              <SpinnerGap className="animate-spin" />
            ) : (
              <Plus />
            )}
            {isUploading ? "Uploading…" : "Add files"}
          </span>
          <input
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            disabled={isUploading}
            aria-label="Add files"
            className="absolute inset-0 size-full cursor-pointer text-[0] opacity-0 file:cursor-pointer disabled:cursor-not-allowed"
            onChange={handleFilesSelected}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-[13px] leading-[18px] text-destructive">
          {error}
        </p>
      )}

      {attachments.length === 0 ? (
        <p className="text-[13px] leading-[18px] text-muted-foreground">
          Add confirmations, tickets, or itineraries.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attachments.map((attachment) => (
            <AttachmentRow
              key={attachment.id}
              tripId={tripId}
              attachment={attachment}
              onError={setError}
            />
          ))}
        </ul>
      )}

      {/* Always visible so the cap is stated before and after the first upload.
          Both halves derive from lib/attachments.ts, which the bucket in
          migration 0003 mirrors — tests/attachment-limits.test.ts holds them
          together, so this label cannot drift from what Supabase accepts. */}
      <p className="text-[13px] leading-[18px] text-muted-foreground">
        {`${ATTACHMENT_KINDS_LABEL} · up to ${formatFileSize(MAX_ATTACHMENT_BYTES)} per file`}
      </p>
    </div>
  );
}

function AttachmentRow({
  tripId,
  attachment,
  onError,
}: {
  tripId: string;
  attachment: EventAttachment;
  onError: (message: string) => void;
}) {
  const [isDeleting, startDelete] = useTransition();
  const href = `/attachments/${attachment.id}`;

  function handleDelete() {
    const formData = new FormData();
    formData.set("tripId", tripId);
    formData.set("attachmentId", attachment.id);

    startDelete(async () => {
      try {
        await deleteAttachmentAction(formData);
      } catch (deleteError) {
        onError(
          deleteError instanceof Error
            ? deleteError.message
            : "Could not remove that file. Try again.",
        );
      }
    });
  }

  return (
    <li className="group flex items-center gap-3 rounded-xl border border-muted px-3 py-2.5">
      <AttachmentThumbnail attachment={attachment} />
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 flex-1 hover:underline"
      >
        <span className="block truncate text-sm leading-5">{attachment.file_name}</span>
        <span className="block text-[13px] leading-[18px] text-muted-foreground">
          {attachmentKindLabel(attachment.file_name, attachment.mime_type)} ·{" "}
          {formatFileSize(attachment.size_bytes)}
        </span>
      </a>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isDeleting}
        aria-label={`Remove ${attachment.file_name}`}
        onClick={handleDelete}
      >
        {isDeleting ? (
          <SpinnerGap aria-hidden="true" className="animate-spin" />
        ) : (
          <Trash aria-hidden="true" />
        )}
      </Button>
    </li>
  );
}

function AttachmentThumbnail({ attachment }: { attachment: EventAttachment }) {
  if (isImageAttachment(attachment.mime_type)) {
    return (
      // Signed-URL redirect behind an auth check — not a candidate for next/image
      // optimization, which would need a stable public origin.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/attachments/${attachment.id}`}
        alt=""
        className="size-10 shrink-0 rounded-lg border border-muted object-cover"
      />
    );
  }

  const Glyph = iconForMimeType(attachment.mime_type);

  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
      <Glyph aria-hidden="true" className="size-5 text-muted-foreground" />
    </span>
  );
}

/**
 * Exhaustive over the allowlist, so adding a type in lib/attachments.ts is a
 * type error here until it has an icon. Rows stored before a type was dropped
 * fall back to the generic glyph.
 */
const ATTACHMENT_ICONS: Record<AttachmentMimeType, Icon> = {
  "application/pdf": FilePdf,
  "image/jpeg": FileImage,
  "image/png": FileImage,
  "image/webp": FileImage,
  "image/gif": FileImage,
  "image/heic": FileImage,
  "image/heif": FileImage,
  "application/msword": FileDoc,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileDoc,
  "application/vnd.ms-excel": FileXls,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileXls,
  "application/vnd.ms-powerpoint": FilePpt,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": FilePpt,
  "text/plain": FileText,
  "text/csv": FileCsv,
};

function iconForMimeType(mimeType: string): Icon {
  return isAllowedAttachmentType(mimeType) ? ATTACHMENT_ICONS[mimeType] : FileIcon;
}
