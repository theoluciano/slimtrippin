"use server";

import { revalidatePath } from "next/cache";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "@/lib/data/trips";
import { createAttachment, deleteAttachment } from "@/lib/data/attachments";
import { requireUser } from "@/lib/supabase/auth";
import { requiredString, optionalString } from "@/lib/form";
import { rejectAttachmentBatch } from "@/lib/attachments";
import { EVENT_TYPES, type EventType } from "@/lib/types";

export async function createEventAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const tripId = requiredString(formData, "tripId");

  await createEvent(supabase, {
    ownerId: user.id,
    tripId,
    title: requiredString(formData, "title"),
    type: parseEventType(requiredString(formData, "type")),
    startAt: requiredString(formData, "startAt"),
    endAt: requiredString(formData, "endAt"),
    address: optionalString(formData, "address"),
    notes: optionalString(formData, "notes"),
  });

  revalidatePath(`/trips/${tripId}`);
}

export async function updateEventAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const tripId = requiredString(formData, "tripId");

  await updateEvent(supabase, user.id, {
    eventId: requiredString(formData, "eventId"),
    title: requiredString(formData, "title"),
    type: parseEventType(requiredString(formData, "type")),
    startAt: requiredString(formData, "startAt"),
    endAt: requiredString(formData, "endAt"),
    address: optionalString(formData, "address"),
    notes: optionalString(formData, "notes"),
  });

  revalidatePath(`/trips/${tripId}`);
}

export async function deleteEventAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const tripId = requiredString(formData, "tripId");

  await deleteEvent(supabase, user.id, requiredString(formData, "eventId"));
  revalidatePath(`/trips/${tripId}`);
}

export async function uploadAttachmentsAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const tripId = requiredString(formData, "tripId");
  const eventId = requiredString(formData, "eventId");

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const rejection = rejectAttachmentBatch(files);
  if (rejection) throw new Error(rejection);

  // Sequential so the first failure surfaces without leaving later uploads in
  // flight against an event the user is being told the upload failed for.
  for (const file of files) {
    await createAttachment(supabase, { ownerId: user.id, eventId, file });
  }

  revalidatePath(`/trips/${tripId}`);
}

export async function deleteAttachmentAction(formData: FormData) {
  const { supabase, user } = await requireUser();
  const tripId = requiredString(formData, "tripId");

  await deleteAttachment(supabase, user.id, requiredString(formData, "attachmentId"));
  revalidatePath(`/trips/${tripId}`);
}

function parseEventType(value: string): EventType {
  if (EVENT_TYPES.includes(value as EventType)) {
    return value as EventType;
  }

  return "other";
}
