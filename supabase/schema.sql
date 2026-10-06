-- GraceBites database schema
-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor > New query).
-- It is safe to re-run: every statement is idempotent.

-- ---------------------------------------------------------------------------
-- Profiles: one row per signed-in (Google) user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  phone       text,
  address     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Menu: flavours and sizes (price = size price + flavour surcharge)
-- Prices are stored in the smallest currency unit (kobo for NGN).
-- ---------------------------------------------------------------------------
create table if not exists public.flavours (
  id           text primary key,
  name         text not null,
  description  text not null,
  surcharge    integer not null default 0 check (surcharge >= 0),
  sort_order   integer not null default 0,
  active       boolean not null default true
);

create table if not exists public.sizes (
  id           text primary key,
  name         text not null,
  description  text not null,
  price        integer not null check (price > 0),
  sort_order   integer not null default 0,
  active       boolean not null default true
);

insert into public.flavours (id, name, description, surcharge, sort_order) values
  ('salted',  'Salted',  'Classic butter-kissed popcorn with a pinch of sea salt.', 0,     1),
  ('sweet',   'Sweet',   'Light, sugar-dusted kernels for the sweet tooth.',        0,     2),
  ('caramel', 'Caramel', 'Slow-cooked golden caramel glaze on every piece.',        50000, 3),
  ('burnt',   'Burnt',   'Deep, smoky, extra-toasted caramel with a bitter edge.',  30000, 4)
on conflict (id) do update set
  name = excluded.name, description = excluded.description,
  surcharge = excluded.surcharge, sort_order = excluded.sort_order;

insert into public.sizes (id, name, description, price, sort_order) values
  ('mini',   'Mini',   'A handful to snack on the go.',       150000, 1),
  ('medium', 'Medium', 'Just right for one movie night.',     300000, 2),
  ('jumbo',  'Jumbo',  'Big enough to share with the squad.', 500000, 3)
on conflict (id) do update set
  name = excluded.name, description = excluded.description,
  price = excluded.price, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Cart: saved per user so it follows them across devices
-- ---------------------------------------------------------------------------
create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  flavour_id  text not null references public.flavours (id),
  size_id     text not null references public.sizes (id),
  quantity    integer not null check (quantity between 1 and 99),
  updated_at  timestamptz not null default now(),
  unique (user_id, flavour_id, size_id)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,
  user_id           uuid not null references auth.users (id) on delete cascade,
  customer_name     text not null,
  customer_email    text not null,
  phone             text not null,
  delivery_address  text not null,
  notes             text,
  payment_method    text not null default 'pay_on_delivery',
  status            text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  subtotal          integer not null,
  delivery_fee      integer not null default 0,
  total             integer not null,
  currency          text not null default 'NGN',
  email_sent_at     timestamptz,
  created_at        timestamptz not null default now()
);

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  flavour_id    text not null references public.flavours (id),
  size_id       text not null references public.sizes (id),
  flavour_name  text not null,
  size_name     text not null,
  unit_price    integer not null,
  quantity      integer not null check (quantity between 1 and 99),
  line_total    integer not null
);

create index if not exists orders_user_id_idx on public.orders (user_id, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists cart_items_user_id_idx on public.cart_items (user_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.flavours    enable row level security;
alter table public.sizes       enable row level security;
alter table public.cart_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Menu is public, read-only
drop policy if exists "menu flavours are public" on public.flavours;
create policy "menu flavours are public" on public.flavours for select using (true);
drop policy if exists "menu sizes are public" on public.sizes;
create policy "menu sizes are public" on public.sizes for select using (true);

-- Profiles: users see and edit only their own
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
drop policy if exists "own profile insert" on public.profiles;
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- Cart: full control over your own cart
drop policy if exists "own cart" on public.cart_items;
create policy "own cart" on public.cart_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Orders: users read their own. Orders are created only by the server
-- (service role key in /api/checkout), which bypasses RLS, so prices can't be tampered with.
drop policy if exists "own orders read" on public.orders;
create policy "own orders read" on public.orders for select using (auth.uid() = user_id);
drop policy if exists "own order items read" on public.order_items;
create policy "own order items read" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- Realtime: broadcast cart changes so the website and mobile app stay in sync
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cart_items'
  ) then
    alter publication supabase_realtime add table public.cart_items;
  end if;
end;
$$;
