-- ============================================================
-- MIGRASI: Mode Persentase/Margin untuk Campaign Poin
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan di database yang sudah ada data.
-- ============================================================

alter table campaigns add column if not exists value_mode text not null default 'value'; -- 'value' | 'percent'
alter table campaigns add column if not exists percent_value numeric not null default 0; -- dipakai kalau value_mode = 'percent'

-- Penjelasan:
-- type='revenue' + value_mode='value'   -> pakai rp_per_point (Rp per 1 poin) — cara lama
-- type='revenue' + value_mode='percent' -> pakai percent_value (% dari nilai transaksi menjadi poin)
-- type='product' + value_mode='value'   -> pakai points_per_unit (poin tetap per unit) — cara lama
-- type='product' + value_mode='percent' -> pakai percent_value (% dari harga produk per unit menjadi poin)
-- Poin dari mode persen dikonversi memakai Nilai Tukar Poin di menu Pengaturan (app_settings.point_value)
