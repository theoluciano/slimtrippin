grant usage on schema public to authenticated;
grant usage on type public.event_type to authenticated;

grant select, insert, update, delete on table public.trips to authenticated;
grant select, insert, update, delete on table public.events to authenticated;
