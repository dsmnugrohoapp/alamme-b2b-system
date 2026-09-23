'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { markPaid } from '@/lib/actions/orders';
import { sendOrderToLeads } from '@/lib/actions/leads';
import DeleteOrderButton from './DeleteOrderButton';
import { rp, todayStr } from '@/lib/utils';

const STATUS_OPTIONS = ['Penawaran', 'PO Diterima', 'Diproses', 'Invoiced', 'Dikirim', 'Lunas', 'Batal'];

function statusBadge(o: any) {
  const overdue = ['Invoiced', 'Dikirim'].includes(o.status) && o.due_date < todayStr();
  if (overdue) return <span className="badge bg-red-50 text-red-700">Overdue</span>;
  const map: Record<string, string> = {
    Penawaran: 'bg-gray-100 text-gray-600', 'PO Diterima': 'bg-blue-50 text-blue-800', Diproses: 'bg-amber-50 text-amber-700',
    Invoiced: 'bg-amber-50 text-amber-700', Dikirim: 'bg-blue-50 text-blue-800', Lunas: 'bg-green-50 text-green-700', Batal: 'bg-red-50 text-red-700',
  };
  return <span className={`badge ${map[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>;
}

export default function OrdersTable({ orders, currentRole }: { orders: any[]; currentRole: string }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return orders.filter((o) => {
      const matchQ = !ql || [o.order_no, o.customers?.name, o.po_number, o.created_by_name].filter(Boolean).some((v: string) => v.toLowerCase().includes(ql));
      const matchStatus = !status || o.status === status;
      return matchQ && matchStatus;
    });
  }, [orders, q, status]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari No. Order / Customer / No. PO / PIC..." className="!w-auto min-w-[240px]" />
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
              <tr><th>No. Order</th><th>Tanggal</th><th>Customer</th><th>PIC</th><th>Termin</th><th>Grand Total</th><th>Net Profit</th><th>Poin</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={10} className="text-center text-gray-400 py-10">{orders.length === 0 ? 'Belum ada order.' : 'Tidak ada order yang cocok dengan pencarian/filter.'}</td></tr>}
              {filtered.map((o: any) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs">{o.order_no}</td><td>{o.order_date}</td><td>{o.customers?.name || '—'}</td>
                  <td className="text-xs">{o.created_by_name || <span className="text-gray-400">-</span>}</td>
                  <td><span className="badge bg-blue-50 text-blue-800">{o.pay_term}</span></td>
                  <td>{rp(o.grand_total)}</td>
                  <td className={o.net_profit >= 0 ? 'text-green-700' : 'text-red-600'}>{rp(o.net_profit)}</td>
                  <td>{o.points_earned ? <span className="badge bg-goldsoft text-golddeep">{o.points_earned}</span> : '—'}</td>
                  <td>{statusBadge(o)}</td>
                  <td className="whitespace-nowrap">
                    <Link href={`/orders/${o.id}`} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Edit</Link>{' '}
                    <Link href={`/orders/${o.id}/invoice`} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Invoice</Link>{' '}
                    {o.status !== 'Lunas' && (
                      <form action={markPaid.bind(null, o.id)} className="inline">
                        <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Lunas</button>
                      </form>
                    )}{' '}
                    {(o.status === 'Batal' || o.fulfillment_status === 'Retur Total') && (
                      <form action={sendOrderToLeads.bind(null, o.id)} className="inline">
                        <button className="btn btn-gold" style={{ padding: '5px 10px', fontSize: 12 }}>Kirim ke Leads</button>
                      </form>
                    )}{' '}
                    <DeleteOrderButton
                      id={o.id} orderNo={o.order_no} currentRole={currentRole}
                      deleteRequested={o.delete_requested} requestedByName={o.delete_requested_by_name} requestNote={o.delete_request_note}
                    />
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
