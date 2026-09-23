# Alamme B2B & Reseller System

Aplikasi web (Next.js + Supabase + Vercel) untuk order management, kalkulator margin/PPN,
poin reseller, leads/sales pipeline, fulfillment, invoice/quotation, dan **link order mandiri
untuk customer** — bisa diakses banyak orang sekaligus dari HP atau laptop.

---

## Setup dari Nol

### 1. Buat project Supabase
1. Buka supabase.com → **New project**
2. Buka **SQL Editor** → **New query** → copy-paste seluruh isi `supabase/schema.sql` → **Run**
3. Buka **Project Settings > API** → catat:
   - **Project URL**
   - **anon public key**
   - **service_role key** (klik "Reveal" — ini rahasia, jangan disebar. Dipakai khusus untuk fitur Order Mandiri di langkah 5)

### 2. Buat akun login untuk tim
Supabase Dashboard → **Authentication > Users > Add user** → buat 1 akun per anggota tim.

### 3. Isi environment variables
Copy `.env.local.example` jadi `.env.local`, isi 3 nilai dari langkah 1.

### 4. Jalankan di lokal untuk cek
```bash
npm install
npm run dev
```

### 5. Deploy ke Vercel
1. Push folder ini ke GitHub
2. Import ke Vercel
3. Isi **3 Environment Variables** di Vercel (Settings > Environment Variables, pilih tipe **Config** untuk yang `NEXT_PUBLIC_`, dan tipe **Secret** untuk `SUPABASE_SERVICE_ROLE_KEY`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **jangan pernah pakai awalan NEXT_PUBLIC_ untuk ini**
4. Deploy

---

## ⚠️ Kalau kamu upgrade dari versi sebelumnya (database sudah ada isinya)

Jalankan SEMUA migrasi berikut di **Supabase SQL Editor**, satu per satu, sesuai urutan nomornya
(skip yang sudah pernah dijalankan):

| File | Fitur |
|---|---|
| `migration_002_discount.sql` | Diskon per item & per order (persen/Rp) |
| `migration_003_campaign_percent.sql` | Campaign poin mode Persentase/Margin |
| `migration_004_leads.sql` | Leads Management (tabel leads & lead_items) |
| `migration_005_leads_analytics.sql` | View analisis leads (`v_leads_funnel`, `v_leads_potential_value`) |
| `migration_006_lead_item_unit.sql` | Satuan kebutuhan (kg/pcs/liter) di produk leads |
| `migration_007_customer_order_link.sql` | **BARU** — link Order Mandiri per customer |

Kalau kamu instalasi baru dari `schema.sql`, semua ini sudah otomatis termasuk — tidak perlu
jalankan file migrasi satu-satu lagi.

Setelah migrasi database, upload ulang seluruh folder project ke GitHub (drag semua isi folder
ke repo yang sama, GitHub otomatis timpa file yang berubah) → Vercel redeploy otomatis.

**Untuk fitur Order Mandiri (migration_007), tambahkan juga 1 environment variable baru di
Vercel**: `SUPABASE_SERVICE_ROLE_KEY` (lihat langkah 5 di atas) — tanpa ini halaman
`/order/[token]` akan error.

---

## Update: PIC Order, Catatan Bebas, Consignment, dan Approval Hapus Order

Migrasi tambahan (jalankan setelah migration_009):

1. Supabase → **SQL Editor** → copy isi `supabase/migration_010_order_pic_notes_delete_approval.sql` → **Run**
2. **Penting** — tentukan siapa yang boleh langsung menghapus order & menyetujui/menolak
   permintaan hapus dari staff lain: buka **Supabase → Table Editor → tabel `profiles`**,
   cari baris orang yang dimaksud (biasanya finance/owner), ubah kolom **`role`** jadi
   `admin` atau `finance`. Semua akun lain (default `staff`) otomatis mengirim permintaan
   approval, bukan langsung menghapus.
3. Upload ulang folder project ke GitHub seperti biasa

Yang ditambahkan:
- **PIC Order** — nama staff yang menginput order kini tercatat otomatis dan tampil di
  kolom baru di menu **Order & Kalkulator** dan **Fulfillment**, bisa ikut dicari
- **Catatan bebas** — field teks bebas baru di form Order untuk catatan internal/kondisi khusus
- **Consignment** — pilihan termin pembayaran baru, tersedia di Customer (default) maupun Order
  (bisa disesuaikan per transaksi, beda dari default customer-nya)
- **Approval hapus order** — staff biasa yang klik Hapus sekarang mengirim *permintaan* (bisa
  isi alasan), bukan langsung menghapus. Admin/Finance melihat badge "Perlu Approval" dengan
  tombol **Setujui & Hapus** atau **Tolak**. Admin/Finance sendiri tetap bisa hapus langsung
  tanpa perlu approval dari diri sendiri.

---



Tidak perlu migrasi database untuk update ini — murni perbaikan &amp; penambahan kode.

**Perbaikan:** tombol **Hapus** di menu Order & Kalkulator sebelumnya gagal diam-diam (tanpa
pesan apa pun) untuk order yang sudah menghasilkan poin Reseller atau terhubung ke Leads —
karena database menahan penghapusan demi menjaga keterkaitan data. Sekarang keterkaitan itu
otomatis dilepas dulu (bukan data lead-nya yang dihapus, cuma link-nya), poin yang sempat
didapat otomatis dibalikkan, baru order-nya dihapus. Tombol Hapus juga sekarang minta
konfirmasi dulu dan akan menampilkan pesan kalau memang ada masalah lain.

**Baru:** kotak pencarian + filter status/tipe ditambahkan di semua menu daftar: **Order &
Kalkulator**, **Customer**, **Produk/SKU**, **Campaign & Poin**, **Leads Management**, dan
**Fulfillment**. Filternya langsung bekerja saat mengetik (tidak perlu klik tombol Cari), dan
ada tombol Reset untuk hapus semua filter sekaligus.

---



Migrasi tambahan (jalankan setelah migration_008):

1. Supabase → **SQL Editor** → copy isi `supabase/migration_009_product_image_storage.sql` → **Run**
2. Upload ulang folder project ke GitHub seperti biasa (tidak perlu environment variable baru)

Sekarang di menu **Produk**, field Gambar Produk punya tombol **pilih file** — staff tinggal
pilih foto dari galeri HP/laptop (maks. 5MB), otomatis ter-upload ke Supabase Storage dan
langsung terhubung ke produk tersebut. Tidak perlu lagi cari hosting gambar terpisah atau
paste link manual.

---

## Update: Katalog Visual, Varian, Kurir & Pembayaran di Order Mandiri

Migrasi tambahan (jalankan setelah migration_007):

1. Supabase → **SQL Editor** → copy isi `supabase/migration_008_public_order_upgrade.sql` → **Run**
2. Upload ulang folder project ke GitHub seperti biasa (tidak perlu environment variable baru)

Yang ditambahkan:
- **Menu Produk** sekarang punya field tambahan (opsional): **Nama Komersial**, **Gambar**,
  **Deskripsi**, dan **Kode Grup Varian + Label Varian** — isi Kode Grup Varian yang sama di
  beberapa SKU (mis. ukuran 220g/250g/1kg dari produk yang sama) supaya di halaman Order
  Mandiri, semuanya tampil sebagai 1 kartu dengan tombol pilihan varian harga
- Halaman **Order Mandiri** customer sekarang tampil sebagai katalog visual (gambar, nama
  komersial, deskripsi, pilihan varian) — bukan tabel polos lagi
- Customer bisa pilih **Metode Pengiriman** (Kurir Internal Alamme / Kurir Lain) dan **Metode
  Pembayaran** (Transfer Bank / Sesuai Termin / COD) — kalau pilih Transfer Bank, info rekening
  otomatis tampil supaya customer makin yakin order-nya legit
- Menu **Pengaturan** punya opsi baru: pilih kop surat/rekening mana (PT Semua Dari Alam / PT
  Maju Bersama Alam) yang ditampilkan di halaman Order Mandiri
- Preferensi kurir & pembayaran yang dipilih customer muncul sebagai catatan di form Order saat
  staff membuka order tersebut

---

## Fitur: Link Order Mandiri untuk Customer

Setiap customer otomatis punya **link unik pribadi** (`/order/<token>`) yang bisa dibagikan
lewat WhatsApp. Cara pakai:

1. Buka menu **Customer** → cari customer yang mau dikirimi link → klik **"Salin Link Order"**
2. Kirim link itu ke customer (WA, email, dll)
3. Customer buka link → langsung lihat katalog produk dengan **harga otomatis sesuai margin
   tier mereka** (harga standar dikurangi persentase margin tier customer tsb)
4. Customer pilih produk & jumlah, isi No. PO (opsional), klik **Ajukan Order**
5. Order otomatis masuk ke sistem dengan status **Penawaran** — muncul di menu Order seperti
   biasa, siap dikonfirmasi/diproses tim

**Catatan keamanan (penting, jangan skip):** halaman ini publik (tanpa perlu login) dan
sengaja memakai `service_role key` di sisi server untuk membaca data customer berdasarkan
token uniknya — bukan lewat sistem keamanan database (RLS) yang dipakai halaman lain. Karena
itu, **`SUPABASE_SERVICE_ROLE_KEY` WAJIB HANYA disimpan sebagai environment variable di
Vercel, tidak pernah ditulis di kode atau dikirim ke browser.** Kode aplikasi sudah dirancang
supaya itu tidak terjadi (dipakai hanya di file dalam folder `src/lib/actions` dan Server
Component, bukan komponen `'use client'`).

Kalau ada link yang bocor/disalahgunakan, cara mengamankannya: hapus customer tsb lalu buat
ulang (token baru otomatis ter-generate), atau minta bantuan generate ulang token via SQL:
```sql
update customers set order_token = encode(gen_random_bytes(9), 'hex') where id = '<id customer>';
```

---

## Struktur folder penting

```
supabase/schema.sql          <- skema lengkap, jalankan di Supabase SQL Editor
supabase/migration_*.sql     <- migrasi tambahan per fitur (untuk database yang sudah ada isinya)
src/lib/utils.ts             <- logika kalkulator (diskon, PPN, poin)
src/lib/actions/*.ts         <- semua operasi database
src/lib/supabase/admin.ts    <- client khusus service_role, dipakai HANYA di /order/[token]
src/app/(dashboard)/*        <- halaman aplikasi internal (perlu login)
src/app/order/[token]/*      <- halaman publik Order Mandiri (tanpa login)
src/components/              <- Sidebar, WilayahSelect
```

## Catatan & batasan

- Data wilayah (Provinsi/Kota/Kecamatan) memakai API publik emsifa — butuh internet saat form
  dibuka. Kalau gagal, staf/customer tetap bisa isi lewat kolom Alamat Detail.
- PDF invoice digenerate di browser (gambar halaman, bukan PDF teks yang bisa di-select).
- Role/permission per user (misal logistik tidak bisa hapus customer) belum dibatasi — semua
  user yang login punya akses penuh ke menu internal.
