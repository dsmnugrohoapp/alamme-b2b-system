'use client';
import { useState } from 'react';
import { upsertProduct } from '@/lib/actions/products';

export default function ProductForm({ mode, product }: { mode: 'create' | 'edit'; product?: any }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={mode === 'create' ? 'btn btn-primary' : 'btn'} style={mode === 'edit' ? { padding: '5px 10px', fontSize: 12 } : {}}>
        {mode === 'create' ? '+ Tambah SKU' : 'Edit'}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-semibold">{mode === 'create' ? 'Tambah SKU' : 'Edit SKU'}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form action={async (fd) => { await upsertProduct(fd); setOpen(false); }}>
              <input type="hidden" name="id" defaultValue={product?.id || ''} />
              <div className="field mb-3"><label>SKU ID</label><input name="sku" defaultValue={product?.sku} required /></div>
              <div className="field mb-3"><label>Nama Produk</label><input name="name" defaultValue={product?.name} required /></div>
              <div className="field mb-3"><label>Kategori</label><input name="category" defaultValue={product?.category} /></div>
              <div className="field mb-3"><label>Satuan (UoM)</label><input name="uom" defaultValue={product?.uom} /></div>
              <div className="field mb-4"><label>Harga Jual (Rp)</label><input type="number" name="price" defaultValue={product?.price || 0} /></div>
              <div className="text-right"><button type="submit" className="btn btn-primary">Simpan SKU</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
