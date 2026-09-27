alter table orders add column if not exists created_by uuid references profiles(id);
alter table orders add column if not exists notes text;
alter table orders add column if not exists delete_requested boolean not null default false;
alter table orders add column if not exists delete_requested_by uuid references profiles(id);
alter table orders add column if not exists delete_requested_at timestamptz;
alter table orders add column if not exists delete_request_note text;
-- PENTING: ubah kolom "role" di tabel profiles jadi 'admin' atau 'finance' untuk yang berwenang approve hapus order.
