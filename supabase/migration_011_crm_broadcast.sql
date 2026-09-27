-- ============================================================
-- MIGRASI: CRM Broadcast WhatsApp (Script Pesan + Target Kirim)
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan di database yang sudah ada data.
-- ============================================================

create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Lainnya', -- Promo | Pengingat Bayar | Restock | Ucapan/Relationship | Poin Reseller | Lainnya
  content text not null default '',
  created_at timestamptz default now()
);

create table if not exists broadcast_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_id uuid references message_templates(id),
  message_snapshot text not null default '', -- isi pesan (template) saat broadcast dibuat, sebelum dipersonalisasi per customer
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists broadcast_targets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references broadcast_campaigns(id) on delete cascade,
  customer_id uuid references customers(id),
  personalized_message text not null default '',
  status text not null default 'Belum Dikirim', -- 'Belum Dikirim' | 'Terkirim'
  sent_at timestamptz
);

alter table message_templates enable row level security;
alter table broadcast_campaigns enable row level security;
alter table broadcast_targets enable row level security;

do $$ begin create policy "authenticated all message_templates" on message_templates for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); exception when duplicate_object then null; end $$;
do $$ begin create policy "authenticated all broadcast_campaigns" on broadcast_campaigns for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); exception when duplicate_object then null; end $$;
do $$ begin create policy "authenticated all broadcast_targets" on broadcast_targets for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated'); exception when duplicate_object then null; end $$;

-- Contoh template awal (opsional, boleh dihapus/diedit) — aman dijalankan berkali-kali, tidak akan duplikat
insert into message_templates (name, category, content)
select 'Sapaan Umum', 'Ucapan/Relationship', 'Halo {nama} 👋, terima kasih sudah jadi bagian dari keluarga Alamme! Kalau ada kebutuhan produk, tim kami siap bantu ya 🙏'
where not exists (select 1 from message_templates where name = 'Sapaan Umum');
