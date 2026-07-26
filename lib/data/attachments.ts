import type { AppSupabaseClient } from "@/lib/data/trips";
import { ATTACHMENT_BUCKET, sanitizeFileName } from "@/lib/attachments";
import type { EventAttachment } from "@/lib/types";

export type CreateAttachmentInput = {
  ownerId: string;
  eventId: string;
  file: File;
};

export async function getAttachmentsForTrip(
  supabase: AppSupabaseClient,
  ownerId: string,
  tripId: string,
) {
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("trip_id", tripId);

  if (eventsError) throw eventsError;
  if (!events.length) return [];

  const { data, error } = await supabase
    .from("event_attachments")
    .select("*")
    .eq("owner_id", ownerId)
    .in(
      "event_id",
      events.map((event) => event.id),
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAttachment(
  supabase: AppSupabaseClient,
  ownerId: string,
  attachmentId: string,
) {
  const { data, error } = await supabase
    .from("event_attachments")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("id", attachmentId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Uploads the bytes, then records the row. If the row insert fails the object
 * is removed so the bucket does not accumulate files nothing points at.
 */
export async function createAttachment(
  supabase: AppSupabaseClient,
  input: CreateAttachmentInput,
) {
  const fileName = sanitizeFileName(input.file.name);
  const storagePath = `${input.ownerId}/${input.eventId}/${crypto.randomUUID()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(storagePath, input.file, {
      contentType: input.file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("event_attachments")
    .insert({
      owner_id: input.ownerId,
      event_id: input.eventId,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: input.file.type,
      size_bytes: input.file.size,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(ATTACHMENT_BUCKET).remove([storagePath]);
    throw error;
  }

  return data;
}

/**
 * Deletes the row first — that is the RLS-guarded record of ownership. A failed
 * object removal afterwards leaves an unreferenced file rather than a broken row.
 */
export async function deleteAttachment(
  supabase: AppSupabaseClient,
  ownerId: string,
  attachmentId: string,
) {
  const { data, error } = await supabase
    .from("event_attachments")
    .delete()
    .eq("owner_id", ownerId)
    .eq("id", attachmentId)
    .select("storage_path")
    .single();

  if (error) throw error;

  await supabase.storage.from(ATTACHMENT_BUCKET).remove([data.storage_path]);
}

export async function createAttachmentSignedUrl(
  supabase: AppSupabaseClient,
  attachment: EventAttachment,
  { download }: { download?: boolean } = {},
) {
  const { data, error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(attachment.storage_path, 60 * 60, {
      download: download ? attachment.file_name : undefined,
    });

  if (error) throw error;
  return data.signedUrl;
}
