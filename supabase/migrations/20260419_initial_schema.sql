create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  city text,
  style_preferences text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  image_url text,
  category text not null,
  sub_category text,
  color_category text,
  style_tags text[] not null default '{}',
  season_tags text[] not null default '{}',
  brand text,
  last_worn_date date,
  wear_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  item_ids uuid[] not null default '{}',
  scenario text,
  created_at timestamptz not null default now()
);

create table if not exists public.ootd (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  outfit_id uuid references public.outfits (id) on delete set null,
  photo_url text,
  satisfaction_score integer check (satisfaction_score between 1 and 5),
  worn_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists items_user_id_created_at_idx on public.items (user_id, created_at desc);
create index if not exists outfits_user_id_created_at_idx on public.outfits (user_id, created_at desc);
create index if not exists ootd_user_id_worn_at_idx on public.ootd (user_id, worn_at desc);

alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.outfits enable row level security;
alter table public.ootd enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "items_select_own" on public.items;
drop policy if exists "items_insert_own" on public.items;
drop policy if exists "items_update_own" on public.items;
drop policy if exists "items_delete_own" on public.items;
drop policy if exists "outfits_select_own" on public.outfits;
drop policy if exists "outfits_insert_own" on public.outfits;
drop policy if exists "outfits_update_own" on public.outfits;
drop policy if exists "outfits_delete_own" on public.outfits;
drop policy if exists "ootd_select_own" on public.ootd;
drop policy if exists "ootd_insert_own" on public.ootd;
drop policy if exists "ootd_update_own" on public.ootd;
drop policy if exists "ootd_delete_own" on public.ootd;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "items_select_own" on public.items for select using (auth.uid() = user_id);
create policy "items_insert_own" on public.items for insert with check (auth.uid() = user_id);
create policy "items_update_own" on public.items for update using (auth.uid() = user_id);
create policy "items_delete_own" on public.items for delete using (auth.uid() = user_id);

create policy "outfits_select_own" on public.outfits for select using (auth.uid() = user_id);
create policy "outfits_insert_own" on public.outfits for insert with check (auth.uid() = user_id);
create policy "outfits_update_own" on public.outfits for update using (auth.uid() = user_id);
create policy "outfits_delete_own" on public.outfits for delete using (auth.uid() = user_id);

create policy "ootd_select_own" on public.ootd for select using (auth.uid() = user_id);
create policy "ootd_insert_own" on public.ootd for insert with check (auth.uid() = user_id);
create policy "ootd_update_own" on public.ootd for update using (auth.uid() = user_id);
create policy "ootd_delete_own" on public.ootd for delete using (auth.uid() = user_id);
