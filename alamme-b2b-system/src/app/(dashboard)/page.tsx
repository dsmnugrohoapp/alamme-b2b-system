import { createClient } from '@/lib/supabase/server';
import { rp, pct, todayStr } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('*, customers(name), order_items(qty, unit_price, product_id, products(name))')
    .neq('status', 'Batal');

  const rows = orders || [];
  const totalRevenue = rows.reduce((s, o: any) => s + Number(o.subtotal), 0);
  const totalProfit = rows.reduce((s, o: any) => s + Number(o.net_profit), 0);
  const totalOrders = rows.length;
  const ar = rows.filter((o: any) => o.status !== 'Lunas').reduce((s, o: any) => s + Number(o.grand_total), 0);
  const overdueCount = rows.filter((o: any) => ['Invoiced', 'Dikirim'].includes(o.status) && o.due_date < todayStr()).length;

  const prodAgg: Record<string, { qty: number; revenue: number }> = {};
  rows.forEach((o: any) => {
    (o.order_items || []).forEach((it: any) => {
      const name = it.products?.name || 'Produk terhapus';
      if (!prodAgg[name]) prodAgg[name] = { qty: 0, revenue: 0 };
      prodAgg[name].qty += Number(it.qty);
      prodAgg[name].revenue += Number(it.qty) * Number(it.unit_price);
    });
  });
  const topProducts = Object.entries(prodAgg).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8);

  const custAgg: Record<string, { name: string; count: number; value: number; onTime: number; paid: number }> = {};
  rows.forEach((o: any) => {
    const key = o.customer_id;
    if (!custAgg[key]) custAgg[key] = { name: o.customers?.name || '—', count: 0, value: 0, onTime: 0, paid: 0 };
    custAgg[key].count++;
    custAgg[key].value += Number(o.grand_total);
    if (o.status === 'Lunas') {
      custAgg[key].paid++;
      if (o.paid_date && o.paid_date <= o.due_date) custAgg[key].onTime++;
    }
  });
  const custList = Object.values(custAgg);
  const maxVal = Math.max(1, ...custList.map((c) => c.value));
  const maxCount = Math.max(1, ...custList.map((c) => c.count));
  const topCustomers = custList
    .map((c) => {
      const onTimeRate = c.paid ? (c.onTime / c.paid) * 100 : null;
      const score = (c.value / maxVal) * 50 + (c.count / maxCount) * 30 + ((onTimeRate ?? 70) / 100) * 20;
      return { ...c, onTimeRate, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Overview</div>
        <h1 className="font-serif text-2xl font-semibold">Dashboard B2B &amp; Reseller</h1>
        <p className="text-sm text-gray-500 mt-1">Revenue, profit operasional, produk terlaris, dan performa customer.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <Kpi label="Total Revenue" value={rp(totalRevenue)} sub={`dari ${totalOrders} order`} />
        <Kpi label="Net Profit" value={rp(totalProfit)} sub={totalRevenue ? `Net margin ${pct((totalProfit / totalRevenue) * 100)}` : '—'} />
        <Kpi label="Total Order" value={String(totalOrders)} sub={`${rows.filter((o: any) => o.status === 'Lunas').length} lunas`} />
        <Kpi label="Piutang Belum Lunas" value={rp(ar)} sub={overdueCount ? `${overdueCount} order overdue` : 'tidak ada overdue'} neg={overdueCount > 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-serif font-semibold mb-3">Produk Terlaris</h3>
          <table>
            <thead><tr><th>Produk</th><th>Qty</th><th>Revenue</th></tr></thead>
            <tbody>
              {topProducts.length === 0 && <tr><td colSpan={3} className="text-center text-gray-400 py-8">Belum ada data.</td></tr>}
              {topProducts.map(([name, v]) => (
                <tr key={name}><td>{name}</td><td>{v.qty}</td><td>{rp(v.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3 className="font-serif font-semibold mb-1">Customer Direkomendasikan</h3>
          <p className="text-[11px] text-gray-500 mb-2">Ranking: frekuensi order, nilai pembelian, ketepatan bayar.</p>
          <table>
            <thead><tr><th>Customer</th><th>Order</th><th>Nilai</th><th>On-Time</th><th>Skor</th></tr></thead>
            <tbody>
              {topCustomers.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-8">Belum ada data.</td></tr>}
              {topCustomers.map((c, i) => (
                <tr key={i}><td>{c.name}</td><td>{c.count}</td><td>{rp(c.value)}</td>
                  <td>{c.onTimeRate !== null ? pct(c.onTimeRate) : '—'}</td>
                  <td><span className="badge bg-goldsoft text-golddeep">{Math.round(c.score)}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, neg }: { label: string; value: string; sub: string; neg?: boolean }) {
  return (
    <div className="card">
      <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{label}</div>
      <div className="font-serif text-2xl font-semibold mt-1.5">{value}</div>
      <div className={`text-[11.5px] mt-1 ${neg ? 'text-red-600' : 'text-green-700'}`}>{sub}</div>
    </div>
  );
}
