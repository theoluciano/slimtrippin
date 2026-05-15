import { CalendarDays, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CreateTripDialog,
  DeleteTripDialog,
  EditTripDialog,
  SignOutDialog,
} from "@/app/trips/trip-dialogs";
import { getTrips } from "@/lib/data/trips";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function TripsPage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const trips = await getTrips(supabase, user.id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">SlimTrippin</p>
            <h1 className="text-3xl font-semibold tracking-normal">Trips</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <CreateTripDialog today={today} />
            <SignOutDialog />
          </div>
        </header>

        <section>
          <div className="grid gap-3">
            {trips.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
                No trips yet. Create one to start laying out your agenda.
              </div>
            ) : (
              trips.map((trip) => (
                <article
                  key={trip.id}
                  className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <Link href={`/trips/${trip.id}`} className="space-y-2">
                    <h2 className="text-lg font-semibold">{trip.title}</h2>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        {trip.start_date} to {trip.end_date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {trip.timezone}
                      </span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1">
                    <EditTripDialog trip={trip} />
                    <DeleteTripDialog trip={trip} />
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
