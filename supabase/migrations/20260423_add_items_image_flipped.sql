alter table public.items
  add column if not exists image_flipped boolean not null default false;
