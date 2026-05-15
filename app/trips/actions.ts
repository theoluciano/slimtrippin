"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createTrip, deleteTrip, updateTrip } from "@/lib/data/trips";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function createTripAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const title = requiredString(formData, "title");
  const startDate = requiredString(formData, "startDate");
  const endDate = requiredString(formData, "endDate");
  const timezone = requiredString(formData, "timezone");

  const trip = await createTrip(supabase, {
    ownerId: user.id,
    title,
    startDate,
    endDate,
    timezone,
  });

  revalidatePath("/trips");
  redirect(`/trips/${trip.id}`);
}

export async function updateTripAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const tripId = requiredString(formData, "tripId");
  const title = requiredString(formData, "title");
  const startDate = requiredString(formData, "startDate");
  const endDate = requiredString(formData, "endDate");
  const timezone = requiredString(formData, "timezone");

  await updateTrip(supabase, user.id, { tripId, title, startDate, endDate, timezone });
  revalidatePath("/trips");
}

export async function deleteTripAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await deleteTrip(supabase, user.id, requiredString(formData, "tripId"));
  revalidatePath("/trips");
}

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required.`);
  }
  return value.trim();
}
