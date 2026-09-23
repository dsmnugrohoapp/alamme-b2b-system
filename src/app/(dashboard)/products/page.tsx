import { createClient } from '@/lib/supabase/server';
import ProductForm from './ProductForm';
import ProductsTable from './ProductsTable';

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
      <ProductsTable products={products || []} />
    </div>
  );
}
