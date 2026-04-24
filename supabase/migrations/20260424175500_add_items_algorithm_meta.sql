alter table public.items
  add column if not exists algorithm_meta jsonb not null default '{}'::jsonb;
