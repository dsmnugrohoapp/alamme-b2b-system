import { createClient } from '@/lib/supabase/server';

import FulfillmentActions from './FulfillmentActions';

export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<string, string> = {
  'Perlu Disiapkan': 'bg-gray-100 text-gray-600', 'Disiapkan': 'bg-amber-50 text-amber-700', 'Dikirim': 'bg-blue-50 text-blue-800',
  'Diterima': 'bg-green-50 text-green-700', 'Retur Sebagian': 'bg-red-50 text-red-700', 'Retur Total': 'bg-red-50 text-red-700',
};
const STEP: Record<string, number> = { 'Perlu Disiapkan': 1, 'Disiapkan': 2, 'Dikirim': 3, 'Diterima': 4, 'Retur Sebagian': 3, 'Retur Total': 3 };

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
      <div className="card">
        <div className="table-wrap">
        <table>
          <thead><tr><th>No. Order</th><th>Customer</th><th>Produk yang Disiapkan/Dikirim</th><th>Status Fulfillment</th><th>Kurir / Resi</th><th></th></tr></thead>
          <tbody>
            {(!orders || orders.length === 0) && <tr><td colSpan={6} className="text-center text-gray-400 py-10">Belum ada order untuk difulfill.</td></tr>}
            {(orders || []).map((o: any) => {
              const status = o.fulfillment_status || 'Perlu Disiapkan';
              const step = STEP[status] || 1;
              return (
                <tr key={o.id}>
                  <td className="font-mono text-xs">{o.order_no}</td>
                  <td>{o.customers?.name || '—'}</td>
                  <td className="text-xs">
                    {(o.order_items || []).map((it: any, idx: number) => (
                      <div key={idx}>{it.products?.name || 'Produk terhapus'} — <b>{it.qty} {it.products?.uom || ''}</b></div>
                    ))}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
                    <div className="flex gap-1 mt-1.5">{[1, 2, 3, 4].map((i) => <span key={i} className={`flex-1 h-1 rounded ${i <= step ? 'bg-green-600' : 'bg-gray-200'}`} />)}</div>
                  </td>
                  <td className="text-xs">{o.courier ? `${o.courier}${o.tracking_no ? ' — ' + o.tracking_no : ''}` : '-'}</td>
                  <td className="whitespace-nowrap"><FulfillmentActions order={o} items={o.order_items || []} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
