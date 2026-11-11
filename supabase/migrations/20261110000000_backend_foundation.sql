-- JobTracking backend foundation.
-- Apply with `npx supabase db push` after linking the project, or paste this
-- file into the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.application_status as enum (
  'draft',
  'applied',
  'interviewing',
  'offer',
  'rejected',
  'withdrawn'
);

create type public.ai_event_kind as enum (
  'job_match',
  'application_draft',
  'job_ingestion',
  'email_alert',
  'error'
);

create type public.ai_event_status as enum (
  'started',
  'succeeded',
  'failed'
);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  headline text,
  location text,
  skills text[] not null default '{}',
  resume_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (
    full_name is null or char_length(full_name) between 2 and 60
  ),
  constraint profiles_skills_limit check (cardinality(skills) <= 50)
);

comment on table public.profiles is 'Public profile data owned by each authenticated user.';

-- ---------------------------------------------------------------------------
-- Jobs and per-user matches
-- ---------------------------------------------------------------------------

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  company text not null,
  company_initials text,
  company_color text,
  company_logo_url text,
  title text not null,
  location text,
  is_remote boolean not null default false,
  salary text,
  description text,
  url text,
  tags text[] not null default '{}',
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_source_external_id_key unique (source, external_id)
);

comment on table public.jobs is 'Normalized job postings ingested from external sources.';

create table public.job_matches (
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  score smallint not null,
  reason text,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, job_id),
  constraint job_matches_score_range check (score between 0 and 100)
);

comment on table public.job_matches is 'AI-computed relevance score for a job and a user.';

create table public.saved_jobs (
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

comment on table public.saved_jobs is 'Jobs a user has bookmarked.';

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  company text not null,
  role text not null,
  status public.application_status not null default 'draft',
  applied_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.applications is 'Application pipeline entries owned by each user.';

-- ---------------------------------------------------------------------------
-- AI monitoring
-- ---------------------------------------------------------------------------

create table public.ai_monitoring_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  kind public.ai_event_kind not null,
  status public.ai_event_status not null default 'started',
  model text,
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(12, 6),
  latency_ms integer,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_monitoring_events_tokens_nonnegative check (
    (input_tokens is null or input_tokens >= 0)
    and (output_tokens is null or output_tokens >= 0)
  ),
  constraint ai_monitoring_events_cost_nonnegative check (cost_usd is null or cost_usd >= 0),
  constraint ai_monitoring_events_latency_nonnegative check (latency_ms is null or latency_ms >= 0)
);

comment on table public.ai_monitoring_events is 'Telemetry for AI calls, ingestion runs, and email alerts.';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index jobs_posted_at_idx on public.jobs (posted_at desc nulls last);
create index jobs_company_idx on public.jobs (company);
create index jobs_tags_idx on public.jobs using gin (tags);

create index job_matches_user_score_idx on public.job_matches (user_id, score desc);

create index saved_jobs_user_created_idx on public.saved_jobs (user_id, created_at desc);

create index applications_user_status_idx on public.applications (user_id, status);
create index applications_user_created_idx on public.applications (user_id, created_at desc);

create index ai_monitoring_events_user_created_idx
  on public.ai_monitoring_events (user_id, created_at desc);
create index ai_monitoring_events_kind_created_idx
  on public.ai_monitoring_events (kind, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

create trigger job_matches_set_updated_at
before update on public.job_matches
for each row execute function public.set_updated_at();

create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth <-> profile sync
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_name text;
begin
  next_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  if next_name is not null and char_length(next_name) not between 2 and 60 then
    next_name := null;
  end if;

  insert into public.profiles (id, full_name)
  values (new.id, next_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.sync_profile_full_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_name text;
begin
  if not (new.raw_user_meta_data ? 'full_name') then
    return new;
  end if;

  next_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  if next_name is not null and char_length(next_name) not between 2 and 60 then
    next_name := null;
  end if;

  update public.profiles
  set full_name = next_name
  where id = new.id
    and full_name is distinct from next_name;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger on_auth_user_updated
after update of raw_user_meta_data on auth.users
for each row execute function public.sync_profile_full_name();

revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.sync_profile_full_name() from public;

-- Backfill profiles for accounts created before this migration.
insert into public.profiles (id, full_name)
select
  users.id,
  case
    when char_length(btrim(coalesce(users.raw_user_meta_data ->> 'full_name', ''))) between 2 and 60
      then btrim(users.raw_user_meta_data ->> 'full_name')
    else null
  end
from auth.users as users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.job_matches enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.applications enable row level security;
alter table public.ai_monitoring_events enable row level security;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "jobs_select_authenticated"
  on public.jobs for select to authenticated
  using (true);

create policy "job_matches_select_own"
  on public.job_matches for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "saved_jobs_select_own"
  on public.saved_jobs for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "saved_jobs_insert_own"
  on public.saved_jobs for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "saved_jobs_delete_own"
  on public.saved_jobs for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "applications_select_own"
  on public.applications for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "applications_insert_own"
  on public.applications for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "applications_update_own"
  on public.applications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "applications_delete_own"
  on public.applications for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "ai_monitoring_events_select_own"
  on public.ai_monitoring_events for select to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on public.profiles from anon;
revoke all on public.jobs from anon;
revoke all on public.job_matches from anon;
revoke all on public.saved_jobs from anon;
revoke all on public.applications from anon;
revoke all on public.ai_monitoring_events from anon;

grant select, insert, update on public.profiles to authenticated;
grant select on public.jobs to authenticated;
grant select on public.job_matches to authenticated;
grant select, insert, delete on public.saved_jobs to authenticated;
grant select, insert, update, delete on public.applications to authenticated;
grant select on public.ai_monitoring_events to authenticated;

grant all on public.profiles to service_role;
grant all on public.jobs to service_role;
grant all on public.job_matches to service_role;
grant all on public.saved_jobs to service_role;
grant all on public.applications to service_role;
grant all on public.ai_monitoring_events to service_role;
