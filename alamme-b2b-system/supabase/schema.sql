-- ============================================================
-- ALAMME B2B & RESELLER SYSTEM — SUPABASE SCHEMA
-- Jalankan seluruh file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILES (tim internal yang login) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text default 'staff', -- admin | sales | finance | logistik | staff
  created_at timestamptz default now()
);

-- ---------- CUSTOMERS ----------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'Reseller', -- Direct Customer | Hotel | Restoran | Cafe | Distributor | Reseller
  segment text not null default 'Domestik', -- Domestik | Mancanegara
  province text, province_id text,
  city text, city_id text,
  district text, district_id text,
  address_detail text,
  pic text,
  phone text,
  email text,
  pay_term text default 'Cash', -- Cash | CBD | COD | TOP 7 | TOP 14 | TOP 30 | TOP 45 | TOP 60
  margin numeric default 0,
  pkp boolean default true,
  points numeric default 0,
  notes text,
  created_at timestamptz default now()
);

-- ---------- PRODUCTS / SKU ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category text,
  uom text,
  price numeric not null default 0,
  created_at timestamptz default now()
);

-- ---------- CAMPAIGNS (aturan poin) ----------
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'revenue', -- revenue | product
  value_mode text not null default 'value', -- 'value' | 'percent'
  rp_per_point numeric default 10000,
  points_per_unit numeric default 0,
  percent_value numeric default 0, -- dipakai kalau value_mode = 'percent'
  product_ids uuid[] default '{}',
  customer_types text[] default '{Reseller}',
  start_date date,
  end_date date,
  active boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- ---------- ORDERS ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  customer_id uuid references customers(id),
  po_number text,
  order_date date not null default current_date,
  pay_term text not null default 'Cash',
  status text not null default 'Penawaran', -- Penawaran|PO Diterima|Diproses|Invoiced|Dikirim|Lunas|Batal
  discount numeric default 0,
  discount_type text not null default 'value', -- 'percent' | 'value' — mode diskon keseluruhan order
  discount_value numeric not null default 0, -- angka mentah sesuai mode (Rp atau %)
  ship_charge numeric default 0,
  ship_actual numeric default 0,
  other_cost numeric default 0,
  ppn boolean default false,
  due_date date,
  paid_date date,
  subtotal numeric default 0,
  grand_total numeric default 0,
  net_profit numeric default 0,
  net_margin numeric default 0,
  points_earned numeric default 0,
  -- shipping address (jika beda dari alamat customer)
  ship_same_as_customer boolean default true,
  ship_recipient_name text,
  ship_recipient_phone text,
  ship_province text, ship_city text, ship_district text, ship_address_detail text,
  -- dokumen
  invoice_no text,
  quo_no text,
  surat_jalan_no text,
  -- fulfillment
  fulfillment_status text default 'Perlu Disiapkan', -- Perlu Disiapkan|Disiapkan|Dikirim|Diterima|Retur Sebagian|Retur Total
  prepared_at date,
  shipped_at date,
  courier text,
  tracking_no text,
  delivered_at date,
  received_by text,
  fulfillment_notes text,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  qty numeric not null default 1,
  unit_price numeric not null default 0,
  discount_type text not null default 'percent', -- 'percent' | 'value' — diskon deal khusus per produk
  discount_value numeric not null default 0
);

create table if not exists order_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  return_date date not null default current_date,
  reason text,
  created_at timestamptz default now()
);

create table if not exists order_return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid references order_returns(id) on delete cascade,
  product_id uuid references products(id),
  qty numeric not null default 0
);

-- ---------- POINTS LEDGER ----------
create table if not exists points_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  order_id uuid references orders(id),
  ledger_date date not null default current_date,
  points numeric not null default 0,
  type text not null default 'earn', -- earn | redeem | adjust
  notes text,
  created_at timestamptz default now()
);

-- ---------- COMPANY SETTINGS (kop surat + rekening) ----------
create table if not exists company_settings (
  id text primary key, -- 'sda' | 'mba' | 'plain'
  name text,
  address text,
  city text,
  phone text,
  email text,
  npwp text,
  bank_accounts jsonb default '[]'
);

-- ---------- APP SETTINGS (nilai tukar poin, counter dokumen) ----------
create table if not exists app_settings (
  key text primary key,
  value jsonb
);

insert into company_settings (id, name, city) values
  ('sda', 'PT Semua Dari Alam', 'Bandung, Jawa Barat'),
  ('mba', 'PT Maju Bersama Alam', 'Bandung, Jawa Barat'),
  ('plain', '', '')
on conflict (id) do nothing;

insert into app_settings (key, value) values
  ('point_value', '1000'),
  ('invoice_counter', '0'),
  ('quo_counter', '0'),
  ('surat_jalan_counter', '0')
on conflict (key) do nothing;

-- ---------- SEED PRODUCTS (opsional, boleh dihapus/disesuaikan) ----------
insert into products (sku, name, category, uom, price) values
  ('BGR-001','Bawang Hitam Tunggal (Single Cloves)','Black Garlic','pcs (220g)',88825),
  ('BGR-002','Bawang Hitam Kating (Multicloves)','Black Garlic','pcs (250g)',76075),
  ('BGR-003','Bawang Hitam Bubuk (Powder)','Black Garlic','kg',299000),
  ('GRC-001','Bawang Putih Honan','Garlic','kg',29000),
  ('GRC-002','Bawang Putih Kating','Garlic','kg',37000),
  ('HNY-001','Madu Hitam Pahit','Honey','btl (800g)',59000),
  ('HNY-002','Madu Akasia','Honey','btl (1kg)',59000)
on conflict (sku) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY
-- Semua tabel hanya bisa diakses oleh user yang sudah login (tim internal).
-- Untuk pembatasan per-role (misal logistik tidak bisa hapus customer),
-- ini bisa diperketat belakangan menggunakan kolom profiles.role.
-- ============================================================
alter table profiles enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table campaigns enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_returns enable row level security;
alter table order_return_items enable row level security;
alter table points_ledger enable row level security;
alter table company_settings enable row level security;
alter table app_settings enable row level security;

create policy "authenticated read profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "self update profile" on profiles for update using (auth.uid() = id);
create policy "self insert profile" on profiles for insert with check (auth.uid() = id);

create policy "authenticated all customers" on customers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated all products" on products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated all campaigns" on campaigns for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated all orders" on orders for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated all order_items" on order_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated all order_returns" on order_returns for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated all order_return_items" on order_return_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated all points_ledger" on points_ledger for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated all company_settings" on company_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated all app_settings" on app_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- TRIGGER: auto-create profile row saat ada user baru daftar
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), 'staff');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
