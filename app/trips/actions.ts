"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createTrip, deleteTrip, updateTrip } from "@/lib/data/trips";
import { requireUser } from "@/lib/supabase/auth";
import { requiredString } from "@/lib/form";

export async function createTripAction(formData: FormData) {
  const { supabase, user } = await requireUser();

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
  const { supabase, user } = await requireUser();

  const tripId = requiredString(formData, "tripId");
  const title = requiredString(formData, "title");
  const startDate = requiredString(formData, "startDate");
  const endDate = requiredString(formData, "endDate");
  const timezone = requiredString(formData, "timezone");

  await updateTrip(supabase, user.id, { tripId, title, startDate, endDate, timezone });
  revalidatePath("/trips");
}

export async function deleteTripAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  await deleteTrip(supabase, user.id, requiredString(formData, "tripId"));
  revalidatePath("/trips");
}
