'use client';
import { useMemo, useState } from 'react';
import { deleteProduct } from '@/lib/actions/products';
import ProductForm from './ProductForm';
import { rp } from '@/lib/utils';

export default function ProductsTable({ products }: { products: any[] }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (!ql) return products;
    return products.filter((p) => [p.sku, p.name, p.category, p.commercial_name].filter(Boolean).some((v: string) => v.toLowerCase().includes(ql)));
  }, [products, q]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari SKU / nama produk / kategori..." className="!w-auto min-w-[260px]" />
        {q && <button onClick={() => setQ('')} className="btn" style={{ padding: '9px 14px', fontSize: 12 }}>Reset</button>}
        <span className="text-xs text-gray-400 self-center ml-1">{filtered.length} dari {products.length} SKU</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>SKU</th><th>Nama Produk</th><th>Tampilan Customer</th><th>Kategori</th><th>UoM</th><th>Harga Jual</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-10">{products.length === 0 ? 'Belum ada SKU.' : 'Tidak ada SKU yang cocok dengan pencarian.'}</td></tr>}
              {filtered.map((p: any) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.sku}</td><td><b>{p.name}</b></td>
                  <td className="text-xs">
                    <div className="flex items-center gap-2">
                      {p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover border border-gray-200" /> : <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-300 text-[9px]">no img</div>}
                      <div>
                        {p.commercial_name && <div className="font-semibold">{p.commercial_name}</div>}
                        {p.variant_group && <div className="text-gray-400">Grup: {p.variant_group} {p.variant_label ? `(${p.variant_label})` : ''}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{p.category}</td><td>{p.uom}</td><td>{rp(p.price)}</td>
                  <td className="whitespace-nowrap">
                    <ProductForm mode="edit" product={p} />
                    <form action={deleteProduct.bind(null, p.id)} className="inline">
                      <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}>Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
