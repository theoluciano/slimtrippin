create extension if not exists pgcrypto;

create type public.event_type as enum (
  'transit',
  'lodging',
  'food',
  'activity',
  'task',
  'other'
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  start_date date not null,
  end_date date not null,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_date_order check (end_date >= start_date)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  type public.event_type not null default 'other',
  start_at timestamptz not null,
  end_at timestamptz not null,
  location_name text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_order check (end_at > start_at)
);

create index trips_owner_id_start_date_idx on public.trips(owner_id, start_date);
create index events_owner_id_trip_id_start_at_idx on public.events(owner_id, trip_id, start_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

alter table public.trips enable row level security;
alter table public.events enable row level security;

create policy "Users can read their own trips"
on public.trips for select
using (auth.uid() = owner_id);

create policy "Users can create their own trips"
on public.trips for insert
with check (auth.uid() = owner_id);

create policy "Users can update their own trips"
on public.trips for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Users can delete their own trips"
on public.trips for delete
using (auth.uid() = owner_id);

create policy "Users can read their own events"
on public.events for select
using (auth.uid() = owner_id);

create policy "Users can create their own events"
on public.events for insert
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.trips
    where trips.id = events.trip_id
    and trips.owner_id = auth.uid()
  )
);

create policy "Users can update their own events"
on public.events for update
using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.trips
    where trips.id = events.trip_id
    and trips.owner_id = auth.uid()
  )
);

create policy "Users can delete their own events"
on public.events for delete
using (auth.uid() = owner_id);

grant usage on schema public to authenticated;
grant usage on type public.event_type to authenticated;

grant select, insert, update, delete on table public.trips to authenticated;
grant select, insert, update, delete on table public.events to authenticated;
