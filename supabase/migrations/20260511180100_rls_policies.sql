-- RLS policies for all tables.
-- Helpers run as SECURITY DEFINER so they don't recursively trigger RLS on profiles.

create or replace function public.is_adult_leader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'adult_leader'
  )
$$;

create or replace function public.can_edit_program()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('adult_leader', 'youth')
  )
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy "profiles read for authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles self update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles adult_leader manage"
  on public.profiles for update
  to authenticated
  using (public.is_adult_leader())
  with check (public.is_adult_leader());

create policy "profiles adult_leader delete"
  on public.profiles for delete
  to authenticated
  using (public.is_adult_leader());

-- ---------------------------------------------------------------------------
-- callings + calling_assignments: adult_leader only writes
-- ---------------------------------------------------------------------------

alter table public.callings enable row level security;

create policy "callings read for authenticated"
  on public.callings for select to authenticated using (true);

create policy "callings adult_leader write"
  on public.callings for all
  to authenticated
  using (public.is_adult_leader())
  with check (public.is_adult_leader());

alter table public.calling_assignments enable row level security;

create policy "calling_assignments read for authenticated"
  on public.calling_assignments for select to authenticated using (true);

create policy "calling_assignments adult_leader write"
  on public.calling_assignments for all
  to authenticated
  using (public.is_adult_leader())
  with check (public.is_adult_leader());

-- ---------------------------------------------------------------------------
-- events: adult_leader only writes
-- ---------------------------------------------------------------------------

alter table public.events enable row level security;

create policy "events read for authenticated"
  on public.events for select to authenticated using (true);

create policy "events adult_leader write"
  on public.events for all
  to authenticated
  using (public.is_adult_leader())
  with check (public.is_adult_leader());

-- ---------------------------------------------------------------------------
-- announcements: adult_leader inserts as themselves; author or leader edits
-- ---------------------------------------------------------------------------

alter table public.announcements enable row level security;

create policy "announcements read for authenticated"
  on public.announcements for select to authenticated using (true);

create policy "announcements adult_leader insert as self"
  on public.announcements for insert
  to authenticated
  with check (public.is_adult_leader() and author_id = auth.uid());

create policy "announcements author or leader update"
  on public.announcements for update
  to authenticated
  using (author_id = auth.uid() or public.is_adult_leader())
  with check (author_id = auth.uid() or public.is_adult_leader());

create policy "announcements author or leader delete"
  on public.announcements for delete
  to authenticated
  using (author_id = auth.uid() or public.is_adult_leader());

-- ---------------------------------------------------------------------------
-- leader_rsvps: PRIVATE to adult leaders; each leader manages their own
-- ---------------------------------------------------------------------------

alter table public.leader_rsvps enable row level security;

create policy "leader_rsvps leader read"
  on public.leader_rsvps for select
  to authenticated
  using (public.is_adult_leader());

create policy "leader_rsvps leader insert own"
  on public.leader_rsvps for insert
  to authenticated
  with check (public.is_adult_leader() and leader_id = auth.uid());

create policy "leader_rsvps leader update own"
  on public.leader_rsvps for update
  to authenticated
  using (public.is_adult_leader() and leader_id = auth.uid())
  with check (public.is_adult_leader() and leader_id = auth.uid());

create policy "leader_rsvps leader delete own"
  on public.leader_rsvps for delete
  to authenticated
  using (public.is_adult_leader() and leader_id = auth.uid());

-- ---------------------------------------------------------------------------
-- sunday_programs + program_blocks: adult_leader OR youth can write
-- ---------------------------------------------------------------------------

alter table public.sunday_programs enable row level security;

create policy "sunday_programs read for authenticated"
  on public.sunday_programs for select to authenticated using (true);

create policy "sunday_programs program editors write"
  on public.sunday_programs for all
  to authenticated
  using (public.can_edit_program())
  with check (public.can_edit_program());

alter table public.program_blocks enable row level security;

create policy "program_blocks read for authenticated"
  on public.program_blocks for select to authenticated using (true);

create policy "program_blocks program editors write"
  on public.program_blocks for all
  to authenticated
  using (public.can_edit_program())
  with check (public.can_edit_program());
