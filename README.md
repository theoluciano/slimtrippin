# SlimTrippin

A desktop-first trip timeline planner. Create trips, add events (transit, lodging, food, activities, and more), and view everything in a chronological agenda.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui (Radix Nova)
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repo and install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment template and fill in your Supabase credentials:

   ```bash
   cp .env.example .env.local
   ```

   Required variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. Link the Supabase CLI to your project and apply migrations. The CLI ships as a
   devDependency, so there is nothing to install globally — but `login` and `link`
   are one-time, per-machine steps:

   ```bash
   pnpm db login                              # opens a browser to authorize
   pnpm db link --project-ref <your-ref>      # the subdomain of your Supabase URL
   pnpm db:push                               # apply supabase/migrations/
   ```

   `pnpm db:status` lists which migrations the remote project has applied. Any
   `supabase` subcommand is reachable through `pnpm db <subcommand>`.

4. Start the dev server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Production build
pnpm lint       # Lint with ESLint
pnpm typecheck  # Type check with TypeScript
pnpm test       # Unit tests (Vitest)
pnpm test:e2e   # E2E tests (Playwright)
```

## Project Structure

```
/
├── app/                  # Next.js App Router pages and server actions
│   ├── trips/            # Trip list and trip detail pages
│   ├── login/            # Magic link authentication
│   └── auth/             # Auth callback and sign-out routes
├── components/ui/        # shadcn/ui component primitives
├── lib/
│   ├── data/             # Supabase CRUD helpers
│   ├── supabase/         # Server and browser Supabase clients
│   ├── timezone/         # Timezone-aware datetime utilities
│   └── types.ts          # Shared TypeScript types
├── supabase/migrations/  # SQL migrations
└── tests/                # Unit and E2E tests
```

## Authentication

SlimTrippin uses Supabase magic link (passwordless email) authentication. All data is scoped to the authenticated user via Postgres Row Level Security policies.

## Database Schema

| Table    | Key Columns                                                                 |
|----------|-----------------------------------------------------------------------------|
| `trips`  | `id`, `owner_id`, `title`, `start_date`, `end_date`, `timezone`            |
| `events` | `id`, `owner_id`, `trip_id`, `title`, `type`, `start_at`, `end_at`, `location`, `notes` |
| `event_attachments` | `id`, `owner_id`, `event_id`, `storage_path`, `file_name`, `mime_type`, `size_bytes` |

Event types: `transit`, `lodging`, `food`, `activity`, `task`, `other`.

## Attachments

Events can hold files — PDFs, images, and Office documents up to 10 MB each. File
bytes go to the private `event-attachments` Supabase Storage bucket (created by
migration `0003`); the row in `event_attachments` holds the metadata. Because the
bucket is private, downloads are served through `/attachments/[attachmentId]`,
which verifies the session and redirects to a short-lived signed URL.
