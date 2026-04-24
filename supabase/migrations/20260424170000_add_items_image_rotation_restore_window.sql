alter table public.items
  add column if not exists image_original_url text,
  add column if not exists image_rotation_quarter_turns integer not null default 0,
  add column if not exists image_restore_expires_at timestamptz;

alter table public.items
  drop constraint if exists items_image_rotation_quarter_turns_check;

alter table public.items
  add constraint items_image_rotation_quarter_turns_check
  check (image_rotation_quarter_turns between 0 and 3);
