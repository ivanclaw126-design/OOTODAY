alter table public.items
  add column if not exists algorithm_meta jsonb not null default '{}'::jsonb;

alter table public.outfit_feedback_events
  alter column context set default 'today';

create index if not exists outfit_feedback_events_user_id_context_created_at_idx
  on public.outfit_feedback_events (user_id, context, created_at desc);

create index if not exists recommendation_preferences_updated_at_idx
  on public.recommendation_preferences (updated_at);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.recommendation_preferences'::regclass
      and conname = 'recommendation_preferences_user_id_fkey'
  ) then
    alter table public.recommendation_preferences
      drop constraint recommendation_preferences_user_id_fkey;
  end if;

  alter table public.recommendation_preferences
    add constraint recommendation_preferences_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.outfit_feedback_events'::regclass
      and conname = 'outfit_feedback_events_user_id_fkey'
  ) then
    alter table public.outfit_feedback_events
      drop constraint outfit_feedback_events_user_id_fkey;
  end if;

  alter table public.outfit_feedback_events
    add constraint outfit_feedback_events_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;
end $$;
