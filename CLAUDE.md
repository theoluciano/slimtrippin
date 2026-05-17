# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm typecheck    # TypeScript type check
pnpm lint         # ESLint
pnpm test         # unit tests (Vitest)
pnpm test:e2e     # E2E tests (Playwright, Chromium only)
```

## Environment

Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (optional, defaults to `http://localhost:3000`)

## Architecture

Next.js 15 App Router with React 19. Pages are Server Components; interactivity is pushed to the edges via `"use client"` components.

**Routes:**
- `/login` — Supabase magic-link (OTP) auth
- `/trips` — trip list (server-rendered)
- `/trips/[tripId]` — trip workspace (server-rendered shell, client workspace component)
- `/auth/callback`, `/auth/signout` — Supabase auth handlers

**Data flow:**
- Pages fetch data in Server Components and pass it as props
- Mutations go through Server Actions (`actions.ts` co-located with each route)
- Server Actions call `lib/data/` helpers, then `revalidatePath()` to refresh the page
- Client Components use the browser Supabase client only for auth state; all data mutations go through Server Actions

**Supabase layer (`lib/supabase/`, `lib/data/`):**
- `lib/supabase/server.ts` — SSR client (cookies); use in Server Components and Server Actions
- `lib/supabase/browser.ts` — browser client; use only in `"use client"` components
- `lib/data/trips.ts` — typed CRUD helpers for `trips` and `events` tables
- Every query filters by `owner_id` to respect Row-Level Security

**Database schema** (see `lib/types.ts`):
- `trips`: id, owner_id, title, start_date, end_date, timezone
- `events`: id, owner_id, trip_id, title, type, start_at, end_at, location_name, address, notes
- Event types: `"transit" | "lodging" | "food" | "activity" | "task" | "other"`

**Timezone handling (`lib/timezone/datetime.ts`):**
- Events are stored as UTC ISO strings; displayed in the trip's timezone
- Use `utcIsoToDatetimeLocal()` / `datetimeLocalToUtcIso()` for all conversions — do not do ad-hoc Date math

## Styling

- Tailwind CSS 4 with CSS custom properties defined in `app/globals.css`
- UI primitives from shadcn/ui (radix-nova style) in `components/ui/`
- Icons from Phosphor Icons (`@phosphor-icons/react`)
- Never use inline `style` props — always use Tailwind classes or named CSS classes. Inline styles override pseudo-class rules (`:active`, `:hover`) and break interactive states.
- `--font-special-gothic` CSS variable is available for the `Special Gothic Expanded One` wordmark font

## Key files

- `lib/types.ts` — all database types
- `lib/data/trips.ts` — all CRUD operations
- `lib/timezone/datetime.ts` — timezone conversion utilities
- `lib/supabase/auth.ts` — shared `requireUser()` helper for Server Components and Actions
- `lib/form.ts` — shared `requiredString()` / `optionalString()` form helpers
- `app/trips/[tripId]/trip-workspace.tsx` — main workspace UI (large client component)
- `app/globals.css` — CSS variables, design tokens, component-level CSS classes
