import { createClient } from '@/lib/supabase/server';
import { deleteProduct } from '@/lib/actions/products';
import ProductForm from './ProductForm';
import { rp } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const supabase = createClient();
  const { data: products } = await supabase.from('products').select('*').order('sku');

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Database</div>
          <h1 className="font-serif text-2xl font-semibold">Produk / SKU</h1>
          <p className="text-sm text-gray-500 mt-1">Master SKU dan harga jual untuk kalkulator order.</p>
        </div>
        <ProductForm mode="create" />
      </div>
      <div className="card">
        <table>
          <thead><tr><th>SKU</th><th>Nama Produk</th><th>Kategori</th><th>UoM</th><th>Harga Jual</th><th></th></tr></thead>
          <tbody>
            {(!products || products.length === 0) && <tr><td colSpan={6} className="text-center text-gray-400 py-10">Belum ada SKU.</td></tr>}
            {(products || []).map((p: any) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.sku}</td><td><b>{p.name}</b></td><td>{p.category}</td><td>{p.uom}</td><td>{rp(p.price)}</td>
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
  );
}
