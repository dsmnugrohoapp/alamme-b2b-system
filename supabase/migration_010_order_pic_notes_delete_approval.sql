-- ============================================================
-- MIGRASI: PIC Order, Catatan Order, dan Approval Hapus Order
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan di database yang sudah ada data.
-- ============================================================

-- PIC (siapa dari tim Alamme yang input order ini)
alter table orders add column if not exists created_by uuid references profiles(id);

-- Catatan bebas di order
alter table orders add column if not exists notes text;

-- Alur approval hapus order
alter table orders add column if not exists delete_requested boolean not null default false;
alter table orders add column if not exists delete_requested_by uuid references profiles(id);
alter table orders add column if not exists delete_requested_at timestamptz;
alter table orders add column if not exists delete_request_note text;

-- ============================================================
-- PENTING — supaya fitur approval berfungsi:
-- Tentukan siapa yang berperan sebagai Admin/Finance (boleh langsung hapus
-- order & menyetujui/menolak permintaan hapus dari staff lain), dengan
-- mengisi kolom "role" di tabel profiles jadi 'admin' atau 'finance'.
--
-- Caranya: Supabase Dashboard > Table Editor > tabel "profiles" >
-- cari baris orang yang dimaksud > ubah kolom "role" jadi admin atau finance.
--
-- Semua akun yang role-nya BUKAN admin/finance (default: "staff") akan
-- otomatis mengirim PERMINTAAN hapus (bukan langsung menghapus) saat klik
-- tombol Hapus di menu Order.
-- ============================================================
