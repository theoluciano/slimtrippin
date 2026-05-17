import { CalendarDots, Clock } from "@phosphor-icons/react/dist/ssr";
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
    <main className="flex min-h-screen flex-col bg-[#EEEAE3]">
      <header className="bg-[#EEEAE3]">
        <div className="mx-auto flex w-full max-w-6xl items-end justify-between px-6 pb-2 pt-6">
          <span
            className="text-[20px] leading-none text-[#3D3A59]"
            style={{ fontFamily: "var(--font-special-gothic), system-ui, sans-serif" }}
          >
            SlimTrippin&apos;
          </span>
          <div className="flex items-center gap-2">
            <CreateTripDialog today={today} />
            <SignOutDialog />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-6 pt-4">
        <section
          className="flex-1 border border-[#E2DDD5] bg-white p-5"
          style={{
            borderRadius: 40,
            boxShadow: "inset 0 0 20px #00000014, 0 1px 2px -3px #0000001A",
          }}
        >
          <div className="grid gap-3">
            {trips.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-sm text-[#4D486F]">
                No trips yet. Create one to start laying out your agenda.
              </div>
            ) : (
              trips.map((trip) => (
                <article
                  key={trip.id}
                  className="trip-card flex items-center justify-between gap-4 border border-[#E0E0EA] bg-[#F2F2F6] px-5 py-4"
                >
                  <Link href={`/trips/${trip.id}`} className="flex-1 space-y-2">
                    <h2 className="text-[18px] font-semibold leading-snug text-[#1C1A28]">
                      {trip.title}
                    </h2>
                    <div className="flex flex-wrap gap-3 text-sm text-[#4D486F]">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDots className="h-4 w-4 shrink-0 text-[#4D486F]" aria-hidden="true" />
                        {trip.start_date} to {trip.end_date}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4 shrink-0 text-[#4D486F]" aria-hidden="true" />
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


