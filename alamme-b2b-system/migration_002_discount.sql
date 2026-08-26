-- ============================================================
-- MIGRASI: Diskon dinamis (persentase / nominal) per item & per order
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan di database yang sudah ada data (tidak menghapus apa pun).
-- ============================================================

-- Diskon per baris item order (deal khusus per produk untuk reseller/distributor)
alter table order_items add column if not exists discount_type text not null default 'percent'; -- 'percent' | 'value'
alter table order_items add column if not exists discount_value numeric not null default 0;

-- Diskon keseluruhan order (toko) — bisa dipilih mode Rupiah atau Persentase
alter table orders add column if not exists discount_type text not null default 'value'; -- 'percent' | 'value'
alter table orders add column if not exists discount_value numeric not null default 0; -- angka mentah sesuai mode (Rp atau %)

-- Kolom `orders.discount` yang lama tetap dipakai untuk menyimpan hasil akhir dalam Rupiah,
-- supaya semua kalkulasi & laporan lama tetap kompatibel.
