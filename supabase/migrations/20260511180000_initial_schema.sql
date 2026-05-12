-- Coral Canyon 3rd Ward Deacons Quorum Dashboard
-- Initial schema: enums, tables, indexes, updated_at triggers.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('adult_leader', 'youth', 'general');

create type public.event_type as enum (
  'sunday_school',
  'quorum_meeting',
  'activity',
  'camp',
  'service',
  'other'
);

create type public.leader_rsvp_status as enum (
  'attending',
  'unavailable',
  'undecided'
);

create type public.program_block_type as enum (
  'presiding',
  'conducting',
  'youth_theme',
  'opening_prayer',
  'teacher',
  'announcements',
  'musical_number',
  'lesson',
  'custom'
);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: 1-1 with auth.users
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  first_name text not null default '',
  last_name text not null default '',
  role public.app_role not null default 'general',
  birth_date date,
  avatar_color text,
  parent_of_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_birth_date_idx on public.profiles (birth_date)
  where birth_date is not null;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- callings: admin-managed organizational titles
-- ---------------------------------------------------------------------------

create table public.callings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index callings_sort_idx on public.callings (sort_order)
  where archived_at is null;

create trigger callings_set_updated_at
  before update on public.callings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- calling_assignments: many-to-many (profiles <-> callings)
-- ---------------------------------------------------------------------------

create table public.calling_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  calling_id uuid not null references public.callings (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, calling_id, assigned_at)
);

create index calling_assignments_profile_active_idx
  on public.calling_assignments (profile_id)
  where released_at is null;

create index calling_assignments_calling_active_idx
  on public.calling_assignments (calling_id)
  where released_at is null;

create trigger calling_assignments_set_updated_at
  before update on public.calling_assignments
  for each row execute function public.set_updated_at();

-- Constraint: only profiles with role='youth' can hold callings.
create or replace function public.ensure_calling_assignment_role()
returns trigger
language plpgsql
as $$
declare
  v_role public.app_role;
begin
  select role into v_role from public.profiles where id = new.profile_id;
  if v_role is null then
    raise exception 'Profile % not found', new.profile_id;
  end if;
  if v_role <> 'youth' then
    raise exception 'Only youth profiles can hold callings (got %)', v_role;
  end if;
  return new;
end;
$$;

create trigger calling_assignments_check_role
  before insert or update of profile_id on public.calling_assignments
  for each row execute function public.ensure_calling_assignment_role();

-- ---------------------------------------------------------------------------
-- events: the master calendar
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type public.event_type not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,
  description text,
  rsvp_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at >= start_at)
);

create index events_start_at_idx on public.events (start_at);
create index events_type_start_idx on public.events (type, start_at);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- announcements
-- ---------------------------------------------------------------------------

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index announcements_created_at_idx on public.announcements (created_at desc);

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- leader_rsvps: private to adult leaders
-- ---------------------------------------------------------------------------

create table public.leader_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  leader_id uuid not null references public.profiles (id) on delete cascade,
  status public.leader_rsvp_status not null default 'undecided',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, leader_id)
);

create index leader_rsvps_event_idx on public.leader_rsvps (event_id);

create trigger leader_rsvps_set_updated_at
  before update on public.leader_rsvps
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sunday_programs + program_blocks
-- ---------------------------------------------------------------------------

create table public.sunday_programs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events (id) on delete cascade,
  theme text,
  hymn text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sunday_programs_set_updated_at
  before update on public.sunday_programs
  for each row execute function public.set_updated_at();

create table public.program_blocks (
  id uuid primary key default gen_random_uuid(),
  sunday_program_id uuid not null references public.sunday_programs (id) on delete cascade,
  type public.program_block_type not null,
  label text not null,
  assignee_id uuid references public.profiles (id) on delete set null,
  notes text,
  position int not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index program_blocks_program_position_idx
  on public.program_blocks (sunday_program_id, position);
create index program_blocks_assignee_type_idx
  on public.program_blocks (assignee_id, type)
  where assignee_id is not null;

create trigger program_blocks_set_updated_at
  before update on public.program_blocks
  for each row execute function public.set_updated_at();

-- Constraint: program_blocks assignee must be adult_leader or youth.
create or replace function public.ensure_program_block_assignee_role()
returns trigger
language plpgsql
as $$
declare
  v_role public.app_role;
begin
  if new.assignee_id is null then
    return new;
  end if;
  select role into v_role from public.profiles where id = new.assignee_id;
  if v_role is null then
    raise exception 'Assignee profile % not found', new.assignee_id;
  end if;
  if v_role not in ('adult_leader', 'youth') then
    raise exception 'Program block assignee must be adult_leader or youth (got %)', v_role;
  end if;
  return new;
end;
$$;

create trigger program_blocks_check_assignee
  before insert or update of assignee_id on public.program_blocks
  for each row execute function public.ensure_program_block_assignee_role();
