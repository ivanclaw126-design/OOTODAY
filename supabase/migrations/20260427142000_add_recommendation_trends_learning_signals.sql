create table if not exists public.recommendation_trends (
  id uuid primary key default gen_random_uuid(),
  tag text not null unique,
  source text not null default 'editorial' check (source in ('editorial', 'manual', 'import')),
  aliases text[] not null default '{}',
  start_date date not null default current_date,
  end_date date,
  weight numeric not null default 1 check (weight >= 0 and weight <= 3),
  decay_rate numeric not null default 0.02 check (decay_rate >= 0 and decay_rate <= 1),
  applicable_scenes text[] not null default '{}',
  applicable_styles text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'paused', 'expired')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recommendation_learning_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  surface text not null check (surface in ('today', 'shop', 'inspiration', 'travel')),
  signal_type text not null check (signal_type in ('user_item_context', 'item_pair', 'color', 'silhouette', 'hidden_item')),
  entity_key text not null,
  related_entity_key text,
  context_key text,
  value numeric not null default 0 check (value >= -1 and value <= 1),
  weight numeric not null default 1 check (weight >= 0 and weight <= 3),
  source_event_type text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recommendation_trends_status_window_idx
  on public.recommendation_trends (status, start_date, end_date);

create index if not exists recommendation_learning_signals_user_surface_created_idx
  on public.recommendation_learning_signals (user_id, surface, created_at desc);

create index if not exists recommendation_learning_signals_user_signal_entity_idx
  on public.recommendation_learning_signals (user_id, signal_type, entity_key);

alter table public.recommendation_trends enable row level security;
alter table public.recommendation_learning_signals enable row level security;

drop policy if exists "recommendation_trends_select_authenticated" on public.recommendation_trends;
drop policy if exists "recommendation_learning_signals_select_own" on public.recommendation_learning_signals;
drop policy if exists "recommendation_learning_signals_insert_own" on public.recommendation_learning_signals;

create policy "recommendation_trends_select_authenticated"
  on public.recommendation_trends for select
  using (auth.role() = 'authenticated');

create policy "recommendation_learning_signals_select_own"
  on public.recommendation_learning_signals for select
  using (auth.uid() = user_id);

create policy "recommendation_learning_signals_insert_own"
  on public.recommendation_learning_signals for insert
  with check (auth.uid() = user_id);

insert into public.recommendation_trends
  (tag, source, aliases, start_date, weight, decay_rate, applicable_scenes, applicable_styles, status, metadata)
values
  ('brooch', 'editorial', array['胸针'], date '2026-04-01', 0.9, 0.015, array['work', 'date', 'party'], array['classic', '复古'], 'active', '{"seed":"phase11"}'::jsonb),
  ('lace', 'editorial', array['蕾丝'], date '2026-04-01', 0.85, 0.018, array['date', 'party'], array['浪漫', '甜美'], 'active', '{"seed":"phase11"}'::jsonb),
  ('cool blue', 'editorial', array['蓝色', '浅蓝色', '冰蓝'], date '2026-04-01', 0.8, 0.012, array['work', 'casual', 'travel'], array['清爽', '极简'], 'active', '{"seed":"phase11"}'::jsonb),
  ('khaki', 'editorial', array['卡其', '卡其色'], date '2026-04-01', 0.78, 0.012, array['work', 'casual', 'travel'], array['通勤', '户外'], 'active', '{"seed":"phase11"}'::jsonb),
  ('poetcore', 'editorial', array['诗人风', '浪漫复古'], date '2026-04-01', 0.72, 0.02, array['date', 'casual'], array['浪漫', '复古'], 'active', '{"seed":"phase11"}'::jsonb),
  ('glamoratti', 'editorial', array['华丽', '派对感'], date '2026-04-01', 0.7, 0.02, array['party', 'date'], array['华丽'], 'active', '{"seed":"phase11"}'::jsonb),
  ('structured shoulder', 'editorial', array['垫肩', '廓形肩'], date '2026-04-01', 0.82, 0.014, array['work', 'party'], array['通勤', '强气场'], 'active', '{"seed":"phase11"}'::jsonb),
  ('funnel neck', 'editorial', array['高领', '漏斗领'], date '2026-04-01', 0.74, 0.016, array['work', 'casual'], array['极简', '通勤'], 'active', '{"seed":"phase11"}'::jsonb),
  ('celestial', 'editorial', array['星月', '星星', '月亮'], date '2026-04-01', 0.68, 0.025, array['party', 'date'], array['浪漫', '配饰重点'], 'active', '{"seed":"phase11"}'::jsonb)
on conflict (tag) do update set
  aliases = excluded.aliases,
  weight = excluded.weight,
  decay_rate = excluded.decay_rate,
  applicable_scenes = excluded.applicable_scenes,
  applicable_styles = excluded.applicable_styles,
  status = excluded.status,
  metadata = public.recommendation_trends.metadata || excluded.metadata,
  updated_at = now();
