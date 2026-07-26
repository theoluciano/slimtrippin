import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

// Dev-only helper: prints a magic link to the terminal instead of emailing it.
// Uses the service_role key, which bypasses Row-Level Security entirely, so this
// route refuses to run outside development.

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { url, siteUrl } = getSupabaseConfig();

  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Set SUPABASE_SERVICE_ROLE_KEY in .env.local to use this." },
      { status: 500 },
    );
  }

  const { email } = (await request.json()) as { email?: string };

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const redirectTo = `${siteUrl}/auth/callback`;

  let { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  // generateLink("magiclink") only works for existing users. In dev, create the
  // user on first sign-in so there is no separate signup step.
  if (error) {
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    ({ data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    }));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deliberately not properties.action_link: that routes through Supabase's
  // /auth/v1/verify, which returns the session in a URL hash fragment that the
  // browser never sends to the server. Pointing straight at the callback with
  // the token hash keeps the exchange server-side, where the cookie gets set.
  const link = `${siteUrl}/auth/callback?token_hash=${data?.properties?.hashed_token}&type=magiclink`;

  console.log(
    `\n\x1b[35m━━━ magic link for ${email} ━━━\x1b[0m\n${link}\n\x1b[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`,
  );

  return NextResponse.json({ ok: true });
}
