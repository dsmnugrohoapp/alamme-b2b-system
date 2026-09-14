-- ============================================================
-- MIGRASI: Storage Bucket untuk Upload Gambar Produk
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan berkali-kali.
-- ============================================================

-- Bucket publik — gambar produk memang harus bisa dilihat siapa saja (termasuk customer
-- yang membuka halaman Order Mandiri tanpa login), makanya "public" true.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Siapa saja boleh MELIHAT gambar (perlu, karena dipakai di halaman publik Order Mandiri)
do $$ begin
  create policy "product images public read" on storage.objects
    for select using (bucket_id = 'product-images');
exception when duplicate_object then null; end $$;

-- Hanya tim yang login (staff) yang boleh UPLOAD / UBAH / HAPUS gambar
do $$ begin
  create policy "product images authenticated insert" on storage.objects
    for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "product images authenticated update" on storage.objects
    for update using (bucket_id = 'product-images' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "product images authenticated delete" on storage.objects
    for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
