-- ═══════════════════════════════════════════════════════════════
--  YUNIORS CHILL ZONE — features update (Aug 2026)
--  Safe to re-run. Paste into Supabase → SQL Editor and hit Run.
--
--  Adds:
--   1. "About me" bio on profiles          (user_profiles.bio)
--   2. Pinned messages                     (new pinned_messages table)
--
--  The chat app works without this file, but the bio box and the
--  pin button will show errors until it has been run once.
-- ═══════════════════════════════════════════════════════════════


-- ═══ 1. BIO ════════════════════════════════════════════════════
alter table public.user_profiles add column if not exists bio text;


-- ═══ 2. PINNED MESSAGES ════════════════════════════════════════
-- message_id and room_id are text on purpose: id column types are
-- inconsistent across the database, so we don't use a foreign key.
-- The app cleans up pins whose message was deleted.
create table if not exists public.pinned_messages (
  id         bigint generated always as identity primary key,
  message_id text        not null,
  room_id    text        not null,
  pinned_by  uuid        not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (message_id)
);

alter table public.pinned_messages enable row level security;

-- who counts as a moderator of the room a pin lives in:
--  · in a DM         → either of the two participants
--  · in a server     → owner / admin / mod of that server
--  · anywhere        → site-wide owner / admin / mod
create or replace function public.ycz_can_pin(p_room text)
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select
    (public.ycz_is_dm(p_room) and public.ycz_in_dm(p_room))
    or exists (
      select 1
      from public.channels c
      join public.server_members sm
        on sm.server_id::text = c.server_id::text
      where c.room_key = p_room
        and sm.user_id::text = auth.uid()::text
        and sm.role in ('owner','admin','mod')
    )
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id::text = auth.uid()::text
        and ur.role in ('owner','admin','mod')
    )
$$;

-- everyone signed in can SEE pins
drop policy if exists pins_read on public.pinned_messages;
create policy pins_read on public.pinned_messages
  for select to authenticated
  using (true);

-- only room moderators (or DM participants) can ADD them,
-- and only as themselves
drop policy if exists pins_insert on public.pinned_messages;
create policy pins_insert on public.pinned_messages
  for insert to authenticated
  with check (
    pinned_by = auth.uid()
    and public.ycz_can_pin(room_id)
  );

-- same people can REMOVE them
drop policy if exists pins_delete on public.pinned_messages;
create policy pins_delete on public.pinned_messages
  for delete to authenticated
  using (public.ycz_can_pin(room_id));

grant select, insert, delete on public.pinned_messages to authenticated;


-- ═══════════════════════════════════════════════════════════════
--  VERIFY — every value should be true / 3
-- ═══════════════════════════════════════════════════════════════
select
  exists (select 1 from information_schema.columns
          where table_schema='public' and table_name='user_profiles'
            and column_name='bio')                        as bio_column,
  exists (select 1 from information_schema.tables
          where table_schema='public'
            and table_name='pinned_messages')             as pins_table,
  (select count(*) from pg_policies
   where schemaname='public'
     and tablename='pinned_messages')                     as pin_policies;
