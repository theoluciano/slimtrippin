"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "@/lib/data/trips";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPES, type EventType } from "@/lib/types";

export async function createEventAction(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const tripId = requiredString(formData, "tripId");

  await createEvent(supabase, {
    ownerId: userId,
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
  const { supabase, userId } = await requireUser();
  const tripId = requiredString(formData, "tripId");

  await updateEvent(supabase, userId, {
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
  const { supabase, userId } = await requireUser();
  const tripId = requiredString(formData, "tripId");

  await deleteEvent(supabase, userId, requiredString(formData, "eventId"));
  revalidatePath(`/trips/${tripId}`);
}

async function requireUser() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { supabase, userId: user.id };
}

function parseEventType(value: string): EventType {
  if (EVENT_TYPES.includes(value as EventType)) {
    return value as EventType;
  }

  return "other";
}

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required.`);
  }
  return value.trim();
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
