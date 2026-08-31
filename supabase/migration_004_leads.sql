-- ============================================================
-- MIGRASI: Leads Management
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan di database yang sudah ada data.
-- ============================================================

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) not null,
  contact_name text,      -- PIC untuk deal ini (default dari customer, bisa beda)
  contact_phone text,     -- WhatsApp
  contact_email text,
  deal_rating text not null default 'Warm', -- 'Hot' | 'Warm' | 'Cold'
  status text not null default 'Baru',      -- 'Baru' | 'Proses Follow-up' | 'Deal' | 'Gagal/Batal'
  next_follow_up_date date,
  source_order_id uuid references orders(id),     -- diisi otomatis kalau lead ini berasal dari order yang gagal/batal
  converted_order_id uuid references orders(id),  -- diisi otomatis begitu lead dikonversi jadi order baru
  notes text,
  created_at timestamptz default now()
);

create table if not exists lead_items (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  product_id uuid references products(id),
  current_brand text,          -- merek yang biasa dipakai customer sekarang (info kompetitor)
  usual_price numeric default 0,   -- harga yang biasa dibayar customer untuk produk ini
  frequency text not null default 'Bulanan', -- 'Harian' | 'Mingguan' | 'Bulanan'
  qty_per_frequency numeric default 0,       -- jumlah kebutuhan per periode di atas
  notes text
);

alter table leads enable row level security;
alter table lead_items enable row level security;

create policy "authenticated all leads" on leads for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated all lead_items" on lead_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
