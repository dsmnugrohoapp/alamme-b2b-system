-- ============================================================
-- CATCHUP_ALL.sql — Jalankan file INI SAJA kalau kamu tidak yakin
-- migrasi mana yang sudah/belum pernah dijalankan sebelumnya.
--
-- File ini merangkum SEMUA migrasi dari awal sampai sekarang, ditulis
-- dengan cara yang aman diulang (kalau sudah ada, dilewati — tidak
-- akan menghapus atau merusak data yang sudah ada).
--
-- Cara pakai: Supabase Dashboard > SQL Editor > New query >
-- paste semua isi file ini > Run.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Kolom tambahan di CUSTOMERS ----------
alter table customers add column if not exists order_token text;
update customers set order_token = encode(gen_random_bytes(9), 'hex') where order_token is null;
alter table customers alter column order_token set default encode(gen_random_bytes(9), 'hex');
create unique index if not exists customers_order_token_idx on customers (order_token);

-- ---------- Kolom tambahan di PRODUCTS ----------
alter table products add column if not exists commercial_name text;
alter table products add column if not exists image_url text;
alter table products add column if not exists description text;
alter table products add column if not exists variant_group text;
alter table products add column if not exists variant_label text;

-- ---------- Kolom tambahan di CAMPAIGNS ----------
alter table campaigns add column if not exists value_mode text not null default 'value';
alter table campaigns add column if not exists percent_value numeric not null default 0;

-- ---------- Kolom tambahan di ORDERS ----------
alter table orders add column if not exists discount_type text not null default 'value';
alter table orders add column if not exists discount_value numeric not null default 0;
alter table orders add column if not exists shipping_preference text;
alter table orders add column if not exists payment_method_preference text;

-- ---------- Kolom tambahan di ORDER_ITEMS ----------
alter table order_items add column if not exists discount_type text not null default 'percent';
alter table order_items add column if not exists discount_value numeric not null default 0;

-- ---------- LEADS MANAGEMENT (buat tabel kalau belum ada sama sekali) ----------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  deal_rating text not null default 'Warm',
  status text not null default 'Baru',
  next_follow_up_date date,
  source_order_id uuid references orders(id),
  converted_order_id uuid references orders(id),
  notes text,
  created_at timestamptz default now()
);

create table if not exists lead_items (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  product_id uuid references products(id),
  current_brand text,
  usual_price numeric default 0,
  frequency text not null default 'Bulanan',
  qty_per_frequency numeric default 0,
  unit text default '',
  notes text
);
alter table lead_items add column if not exists unit text default '';

alter table leads enable row level security;
alter table lead_items enable row level security;
do $$ begin create policy "authenticated all leads" on leads for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); exception when duplicate_object then null; end $$;
do $$ begin create policy "authenticated all lead_items" on lead_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); exception when duplicate_object then null; end $$;

-- ---------- VIEW analisis leads ----------
create or replace view v_leads_funnel as
select status, deal_rating, count(*) as jumlah_leads
from leads group by status, deal_rating order by status, deal_rating;

create or replace view v_leads_potential_value as
select
  l.id as lead_id, c.name as customer_name, l.status, l.deal_rating, l.next_follow_up_date,
  coalesce(sum(
    li.usual_price * li.qty_per_frequency * case li.frequency
      when 'Harian' then 30 when 'Mingguan' then 4.33 else 1 end
  ), 0) as estimasi_nilai_bulanan
from leads l
left join customers c on c.id = l.customer_id
left join lead_items li on li.lead_id = l.id
group by l.id, c.name, l.status, l.deal_rating, l.next_follow_up_date
order by estimasi_nilai_bulanan desc;

-- ---------- APP SETTINGS tambahan ----------
insert into app_settings (key, value) values ('public_order_company', '"sda"') on conflict (key) do nothing;

-- ---------- STORAGE bucket untuk gambar produk ----------
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do nothing;
do $$ begin create policy "product images public read" on storage.objects for select using (bucket_id = 'product-images'); exception when duplicate_object then null; end $$;
do $$ begin create policy "product images authenticated insert" on storage.objects for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated'); exception when duplicate_object then null; end $$;
do $$ begin create policy "product images authenticated update" on storage.objects for update using (bucket_id = 'product-images' and auth.role() = 'authenticated'); exception when duplicate_object then null; end $$;
do $$ begin create policy "product images authenticated delete" on storage.objects for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated'); exception when duplicate_object then null; end $$;

-- ============================================================
-- SELESAI. Kalau tidak ada tulisan merah/error di atas, semua beres.
-- ============================================================
