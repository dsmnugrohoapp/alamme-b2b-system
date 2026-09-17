-- ============================================================
-- MIGRASI: Tampilan Katalog untuk Order Mandiri Customer
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan di database yang sudah ada data.
-- ============================================================

-- Info tampilan produk (khusus dipakai di halaman Order Mandiri customer)
alter table products add column if not exists commercial_name text; -- nama dagang/marketing, beda dari nama internal
alter table products add column if not exists image_url text;       -- link gambar produk
alter table products add column if not exists description text;     -- deskripsi singkat (sertifikasi, keunggulan, dll)
alter table products add column if not exists variant_group text;   -- kode pengelompokan varian (produk dgn variant_group sama akan tampil sebagai 1 kartu dgn pilihan varian)
alter table products add column if not exists variant_label text;   -- label varian yang tampil ke customer (mis. "250g", "1kg")

-- Preferensi customer saat order mandiri (bukan status operasional — staff tetap konfirmasi manual)
alter table orders add column if not exists shipping_preference text;         -- 'Kurir Internal Alamme' | 'Kurir Lain (JNE/J&T/dll)'
alter table orders add column if not exists payment_method_preference text;   -- 'Transfer Bank' | 'Sesuai Termin (Invoice)' | 'COD'

-- Pengaturan: kop surat/rekening mana yang ditampilkan di halaman Order Mandiri
insert into app_settings (key, value) values ('public_order_company', '"sda"')
on conflict (key) do nothing;
