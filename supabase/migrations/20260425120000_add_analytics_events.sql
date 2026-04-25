create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  anonymous_id text,
  session_id text,
  event_name text not null,
  module text not null,
  route text,
  properties jsonb not null default '{}'::jsonb,
  user_agent text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_user_id_created_at_idx
  on public.analytics_events (user_id, created_at desc);

create index if not exists analytics_events_event_name_created_at_idx
  on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_module_created_at_idx
  on public.analytics_events (module, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_events_insert_authenticated" on public.analytics_events;

create policy "analytics_events_insert_authenticated"
  on public.analytics_events for insert
  to authenticated
  with check (auth.uid() = user_id);
