import { notFound } from "next/navigation";
import { getAttachmentsForTrip } from "@/lib/data/attachments";
import { getEvents, getTrip } from "@/lib/data/trips";
import { requireUser } from "@/lib/supabase/auth";
import { TripWorkspace } from "@/app/trips/[tripId]/trip-workspace";

export default async function TripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { supabase, user } = await requireUser();
  const { tripId } = await params;

  const [trip, events, attachments] = await Promise.all([
    getTrip(supabase, user.id, tripId),
    getEvents(supabase, user.id, tripId),
    getAttachmentsForTrip(supabase, user.id, tripId),
  ]);

  // Only a missing trip is a 404. Backend failures propagate to the error
  // boundary — reporting those as "trip not found" sends you looking in the
  // wrong place.
  if (!trip) notFound();

  return <TripWorkspace trip={trip} events={events} attachments={attachments} />;
}
