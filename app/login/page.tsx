import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) redirect("/trips");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">SlimTrippin</p>
          <h1 className="text-2xl font-semibold tracking-normal">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your email to open your trip library.
          </p>
        </div>

        {isSupabaseConfigured() ? (
          <LoginForm />
        ) : (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Supabase is not configured. Add the values from `.env.example` to
            `.env.local`.
          </p>
        )}
      </section>
    </main>
  );
}
