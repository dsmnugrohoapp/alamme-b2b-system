import { createClient } from '@/lib/supabase/server';
import FulfillmentTable from './FulfillmentTable';

export const dynamic = 'force-dynamic';

export default async function FulfillmentPage() {
  const supabase = createClient();
  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('*, customers(name, city), order_items(qty, product_id, products(name, uom)), order_returns(id, reason, order_return_items(qty, product_id))')
    .neq('status', 'Batal')
    .order('order_date', { ascending: false });
  const rows = ordersRaw || [];

  const creatorIds = Array.from(new Set(rows.map((o: any) => o.created_by).filter(Boolean)));
  let creatorMap: Record<string, string> = {};
  if (creatorIds.length > 0) {
    const { data: profs } = await supabase.from('profiles').select('id, name').in('id', creatorIds);
    (profs || []).forEach((p: any) => { creatorMap[p.id] = p.name; });
  }
  const orders = rows.map((o: any) => ({ ...o, created_by_name: o.created_by ? creatorMap[o.created_by] : null }));

  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Operasional</div>
        <h1 className="font-serif text-2xl font-semibold">Fulfillment</h1>
        <p className="text-sm text-gray-500 mt-1">Status pengiriman dari perlu disiapkan sampai diterima customer, termasuk retur.</p>
      </div>
      <FulfillmentTable orders={orders} />
    </div>
  );
}
