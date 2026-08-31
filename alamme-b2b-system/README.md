# Alamme B2B & Reseller System

Aplikasi web (Next.js + Supabase + Vercel) untuk order management, kalkulator margin/PPN,
poin reseller, fulfillment, dan invoice/quotation — bisa diakses banyak orang sekaligus
(sales, finance, logistik) dari HP atau laptop, dengan data yang benar-benar tersinkron.

Ini BUKAN Claude Artifact — ini source code project Next.js sungguhan yang perlu kamu
(atau saya bantu lewat Claude Code) build dan deploy sendiri, karena environment chat ini
tidak punya akses internet untuk membuat project Supabase / deploy ke Vercel secara langsung.

---

## Yang sudah dibuat

- Struktur project Next.js 14 (App Router) + TypeScript + Tailwind
- Skema database lengkap untuk Supabase (`supabase/schema.sql`) — tinggal dijalankan sekali
- Login multi-user via Supabase Auth
- Semua fitur dari versi sebelumnya: Customer (+ import bulk CSV/XLSX + alamat
  Provinsi/Kota/Kecamatan), Produk/SKU, Order & Kalkulator (diskon/ongkir/PPN/margin,
  alamat kirim terpisah, search customer), Campaign & Poin Reseller, Fulfillment
  (siapkan → kirim → diterima → retur), Invoice/Quotation/Surat Jalan otomatis + download
  PDF, multi rekening bank + opsi tanpa kop surat, dan Laporan export ke Excel.

## Yang perlu kamu lakukan (± 20-30 menit)

### 1. Buat project Supabase
1. Buka https://supabase.com → Sign up / Login → **New project**.
2. Setelah project jadi, buka **SQL Editor** → **New query**.
3. Copy seluruh isi file `supabase/schema.sql` → paste → **Run**.
   Ini akan membuat semua tabel, keamanan (RLS), dan data awal (produk contoh).
4. Buka **Project Settings > API** → catat **Project URL** dan **anon public key**.

### 2. Buat akun login untuk tim
1. Di Supabase Dashboard → **Authentication > Users > Add user**.
2. Buat satu akun per anggota tim (email + password). Tidak perlu self sign-up karena
   halaman login di aplikasi ini hanya untuk sign-in, bukan daftar sendiri.

### 3. Jalankan project di komputer kamu (untuk cek dulu)
```bash
npm install
cp .env.local.example .env.local
# lalu isi .env.local dengan Project URL & anon key dari langkah 1
npm run dev
```
Buka http://localhost:3000 → login pakai akun yang dibuat di langkah 2.

### 4. Deploy ke Vercel
1. Push folder project ini ke repository GitHub (buat repo baru, `git init` → `git add .` →
   `git commit -m "init"` → push).
2. Buka https://vercel.com → **Add New Project** → import repo GitHub tersebut.
3. Saat konfigurasi, isi **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL dari Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key dari Supabase
4. Klik **Deploy**. Setelah selesai, kamu dapat URL seperti `alamme-b2b.vercel.app` yang
   bisa dibuka dari HP maupun laptop, oleh siapa pun di tim yang punya akun login.

Kalau kamu mau, saya bisa bantu lakukan langkah 3-4 langsung lewat **Claude Code**
(punya akses terminal & bisa jalankan git/npm sungguhan), karena di chat ini saya hanya
bisa menulis kode, tidak bisa mengeksekusi deployment yang butuh internet.

---

## Update: Analisis Leads di Database + Laporan Excel

Migrasi tambahan (jalankan setelah migration_004_leads.sql):

1. Supabase → **SQL Editor** → copy isi `supabase/migration_005_leads_analytics.sql` → **Run**
2. Upload ulang folder project ke GitHub seperti biasa

Yang ditambahkan:
- **Menu Laporan** sekarang punya kartu **Laporan Leads / Sales Pipeline** — download Excel berisi
  semua leads lengkap dengan estimasi nilai potensial per bulan (dihitung otomatis dari harga biasa
  beli × jumlah × frekuensi kebutuhan), rating, status, dan follow-up berikutnya
- **2 VIEW baru langsung di database** (bisa dibuka di Supabase → Table Editor, tanpa perlu lewat
  aplikasi): `v_leads_funnel` (jumlah leads per status & rating) dan `v_leads_potential_value`
  (ranking leads berdasarkan estimasi nilai bulanan — berguna untuk prioritas follow-up)

---

## Update: Leads Management (Sales Pipeline)

Migrasi tambahan lagi (jalankan setelah migration_002 dan migration_003, kalau database kamu sudah berjalan):

1. Buka Supabase Dashboard > **SQL Editor** > **New query**
2. Copy seluruh isi `supabase/migration_004_leads.sql` → paste → **Run**
3. Upload ulang seluruh folder project ke GitHub (sama seperti sebelumnya)

