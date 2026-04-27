create table if not exists public.today_recommendation_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_date text not null check (target_date in ('today', 'tomorrow')),
  scene_key text not null default 'default',
  city text,
  item_count integer not null default 0,
  weather_state jsonb not null,
  recommendations jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, target_date, scene_key)
);

create index if not exists today_recommendation_cache_user_updated_idx
  on public.today_recommendation_cache (user_id, updated_at desc);

alter table public.today_recommendation_cache enable row level security;

drop policy if exists "today_recommendation_cache_select_own" on public.today_recommendation_cache;
drop policy if exists "today_recommendation_cache_insert_own" on public.today_recommendation_cache;
drop policy if exists "today_recommendation_cache_update_own" on public.today_recommendation_cache;
drop policy if exists "today_recommendation_cache_delete_own" on public.today_recommendation_cache;

create policy "today_recommendation_cache_select_own"
  on public.today_recommendation_cache for select
  using (auth.uid() = user_id);

create policy "today_recommendation_cache_insert_own"
  on public.today_recommendation_cache for insert
  with check (auth.uid() = user_id);

create policy "today_recommendation_cache_update_own"
  on public.today_recommendation_cache for update
  using (auth.uid() = user_id);

create policy "today_recommendation_cache_delete_own"
  on public.today_recommendation_cache for delete
  using (auth.uid() = user_id);
