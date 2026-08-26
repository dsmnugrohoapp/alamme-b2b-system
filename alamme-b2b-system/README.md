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
