import { createClient } from '@/lib/supabase/server';
import FulfillmentTable from './FulfillmentTable';

export const dynamic = 'force-dynamic';

export default async function FulfillmentPage() {
  const supabase = createClient();
  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('*, customers(name), order_items(product_id, qty, products(name, uom))')
    .not('status', 'in', '("Penawaran","Batal")')
    .order('order_date', { ascending: false });

  const rows = ordersRaw || [];
  // Ambil nama PIC (staff yang input order) dengan cara aman, terpisah dari embed antar tabel
  const creatorIds = Array.from(new Set(rows.map((o: any) => o.created_by).filter(Boolean)));
  let profileMap: Record<string, string> = {};
  if (creatorIds.length > 0) {
    const { data: profs } = await supabase.from('profiles').select('id, name').in('id', creatorIds);
    (profs || []).forEach((p: any) => { profileMap[p.id] = p.name; });
  }
  const orders = rows.map((o: any) => ({ ...o, created_by_name: o.created_by ? profileMap[o.created_by] : null }));

  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Logistik</div>
        <h1 className="font-serif text-2xl font-semibold">Fulfillment</h1>
        <p className="text-sm text-gray-500 mt-1">Persiapan, pengiriman, konfirmasi diterima, dan pencatatan retur.</p>
      </div>
      <FulfillmentTable orders={orders} />
    </div>
  );
}
