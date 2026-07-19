create table if not exists public.inquiries (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null,
  brand text,
  email text,
  contact text,
  preferred_contact text,
  project_type text not null,
  timeline text,
  budget text,
  message text not null,
  source text not null default 'website-intake',
  user_agent text,
  ip text,
  assigned_agent jsonb,
  reviewed boolean not null default false
);

create index if not exists inquiries_created_at_idx
  on public.inquiries (created_at desc);

create table if not exists public.ebook_orders (
  id uuid primary key,
  created_at timestamptz not null default now(),
  status text not null default 'payment_review',
  access_status text not null default 'locked_until_payment_verified',
  buyer jsonb not null,
  payment jsonb not null,
  items jsonb not null,
  currency text not null default 'PHP',
  subtotal numeric(12, 2) not null default 0,
  source text not null default 'ebook-checkout',
  user_agent text,
  ip text,
  reviewed boolean not null default false
);

create index if not exists ebook_orders_created_at_idx
  on public.ebook_orders (created_at desc);

alter table public.inquiries enable row level security;
alter table public.ebook_orders enable row level security;

drop policy if exists "service role manages inquiries" on public.inquiries;
create policy "service role manages inquiries"
  on public.inquiries
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "service role manages ebook orders" on public.ebook_orders;
create policy "service role manages ebook orders"
  on public.ebook_orders
  for all
  to service_role
  using (true)
  with check (true);

revoke all on public.inquiries, public.ebook_orders from anon, authenticated;
grant all on public.inquiries, public.ebook_orders to service_role;
