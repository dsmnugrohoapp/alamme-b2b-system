import { createClient } from '@/lib/supabase/server';
import LeadForm from './LeadForm';
import LeadsTable from './LeadsTable';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const supabase = createClient();
  const [{ data: leadsRaw }, { data: customers }, { data: products }] = await Promise.all([
    supabase.from('leads').select('*, customers(name, type, city), lead_items(id, product_id, current_brand, usual_price, frequency, qty_per_frequency, unit, products(sku, name, uom))').order('created_at', { ascending: false }),
    supabase.from('customers').select('id, name, type, city, pic, phone, email').order('name'),
    supabase.from('products').select('id, sku, name, uom').order('name'),
  ]);

  const leadsBase = leadsRaw || [];
  const orderIds = Array.from(new Set(leadsBase.flatMap((l: any) => [l.source_order_id, l.converted_order_id]).filter(Boolean)));
  let orderNoMap: Record<string, string> = {};
  if (orderIds.length > 0) {
    const { data: ords } = await supabase.from('orders').select('id, order_no').in('id', orderIds);
    (ords || []).forEach((o: any) => { orderNoMap[o.id] = o.order_no; });
  }
  const rows = leadsBase.map((l: any) => ({
    ...l,
    source_order: l.source_order_id ? { order_no: orderNoMap[l.source_order_id] } : null,
    converted_order: l.converted_order_id ? { order_no: orderNoMap[l.converted_order_id] } : null,
  }));

  const needFollowUp = rows.filter((l: any) => l.status === 'Proses Follow-up');
  const deals = rows.filter((l: any) => l.status === 'Deal');

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Sales Pipeline</div>
          <h1 className="font-serif text-2xl font-semibold">Leads Management</h1>
          <p className="text-sm text-gray-500 mt-1">Prospek customer — kebutuhan, harga biasa dibeli, dan potensi deal. Order yang gagal difulfill otomatis masuk ke sini untuk di-follow-up.</p>
        </div>
        <LeadForm mode="create" customers={customers || []} products={products || []} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="card"><div className="text-[11px] uppercase text-gray-500 font-semibold">Total Leads</div><div className="font-serif text-2xl font-semibold mt-1.5">{rows.length}</div></div>
        <div className="card"><div className="text-[11px] uppercase text-gray-500 font-semibold">Perlu Follow-up</div><div className="font-serif text-2xl font-semibold mt-1.5 text-amber-700">{needFollowUp.length}</div></div>
        <div className="card"><div className="text-[11px] uppercase text-gray-500 font-semibold">Sudah Deal</div><div className="font-serif text-2xl font-semibold mt-1.5 text-green-700">{deals.length}</div></div>
      </div>

      <LeadsTable rows={rows} customers={customers || []} products={products || []} />
    </div>
  );
}
