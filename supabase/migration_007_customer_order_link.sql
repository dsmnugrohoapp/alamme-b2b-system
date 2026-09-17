-- ============================================================
-- MIGRASI: Link Order Mandiri untuk Customer
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan di database yang sudah ada data (tidak menghapus apa pun).
-- ============================================================

alter table customers add column if not exists order_token text;
update customers set order_token = encode(gen_random_bytes(9), 'hex') where order_token is null;
alter table customers alter column order_token set default encode(gen_random_bytes(9), 'hex');
create unique index if not exists customers_order_token_idx on customers (order_token);

-- Setelah ini setiap customer (lama maupun baru) otomatis punya order_token unik.
-- Link order mandiri mereka: https://domain-kamu.vercel.app/order/<order_token>
-- Bisa dilihat & disalin dari menu Customer di aplikasi (tombol "Salin Link Order").
