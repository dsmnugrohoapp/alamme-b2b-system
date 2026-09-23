import { createClient } from '@/lib/supabase/server';
import FulfillmentTable from './FulfillmentTable';

export const dynamic = 'force-dynamic';

export default async function FulfillmentPage() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('*, customers(name), order_items(product_id, qty, products(name, uom))')
    .not('status', 'in', '("Penawaran","Batal")')
    .order('order_date', { ascending: false });

  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Logistik</div>
        <h1 className="font-serif text-2xl font-semibold">Fulfillment</h1>
        <p className="text-sm text-gray-500 mt-1">Persiapan, pengiriman, konfirmasi diterima, dan pencatatan retur.</p>
      </div>
      <FulfillmentTable orders={orders || []} />
    </div>
  );
}
