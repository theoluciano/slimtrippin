import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EventType } from "@/lib/types";

export type AppSupabaseClient = SupabaseClient<Database, "public">;

export type CreateTripInput = {
  ownerId: string;
  title: string;
  startDate: string;
  endDate: string;
  timezone: string;
};

export type UpdateTripInput = {
  tripId: string;
  title: string;
  startDate: string;
  endDate: string;
  timezone: string;
};

export type CreateEventInput = {
  ownerId: string;
  tripId: string;
  title: string;
  type: EventType;
  startAt: string;
  endAt: string;
  address?: string | null;
  notes?: string | null;
};

export type UpdateEventInput = Omit<CreateEventInput, "ownerId" | "tripId"> & {
  eventId: string;
};

export async function getTrips(supabase: AppSupabaseClient, ownerId: string) {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("owner_id", ownerId)
    .order("start_date", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getTrip(
  supabase: AppSupabaseClient,
  ownerId: string,
  tripId: string,
) {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("id", tripId)
    .single();

  if (error) throw error;
  return data;
}

export async function createTrip(
  supabase: AppSupabaseClient,
  input: CreateTripInput,
) {
  const { data, error } = await supabase
    .from("trips")
    .insert({
      owner_id: input.ownerId,
      title: input.title.trim(),
      start_date: input.startDate,
      end_date: input.endDate,
      timezone: input.timezone,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateTrip(
  supabase: AppSupabaseClient,
  ownerId: string,
  input: UpdateTripInput,
) {
  const { data, error } = await supabase
    .from("trips")
    .update({
      title: input.title.trim(),
      start_date: input.startDate,
      end_date: input.endDate,
      timezone: input.timezone,
    })
    .eq("owner_id", ownerId)
    .eq("id", input.tripId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTrip(
  supabase: AppSupabaseClient,
  ownerId: string,
  tripId: string,
) {
  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("owner_id", ownerId)
    .eq("id", tripId);

  if (error) throw error;
}

export async function getEvents(
  supabase: AppSupabaseClient,
  ownerId: string,
  tripId: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("trip_id", tripId)
    .order("start_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createEvent(
  supabase: AppSupabaseClient,
  input: CreateEventInput,
) {
  const { data, error } = await supabase
    .from("events")
    .insert(eventInputToInsert(input))
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateEvent(
  supabase: AppSupabaseClient,
  ownerId: string,
  input: UpdateEventInput,
) {
  const { data, error } = await supabase
    .from("events")
    .update({
      title: input.title.trim(),
      type: input.type,
      start_at: input.startAt,
      end_at: input.endAt,
      address: emptyToNull(input.address),
      notes: emptyToNull(input.notes),
    })
    .eq("owner_id", ownerId)
    .eq("id", input.eventId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(
  supabase: AppSupabaseClient,
  ownerId: string,
  eventId: string,
) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("owner_id", ownerId)
    .eq("id", eventId);

  if (error) throw error;
}

function eventInputToInsert(
  input: CreateEventInput,
): Database["public"]["Tables"]["events"]["Insert"] {
  return {
    owner_id: input.ownerId,
    trip_id: input.tripId,
    title: input.title.trim(),
    type: input.type,
    start_at: input.startAt,
    end_at: input.endAt,
    location_name: null,
    address: emptyToNull(input.address),
    notes: emptyToNull(input.notes),
  };
}

export function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
