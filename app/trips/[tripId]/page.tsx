import { notFound, redirect } from "next/navigation";
import { getEvents, getTrip } from "@/lib/data/trips";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { TripWorkspace } from "@/app/trips/[tripId]/trip-workspace";

export default async function TripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/login");

  const { tripId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
