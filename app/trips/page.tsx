import { CalendarDots, Clock } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import {
  CreateTripDialog,
  DeleteTripDialog,
  EditTripDialog,
  SignOutDialog,
} from "@/app/trips/trip-dialogs";
import { getTrips } from "@/lib/data/trips";
import { requireUser } from "@/lib/supabase/auth";
import { formatTripDate } from "@/lib/timezone/datetime";

export default async function TripsPage() {
  const { supabase, user } = await requireUser();
  const trips = await getTrips(supabase, user.id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="flex h-screen flex-col bg-muted">
      <header className="bg-muted">
        <div className="mx-auto flex w-full max-w-6xl items-end justify-between px-6 pb-2 pt-6">
          <span className="wordmark text-[20px] leading-none text-brand">
            SlimTrippin&apos;
          </span>
          <div className="flex items-center gap-2">
            <CreateTripDialog today={today} />
            <SignOutDialog />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
        <section className="trip-section min-h-0 flex-1 overflow-y-auto border border-border bg-white p-5">
          <div className="grid gap-3">
            {trips.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
                No trips yet. Create one to start laying out your agenda.
              </div>
            ) : (
              trips.map((trip) => (
                <article
                  key={trip.id}
                  className="trip-card flex items-center justify-between gap-4 border border-border bg-[#F2F2F6] px-5 py-4"
                >
                  <Link href={`/trips/${trip.id}`} className="flex-1 space-y-2">
                    <h2 className="text-[18px] font-semibold leading-snug text-foreground">
                      {trip.title}
                    </h2>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDots className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {formatTripDate(trip.start_date)} – {formatTripDate(trip.end_date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
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
