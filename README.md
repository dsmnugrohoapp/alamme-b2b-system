# Alamme B2B & Reseller System

Sistem internal untuk order B2B/reseller, kalkulator PNL, poin reseller, leads management, broadcast WhatsApp, fulfillment, invoicing, dan laporan — dibangun dengan Next.js 14 + Supabase + Vercel.

## 1. Setup Awal (sekali saja)

### a. Supabase
1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor > New query**, paste seluruh isi `supabase/schema.sql`, lalu **Run**. Ini akan membuat semua tabel, kebijakan keamanan (RLS), data awal, dan bucket penyimpanan gambar produk.
3. Buka **Project Settings > API**, salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (klik "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` — **JANGAN pernah disebar ke publik/frontend**, hanya untuk server (dipakai fitur Order Mandiri Customer).
4. Buat akun tim lewat **Authentication > Users > Add user** (isi email + password). Akun ini yang dipakai login ke sistem.
5. **PENTING — untuk approval hapus order & finance**: buka **Table Editor > profiles**, cari baris user yang baru dibuat (otomatis muncul setelah user pertama kali login), lalu ubah kolom `role` dari `staff` menjadi `admin` atau `finance` untuk orang yang berwenang menyetujui penghapusan order.

### b. Deploy ke Vercel
1. Extract file zip ini.
2. Upload semua ISI folder (bukan foldernya) ke root repo GitHub Anda (mis. `alamme-b2b-system`).
3. Di Vercel: **Import Project** dari repo tsb.
4. **Root Directory**: kosongkan/biarkan default (jangan diarahkan ke sub-folder apa pun).
5. Tambahkan Environment Variables (samakan dengan `.env.local.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Deploy.

### c. Update untuk database yang SUDAH ada isinya (upgrade)
Jika Supabase Anda sudah pernah dipakai sebelumnya dan Anda tidak yakin migrasi mana yang sudah berjalan, cukup jalankan **`supabase/CATCHUP_ALL.sql`** — file ini merangkum semua migrasi dari awal sampai sekarang dan aman dijalankan berkali-kali. Atau jalankan migrasi satu per satu sesuai urutan nomornya di folder `supabase/`.

## 2. Update Kode di Kemudian Hari

1. Extract zip baru.
2. Upload SEMUA isi folder (replace semua file) ke GitHub — dari DALAM folder hasil extract, bukan foldernya sendiri.
3. Commit. Vercel otomatis redeploy.
4. Jika ada file migrasi SQL baru, jalankan itu juga di Supabase SQL Editor (atau jalankan `CATCHUP_ALL.sql` lagi, aman diulang).

### Catatan Troubleshooting Deploy
- **"Redeploy" pada deployment lama akan build kode LAMA**, bukan kode terbaru dari GitHub. Selalu upload ke GitHub dulu, biarkan Vercel otomatis membuat deployment baru, baru "Promote to Production" kalau perlu (cek label "Current" di tab Domains).
- Jika Vercel terus-menerus menampilkan kode lama meski sudah upload yang baru: cek **Settings > Build and Deployment > Root Directory** — pastikan KOSONG (tidak diarahkan ke sub-folder apa pun, termasuk folder duplikat/nested di GitHub kalau ada kesalahan upload sebelumnya).
- Warning `core-js`/`allow-scripts` saat build adalah normal, abaikan saja.

## 3. Fitur

### Order & Kalkulator
- Diskon per-item dan per-order (mode Persen atau Rp).
- Ongkir dibebankan ke customer vs. biaya ongkir aktual (real cost).
- PPN 11% (on/off per order, default ikut status PKP customer).
- Biaya operasional lain.
- Otomatis hitung Net Profit & Net Margin (tanpa HPP/COGS).
- Alamat pengiriman bisa beda dari alamat customer.
- Catatan Internal per order untuk PIC fulfillment (terlihat tim, tidak ikut tercetak di invoice/PDF customer).
- Keterangan Invoice (opsional, terpisah dari catatan internal): tampil di Invoice & Quotation untuk customer. Butuh `migration_012_invoice_notes.sql` (atau `CATCHUP_ALL.sql`).
- PIC (siapa yang membuat order) otomatis tercatat.

### Approval Hapus Order
- Role `staff`: klik Hapus → order ditandai "menunggu approval", tidak langsung terhapus.
- Role `admin`/`finance`: bisa menyetujui (hapus permanen) atau menolak permintaan, atau hapus langsung tanpa approval.
- Atur role lewat **Supabase Table Editor > profiles > kolom role**.

### Customer Database
- Tipe: Direct Customer, Hotel, Restoran, Cafe, Distributor, Pabrik, Reseller.
- Segmen: Domestik / Mancanegara.
- Alamat cascading Provinsi/Kota/Kecamatan (data wilayah Indonesia via API publik emsifa.com).
- Import massal via Excel/CSV (unduh template di halaman Customer).
- Margin tier referensi, status PKP, saldo poin (khusus Reseller).
- **Order Mandiri**: tiap customer punya link unik pribadi untuk order sendiri (tombol "Salin Link Order").

### Broadcast WhatsApp (CRM) — Fitur Baru
Karena tim Customer Care menangani Reseller dan Direct Customer sekaligus, fitur ini mempercepat komunikasi ke banyak customer:
- **Chat WA langsung**: tombol "💬 Chat WA" di setiap baris Customer, langsung membuka WhatsApp ke nomor tersebut.
- **Script Pesan (Template)**: buat pesan siap pakai dengan kategori (Promo, Pengingat Bayar, Restock, Ucapan/Relationship, Poin Reseller, Lainnya) dan variabel otomatis: `{nama}` `{tipe}` `{kota}` `{pic}` `{termin}` `{poin}` `{margin}`.
- **Buat Broadcast**: pilih script (atau tulis pesan sendiri), pilih target customer (filter by tipe, pencarian nama, pilih semua yang tampil), sistem otomatis membuat pesan personal untuk tiap customer.
- **Kirim & Lacak**: di halaman detail broadcast, klik "Buka WhatsApp" per customer (membuka wa.me dengan pesan sudah terisi otomatis, tinggal tekan kirim), lalu tandai "Terkirim". Ada progress bar (X dari Y terkirim) dan filter Belum Dikirim/Sudah Terkirim.
- **Batasan yang perlu dipahami**: WhatsApp tidak mengizinkan kirim otomatis massal ke banyak nomor sekaligus tanpa WhatsApp Business API resmi (berbayar, perlu approval Meta terpisah, di luar cakupan sistem ini). Fitur ini adalah **alat bantu semi-otomatis** — pesan sudah dipersonalisasi otomatis, staf tinggal klik-kirim satu-satu, jauh lebih cepat dari copy-paste manual, dengan pencatatan progress yang rapi.

### Produk/SKU
- Tanpa HPP (harga-only). Bisa tambah nama komersial, gambar (upload ke Supabase Storage), deskripsi, dan pengelompokan varian (mis. beberapa ukuran jadi satu kartu di Order Mandiri).

### Campaign & Poin Reseller
- Berdasarkan nilai transaksi ATAU produk spesifik.
- Mode nilai: nilai tetap (Rp/poin atau poin/unit) atau persentase (% dari transaksi/harga produk).
- Bisa ditarget ke tipe customer tertentu, punya periode aktif, dan bisa dinonaktifkan.
- Penyesuaian saldo poin manual (untuk penukaran/koreksi).

### Invoice / Quotation / Surat Jalan
- 3 pilihan kop surat: PT Semua Dari Alam, PT Maju Bersama Alam, atau Polos.
- Multi-rekening bank per perusahaan.
- Download PDF atau cetak langsung dari browser.

### Bukti Lunas (Paid Invoice)
- Untuk semua order berstatus Lunas (termasuk termin CBD yang sudah dibayar), tersedia dokumen **Bukti Lunas** dengan cap LUNAS, tanggal pembayaran, dan rujukan nomor invoice.
- Buka lewat tombol **Bukti Lunas** di daftar Order, atau pilih jenis dokumen di halaman Invoice. Bisa diunduh PDF atau dicetak untuk dikirim ke customer.
- Tanggal pembayaran diisi di form Order saat status Lunas (otomatis terisi hari ini).

### Fulfillment
- Alur status: Perlu Disiapkan → Disiapkan → Dikirim → Diterima.
- Retur (Sebagian/Total) dengan pencatatan per produk.
- Nomor Surat Jalan otomatis saat konfirmasi kirim.
- Kolom PIC dan Catatan agar tim gudang tahu konteks order tanpa buka detail.

### Leads Management
- Pipeline: Baru → Proses Follow-up → Deal / Gagal-Batal.
- Rating Hot/Warm/Cold.
- Estimasi nilai bulanan berdasarkan histori kebiasaan beli (harga, frekuensi, qty).
- Konversi dua arah: Lead → Order, atau Order yang batal/gagal → kembali jadi Lead untuk di-follow-up ulang.
- Dashboard menampilkan leads prioritas dan potensi kebutuhan produk untuk perencanaan fulfillment.

### Laporan
5 export Excel: Order & PNL, Customer, Poin, Fulfillment & Retur, Leads.

### Pengaturan
- Info perusahaan & rekening bank per entitas.
- Nilai tukar poin (Rp per poin).
- Pilihan kop surat mana yang tampil di halaman Order Mandiri customer.

### Pencarian & Filter
Tersedia di semua halaman daftar: Order, Customer, Produk, Campaign, Leads, Fulfillment.

## 4. Struktur Folder Penting
```
supabase/schema.sql          → jalankan ini untuk instalasi baru
supabase/CATCHUP_ALL.sql     → jalankan ini untuk upgrade database lama (aman diulang)
supabase/migration_XXX.sql   → migrasi individual berurutan (opsional, kalau mau lebih presisi)
src/lib/actions/             → semua server actions (logic backend)
src/lib/utils.ts             → kalkulator order, poin, dan helper WhatsApp
src/app/(dashboard)/         → semua halaman internal tim (perlu login)
src/app/order/[token]/       → halaman publik Order Mandiri customer (tanpa login)
src/app/(dashboard)/broadcast/ → fitur CRM Broadcast WhatsApp
```
