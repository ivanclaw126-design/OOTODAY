create table if not exists public.recommendation_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surface text not null check (surface in ('today', 'shop', 'inspiration', 'travel')),
  event_type text not null check (
    event_type in (
      'exposed',
      'opened',
      'skipped',
      'saved',
      'worn',
      'rated_good',
      'repeated',
      'replaced_item',
      'disliked',
      'hidden_item'
    )
  ),
  event_value numeric not null default 0,
  recommendation_id text,
  candidate_id text,
  item_ids uuid[] not null default '{}',
  context jsonb not null default '{}'::jsonb,
  score_breakdown jsonb,
  model_run_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendation_model_runs (
  id uuid primary key default gen_random_uuid(),
  model_version text not null,
  status text not null default 'training' check (status in ('training', 'failed', 'completed', 'promoted', 'retired')),
  algorithm_bundle text not null default 'lightfm_implicit_xgboost',
  metrics jsonb not null default '{}'::jsonb,
  feature_schema jsonb not null default '{}'::jsonb,
  promoted_at timestamptz,
  trained_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendation_model_artifacts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.recommendation_model_runs (id) on delete cascade,
  artifact_type text not null check (artifact_type in ('lightfm', 'implicit_als', 'xgboost_ranker', 'feature_schema', 'shadow_report')),
  storage_bucket text not null,
  storage_path text not null,
  checksum text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendation_model_candidate_scores (
  run_id uuid not null references public.recommendation_model_runs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  surface text not null check (surface in ('today', 'shop', 'inspiration', 'travel')),
  candidate_id text not null,
  xgboost_score numeric not null default 0,
  lightfm_score numeric not null default 0,
  implicit_score numeric not null default 0,
  rule_score numeric not null default 0,
  final_score numeric not null default 0,
  feature_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (run_id, user_id, surface, candidate_id)
);

create table if not exists public.recommendation_model_entity_scores (
  run_id uuid not null references public.recommendation_model_runs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  surface text not null check (surface in ('today', 'shop', 'inspiration', 'travel')),
  entity_type text not null,
  entity_id text not null,
  lightfm_score numeric not null default 0,
  implicit_score numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (run_id, user_id, surface, entity_type, entity_id)
);

create index if not exists recommendation_interactions_user_surface_created_idx
  on public.recommendation_interactions (user_id, surface, created_at desc);

create index if not exists recommendation_interactions_event_type_created_idx
  on public.recommendation_interactions (event_type, created_at desc);

create unique index if not exists recommendation_model_runs_single_promoted_idx
  on public.recommendation_model_runs ((status))
  where status = 'promoted';

create index if not exists recommendation_model_candidate_scores_user_surface_idx
  on public.recommendation_model_candidate_scores (user_id, surface, final_score desc);

create index if not exists recommendation_model_entity_scores_user_surface_idx
  on public.recommendation_model_entity_scores (user_id, surface, entity_type);

alter table public.recommendation_interactions enable row level security;
alter table public.recommendation_model_runs enable row level security;
alter table public.recommendation_model_artifacts enable row level security;
alter table public.recommendation_model_candidate_scores enable row level security;
alter table public.recommendation_model_entity_scores enable row level security;

drop policy if exists "recommendation_interactions_select_own" on public.recommendation_interactions;
drop policy if exists "recommendation_interactions_insert_own" on public.recommendation_interactions;
drop policy if exists "recommendation_model_runs_select_authenticated" on public.recommendation_model_runs;
drop policy if exists "recommendation_model_artifacts_select_authenticated" on public.recommendation_model_artifacts;
drop policy if exists "recommendation_model_candidate_scores_select_own" on public.recommendation_model_candidate_scores;
drop policy if exists "recommendation_model_entity_scores_select_own" on public.recommendation_model_entity_scores;

create policy "recommendation_interactions_select_own"
  on public.recommendation_interactions for select
  using (auth.uid() = user_id);

create policy "recommendation_interactions_insert_own"
  on public.recommendation_interactions for insert
  with check (auth.uid() = user_id);

create policy "recommendation_model_runs_select_authenticated"
  on public.recommendation_model_runs for select
  using (auth.role() = 'authenticated');

create policy "recommendation_model_artifacts_select_authenticated"
  on public.recommendation_model_artifacts for select
  using (auth.role() = 'authenticated');

create policy "recommendation_model_candidate_scores_select_own"
  on public.recommendation_model_candidate_scores for select
  using (auth.uid() = user_id);

create policy "recommendation_model_entity_scores_select_own"
  on public.recommendation_model_entity_scores for select
  using (auth.uid() = user_id);
