import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { deleteOrder, markPaid } from '@/lib/actions/orders';
import { sendOrderToLeads } from '@/lib/actions/leads';
import { rp, todayStr } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function statusBadge(o: any) {
  const overdue = ['Invoiced', 'Dikirim'].includes(o.status) && o.due_date < todayStr();
  if (overdue) return <span className="badge bg-red-50 text-red-700">Overdue</span>;
  const map: Record<string, string> = {
    Penawaran: 'bg-gray-100 text-gray-600', 'PO Diterima': 'bg-blue-50 text-blue-800', Diproses: 'bg-amber-50 text-amber-700',
    Invoiced: 'bg-amber-50 text-amber-700', Dikirim: 'bg-blue-50 text-blue-800', Lunas: 'bg-green-50 text-green-700', Batal: 'bg-red-50 text-red-700',
  };
  return <span className={`badge ${map[o.status] || 'bg-gray-100 text-gray-600'}`}>{o.status}</span>;
}

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: orders } = await supabase.from('orders').select('*, customers(name)').order('order_date', { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Transaksi</div>
          <h1 className="font-serif text-2xl font-semibold">Order &amp; Kalkulator</h1>
          <p className="text-sm text-gray-500 mt-1">Input PO, hitung diskon, ongkir, PPN, dan poin reseller otomatis.</p>
        </div>
        <Link href="/orders/new" className="btn btn-primary">+ Order Baru</Link>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr><th>No. Order</th><th>Tanggal</th><th>Customer</th><th>Termin</th><th>Grand Total</th><th>Net Profit</th><th>Poin</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {(!orders || orders.length === 0) && <tr><td colSpan={9} className="text-center text-gray-400 py-10">Belum ada order.</td></tr>}
            {(orders || []).map((o: any) => (
              <tr key={o.id}>
                <td className="font-mono text-xs">{o.order_no}</td><td>{o.order_date}</td><td>{o.customers?.name || '—'}</td>
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
                  <form action={deleteOrder.bind(null, o.id)} className="inline">
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
