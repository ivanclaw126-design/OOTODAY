create table if not exists public.recommendation_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  version bigint not null,
  source text not null default 'default' check (source in ('default', 'questionnaire', 'adaptive')),
  default_weights jsonb not null,
  questionnaire_delta jsonb not null default '{}'::jsonb,
  rating_delta jsonb not null default '{}'::jsonb,
  final_weights jsonb not null,
  profile jsonb not null,
  questionnaire_answers jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outfit_feedback_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recommendation_id text,
  preference_version bigint,
  context text not null default 'today',
  rating integer not null check (rating between 1 and 5),
  reason_tags text[] not null default '{}',
  recommendation_snapshot jsonb,
  component_scores jsonb,
  created_at timestamptz not null default now()
);

create index if not exists outfit_feedback_events_user_id_created_at_idx
  on public.outfit_feedback_events (user_id, created_at desc);

create index if not exists outfit_feedback_events_user_id_context_created_at_idx
  on public.outfit_feedback_events (user_id, context, created_at desc);

create index if not exists recommendation_preferences_updated_at_idx
  on public.recommendation_preferences (updated_at);

alter table public.recommendation_preferences enable row level security;
alter table public.outfit_feedback_events enable row level security;

drop policy if exists "recommendation_preferences_select_own" on public.recommendation_preferences;
drop policy if exists "recommendation_preferences_insert_own" on public.recommendation_preferences;
drop policy if exists "recommendation_preferences_update_own" on public.recommendation_preferences;
drop policy if exists "recommendation_preferences_delete_own" on public.recommendation_preferences;

drop policy if exists "outfit_feedback_events_select_own" on public.outfit_feedback_events;
drop policy if exists "outfit_feedback_events_insert_own" on public.outfit_feedback_events;

create policy "recommendation_preferences_select_own"
  on public.recommendation_preferences for select
  using (auth.uid() = user_id);

create policy "recommendation_preferences_insert_own"
  on public.recommendation_preferences for insert
  with check (auth.uid() = user_id);

create policy "recommendation_preferences_update_own"
  on public.recommendation_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "outfit_feedback_events_select_own"
  on public.outfit_feedback_events for select
  using (auth.uid() = user_id);

create policy "outfit_feedback_events_insert_own"
  on public.outfit_feedback_events for insert
  with check (auth.uid() = user_id);
