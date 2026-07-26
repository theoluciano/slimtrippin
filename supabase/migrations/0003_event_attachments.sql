-- Event attachments: file metadata rows in public.event_attachments, bytes in
-- the private `event-attachments` storage bucket.
--
-- Storage object names are always `{owner_id}/{event_id}/{uuid}-{filename}`.
-- The storage policies below rely on that first path segment being the owner's
-- uid, so never write an object under a different prefix.

create table public.event_attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(trim(file_name)) > 0),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index event_attachments_owner_id_event_id_created_at_idx
  on public.event_attachments(owner_id, event_id, created_at);

alter table public.event_attachments enable row level security;

create policy "Users can read their own attachments"
on public.event_attachments for select
using (auth.uid() = owner_id);

create policy "Users can create their own attachments"
on public.event_attachments for insert
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.events
    where events.id = event_attachments.event_id
    and events.owner_id = auth.uid()
  )
);

create policy "Users can delete their own attachments"
on public.event_attachments for delete
using (auth.uid() = owner_id);

grant select, insert, delete on table public.event_attachments to authenticated;

-- Private bucket. The size limit and mime allowlist mirror lib/attachments.ts —
-- keep the two in sync.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-attachments',
  'event-attachments',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read their own attachment objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'event-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload their own attachment objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'event-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own attachment objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'event-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);
