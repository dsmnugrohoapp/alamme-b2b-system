'use client';
import { useState } from 'react';
import { upsertProduct } from '@/lib/actions/products';
import { createClient } from '@/lib/supabase/client';

export default function ProductForm({ mode, product }: { mode: 'create' | 'edit'; product?: any }) {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(product?.image_url || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    if (file.size > 5 * 1024 * 1024) { setUploadError('Ukuran file maksimal 5MB.'); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
      setImageUrl(pub.publicUrl);
    } catch (err: any) {
      setUploadError('Gagal upload: ' + (err.message || 'coba lagi'));
    }
    setUploading(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={mode === 'create' ? 'btn btn-primary' : 'btn'} style={mode === 'edit' ? { padding: '5px 10px', fontSize: 12 } : {}}>
        {mode === 'create' ? '+ Tambah SKU' : 'Edit'}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-semibold">{mode === 'create' ? 'Tambah SKU' : 'Edit SKU'}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form action={async (fd) => { await upsertProduct(fd); setOpen(false); }}>
              <input type="hidden" name="id" defaultValue={product?.id || ''} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="field mb-3"><label>SKU ID</label><input name="sku" defaultValue={product?.sku} required /></div>
                <div className="field mb-3"><label>Nama Produk (internal)</label><input name="name" defaultValue={product?.name} required /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="field mb-3"><label>Kategori</label><input name="category" defaultValue={product?.category} /></div>
                <div className="field mb-3"><label>Satuan (UoM)</label><input name="uom" defaultValue={product?.uom} /></div>
              </div>
              <div className="field mb-3"><label>Harga Jual (Rp)</label><input type="number" name="price" defaultValue={product?.price || 0} /></div>

              <fieldset className="border border-dashed border-gray-300 rounded-lg p-3 mb-3">
                <legend className="text-[11px] font-bold uppercase text-golddeep px-1">Tampilan untuk Order Mandiri Customer</legend>
                <div className="field mb-3"><label>Nama Komersial (opsional — kalau kosong pakai Nama Produk)</label><input name="commercial_name" defaultValue={product?.commercial_name} placeholder="mis. Bawang Hitam Premium Alamme" /></div>

                <div className="field mb-3">
                  <label>Gambar Produk</label>
                  <div className="flex items-center gap-3">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-[10px] text-center">Belum ada</div>
                    )}
                    <div className="flex-1">
                      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="!text-xs" />
                      {uploading && <p className="text-[11px] text-gray-500 mt-1">Mengupload...</p>}
                      {uploadError && <p className="text-[11px] text-red-600 mt-1">{uploadError}</p>}
                      {imageUrl && !uploading && (
                        <button type="button" onClick={() => setImageUrl('')} className="text-[11px] text-red-600 mt-1">Hapus gambar</button>
                      )}
                    </div>
                  </div>
                  <input type="hidden" name="image_url" value={imageUrl} />
                  <p className="text-[11px] text-gray-500 mt-2">Maks. 5MB. Bisa juga JPG/PNG hasil foto langsung dari HP.</p>
                </div>

                <div className="field mb-3"><label>Deskripsi Singkat</label><textarea name="description" rows={2} defaultValue={product?.description} placeholder="mis. Bersertifikat Halal MUI, BPOM, HACCP. Tanpa pengawet." /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="field mb-0"><label>Kode Grup Varian (opsional)</label><input name="variant_group" defaultValue={product?.variant_group} placeholder="mis. bawang-hitam-tunggal" /></div>
                  <div className="field mb-0"><label>Label Varian (opsional)</label><input name="variant_label" defaultValue={product?.variant_label} placeholder="mis. 250g" /></div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">Isi Kode Grup Varian yang SAMA di beberapa SKU (mis. ukuran 220g, 250g, 1kg dari produk yang sama) supaya di halaman Order Mandiri customer, semuanya tampil sebagai 1 kartu dengan pilihan varian harga.</p>
              </fieldset>

              <div className="text-right"><button type="submit" disabled={uploading} className="btn btn-primary">Simpan SKU</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
