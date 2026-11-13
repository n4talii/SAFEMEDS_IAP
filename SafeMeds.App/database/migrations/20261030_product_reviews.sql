-- Migration: Product Reviews Table for SafeMeds & Downstream MajiApp Integration
-- Description: Stores 1 to 5 star ratings and feedback comments for medications and water purification items.

create table if not exists public.product_reviews (
  id bigserial primary key,
  product_id bigint not null references public.inventory(id) on delete cascade,
  customer_name text not null check (length(trim(customer_name)) between 1 and 100),
  rating smallint not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now()
);

-- Index for fast lookup when querying reviews by product
create index if not exists idx_product_reviews_product_id on public.product_reviews(product_id);
create index if not exists idx_product_reviews_created_at on public.product_reviews(created_at desc);

-- Enable Row Level Security (RLS)
alter table public.product_reviews enable row level security;

-- Policy: Allow anyone (anon + authenticated) to read reviews (needed for dashboard and MajiApp)
create policy "Allow public read access to product_reviews"
  on public.product_reviews
  for select
  using (true);

-- Policy: Allow authenticated users or backend service key to insert reviews
create policy "Allow insert access to product_reviews"
  on public.product_reviews
  for insert
  with check (true);