Fitur baru — menu **Leads Management**:
- Catat prospek customer: produk yang diminati, merek yang biasa dipakai sekarang, harga biasa
  dibeli, kebutuhan per hari/minggu/bulan, dan rating potensi deal (Hot/Warm/Cold)
- Customer di lead memakai data customer yang sama dengan menu Customer — tinggal pilih dari daftar
- PIC/kontak untuk deal ini terisi otomatis dari data customer, tapi bisa diganti kalau beda orang
- **Order yang gagal/dibatalkan** (status Batal, atau retur total) bisa dikirim langsung jadi Lead
  baru untuk di-follow-up lagi — tombol "Kirim ke Leads" muncul di menu Order
- **Lead yang sudah Deal** bisa langsung dikonversi jadi Order baru (data customer & produk
  otomatis terisi) lewat tombol "Convert ke Order" — begitu order disimpan, lead otomatis
  tertandai selesai dan tertaut ke order tersebut

---

## Update: Fitur Diskon Dinamis (per produk & keseluruhan order)

Kalau kamu sudah punya database Supabase yang berjalan (bukan instalasi baru), jalankan
migrasi tambahan ini sekali saja:

1. Buka Supabase Dashboard > **SQL Editor** > **New query**
2. Copy seluruh isi `supabase/migration_002_discount.sql` → paste → **Run**
3. Update kode aplikasi kamu (lihat file-file yang berubah di bawah), lalu upload ulang ke
   GitHub (drag semua file project lagi ke repo yang sama — GitHub otomatis mendeteksi &
   commit hanya file yang berubah) → Vercel akan redeploy otomatis

Fitur ini menambahkan:
- **Diskon per produk** di setiap baris item order — pilih mode Persen atau Rupiah, untuk
  deal khusus reseller/distributor per SKU
- **Diskon keseluruhan order (toko)** — pilih mode Rupiah atau Persen/Margin, dihitung dari
  subtotal setelah diskon per-item
- Invoice/Quotation otomatis menampilkan kolom diskon per item dan label mode diskon order

---

## Update: Mode Persentase/Margin di Campaign Poin

Migrasi tambahan lagi (jalankan setelah migration_002 di atas, kalau database kamu sudah berjalan):

1. Buka Supabase Dashboard > **SQL Editor** > **New query**
2. Copy seluruh isi `supabase/migration_003_campaign_percent.sql` → paste → **Run**
3. Upload ulang seluruh folder project ke GitHub (sama seperti sebelumnya)

Sekarang tiap campaign poin punya pilihan **Mode Nilai**:
- **Nilai Tetap** — cara lama: "Rp per 1 Poin" (untuk tipe Nilai Transaksi) atau "Poin tetap per unit" (untuk tipe Produk Spesial)
- **Persentase / Margin** — baru: "X% dari nilai transaksi jadi poin" atau "X% dari harga produk per unit jadi poin", dikonversi otomatis memakai Nilai Tukar Poin di menu Pengaturan

---

## Struktur folder penting

```
supabase/schema.sql        <- jalankan ini di Supabase SQL Editor
src/lib/utils.ts           <- logika kalkulator (margin, PPN, poin) — sama seperti versi Artifact
src/lib/actions/*.ts       <- semua operasi database (create/update/delete)
src/app/(dashboard)/*      <- halaman-halaman aplikasi
src/components/            <- Sidebar, WilayahSelect (Provinsi/Kota/Kecamatan)
```

## Catatan & batasan v1

- **Data wilayah** (Provinsi/Kota/Kecamatan) memakai API publik emsifa — butuh koneksi
  internet saat form dibuka. Kalau gagal load, staf tetap bisa isi lewat kolom "Alamat Detail".
- **Role/permission per user** (misal logistik tidak bisa hapus customer) belum dibatasi —
  saat ini semua user yang login punya akses penuh. Bisa diperketat lewat kolom
  `profiles.role` dan RLS policy tambahan di `schema.sql`.
- **PDF invoice** digenerate di browser (html2canvas + jsPDF) — hasilnya berupa gambar
  halaman invoice, bukan PDF teks yang bisa di-select. Cukup untuk keperluan kirim ke
  customer; kalau butuh PDF teks asli, perlu library server-side (bisa ditambahkan nanti).
- Nomor order/invoice/surat jalan pakai counter di tabel `app_settings` — aman untuk
  pemakaian normal, tapi kalau dua orang submit order dalam waktu yang persis sama bisa
  ada kondisi race yang sangat jarang terjadi (bisa diperkuat pakai Postgres sequence
  kalau volumenya sangat tinggi).
