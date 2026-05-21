import { notFound } from "next/navigation";
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

  try {
    const [trip, events] = await Promise.all([
      getTrip(supabase, user.id, tripId),
      getEvents(supabase, user.id, tripId),
    ]);

    return <TripWorkspace trip={trip} events={events} />;
  } catch {
    notFound();
  }
}
