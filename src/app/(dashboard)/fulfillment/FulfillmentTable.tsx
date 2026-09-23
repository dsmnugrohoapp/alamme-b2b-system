'use client';
import { useMemo, useState } from 'react';
import FulfillmentActions from './FulfillmentActions';

const STATUS_BADGE: Record<string, string> = {
  'Perlu Disiapkan': 'bg-gray-100 text-gray-600', 'Disiapkan': 'bg-amber-50 text-amber-700', 'Dikirim': 'bg-blue-50 text-blue-800',
  'Diterima': 'bg-green-50 text-green-700', 'Retur Sebagian': 'bg-red-50 text-red-700', 'Retur Total': 'bg-red-50 text-red-700',
};
const STEP: Record<string, number> = { 'Perlu Disiapkan': 1, 'Disiapkan': 2, 'Dikirim': 3, 'Diterima': 4, 'Retur Sebagian': 3, 'Retur Total': 3 };
const STATUS_OPTIONS = Object.keys(STEP);

export default function FulfillmentTable({ orders }: { orders: any[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return orders.filter((o) => {
      const matchQ = !ql || [o.order_no, o.customers?.name].filter(Boolean).some((v: string) => v.toLowerCase().includes(ql));
      const matchStatus = !status || (o.fulfillment_status || 'Perlu Disiapkan') === status;
      return matchQ && matchStatus;
    });
  }, [orders, q, status]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari No. Order / Customer..." className="!w-auto min-w-[240px]" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-auto">
          <option value="">Semua Status Fulfillment</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(q || status) && <button onClick={() => { setQ(''); setStatus(''); }} className="btn" style={{ padding: '9px 14px', fontSize: 12 }}>Reset</button>}
        <span className="text-xs text-gray-400 self-center ml-1">{filtered.length} dari {orders.length} order</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>No. Order</th><th>Customer</th><th>Produk yang Disiapkan/Dikirim</th><th>Status Fulfillment</th><th>Kurir / Resi</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center text-gray-400 py-10">{orders.length === 0 ? 'Belum ada order untuk difulfill.' : 'Tidak ada order yang cocok dengan pencarian/filter.'}</td></tr>}
              {filtered.map((o: any) => {
                const status2 = o.fulfillment_status || 'Perlu Disiapkan';
                const step = STEP[status2] || 1;
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
                      <span className={`badge ${STATUS_BADGE[status2] || 'bg-gray-100 text-gray-600'}`}>{status2}</span>
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
