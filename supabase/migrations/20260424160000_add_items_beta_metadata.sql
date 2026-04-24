alter table public.items
  add column if not exists purchase_price numeric,
  add column if not exists purchase_year text,
  add column if not exists item_condition text;
