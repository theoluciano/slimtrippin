"use server";

import { revalidatePath } from "next/cache";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "@/lib/data/trips";
import { requireUser } from "@/lib/supabase/auth";
import { requiredString, optionalString } from "@/lib/form";
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
    locationName: optionalString(formData, "locationName"),
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
    locationName: optionalString(formData, "locationName"),
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

function parseEventType(value: string): EventType {
  if (EVENT_TYPES.includes(value as EventType)) {
    return value as EventType;
  }

  return "other";
}
