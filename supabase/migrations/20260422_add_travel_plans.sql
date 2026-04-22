create table if not exists public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  destination_city text not null,
  days integer not null check (days between 1 and 30),
  scenes text[] not null default '{}',
  weather_summary text,
  plan_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists travel_plans_user_id_created_at_idx on public.travel_plans (user_id, created_at desc);

alter table public.travel_plans enable row level security;

drop policy if exists "travel_plans_select_own" on public.travel_plans;
drop policy if exists "travel_plans_insert_own" on public.travel_plans;
drop policy if exists "travel_plans_update_own" on public.travel_plans;
drop policy if exists "travel_plans_delete_own" on public.travel_plans;

create policy "travel_plans_select_own" on public.travel_plans for select using (auth.uid() = user_id);
create policy "travel_plans_insert_own" on public.travel_plans for insert with check (auth.uid() = user_id);
create policy "travel_plans_update_own" on public.travel_plans for update using (auth.uid() = user_id);
create policy "travel_plans_delete_own" on public.travel_plans for delete using (auth.uid() = user_id);
