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

  // Only a missing trip is a 404. Everything else propagates to the error
  // boundary — a blanket catch here reports backend failures as "trip not
  // found", which sends you looking in the wrong place.
  let trip;
  try {
    trip = await getTrip(supabase, user.id, tripId);
  } catch {
    notFound();
  }

  const [events, attachments] = await Promise.all([
    getEvents(supabase, user.id, tripId),
    getAttachmentsForTrip(supabase, user.id, tripId),
  ]);

  return <TripWorkspace trip={trip} events={events} attachments={attachments} />;
}
