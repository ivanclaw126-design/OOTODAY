create unique index if not exists ootd_user_id_worn_day_unique_idx
  on public.ootd (user_id, ((worn_at at time zone 'UTC')::date));
