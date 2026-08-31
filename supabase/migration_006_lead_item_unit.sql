-- ============================================================
-- MIGRASI: Satuan Kebutuhan di Produk yang Diminati (Leads)
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan di database yang sudah ada data.
-- ============================================================

alter table lead_items add column if not exists unit text default '';
-- Contoh isian: kg, pcs, liter, karton, dus, sak — bebas teks, tidak harus sama dengan UoM default produk,
-- karena kebutuhan customer bisa beda satuan dari kemasan standar produk.
