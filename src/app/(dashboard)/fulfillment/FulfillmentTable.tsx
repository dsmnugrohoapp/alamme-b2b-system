'use client';
import { useMemo, useState } from 'react';
import FulfillmentActions from './FulfillmentActions';

const STATUS_OPTIONS = ['Perlu Disiapkan', 'Disiapkan', 'Dikirim', 'Diterima', 'Retur Sebagian', 'Retur Total'];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    'Perlu Disiapkan': 'bg-gray-100 text-gray-600', Disiapkan: 'bg-amber-50 text-amber-700', Dikirim: 'bg-blue-50 text-blue-800',
    Diterima: 'bg-green-50 text-green-700', 'Retur Sebagian': 'bg-red-50 text-red-700', 'Retur Total': 'bg-red-50 text-red-700',
  };
  return <span className={`badge ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

export default function FulfillmentTable({ orders }: { orders: any[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return orders.filter((o) => {
      const matchQ = !ql || [o.order_no, o.customers?.name, o.created_by_name, o.courier].filter(Boolean).some((v: string) => v.toLowerCase().includes(ql));
      const matchStatus = !status || o.fulfillment_status === status;
      return matchQ && matchStatus;
    });
  }, [orders, q, status]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari No. Order / Customer / PIC / Kurir..." className="!w-auto min-w-[240px]" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-auto">
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(q || status) && <button onClick={() => { setQ(''); setStatus(''); }} className="btn" style={{ padding: '9px 14px', fontSize: 12 }}>Reset</button>}
        <span className="text-xs text-gray-400 self-center ml-1">{filtered.length} dari {orders.length} order</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>No. Order</th><th>Customer</th><th>PIC</th><th>Item</th><th>Status Fulfillment</th><th>Kurir/Resi</th><th>Catatan</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-10">{orders.length === 0 ? 'Belum ada order untuk difulfill.' : 'Tidak ada order yang cocok dengan pencarian/filter.'}</td></tr>}
              {filtered.map((o: any) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs">{o.order_no}</td>
                  <td>{o.customers?.name || '—'}<div className="text-[11px] text-gray-400">{o.customers?.city}</div></td>
                  <td className="text-xs">{o.created_by_name || <span className="text-gray-400">-</span>}</td>
                  <td className="text-xs">{(o.order_items || []).map((it: any) => `${it.products?.name} (${it.qty}${it.products?.uom ? ' ' + it.products.uom : ''})`).join(', ')}</td>
                  <td>{statusBadge(o.fulfillment_status)}</td>
                  <td className="text-xs">{o.courier ? <>{o.courier}<br />{o.tracking_no}</> : '-'}</td>
                  <td className="text-xs max-w-[180px]">{o.fulfillment_notes || (o.notes ? <span className="text-gray-400 italic">{o.notes}</span> : '-')}</td>
                  <td className="whitespace-nowrap"><FulfillmentActions order={o} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
