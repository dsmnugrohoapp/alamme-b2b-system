import { createClient } from '@/lib/supabase/server';
import { rp, pct, todayStr } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  const [{ data: orders }, { data: leads }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, customers(name), order_items(qty, unit_price, product_id, products(name))')
      .neq('status', 'Batal'),
    supabase
      .from('leads')
      .select('*, customers(name, type, city), lead_items(product_id, usual_price, qty_per_frequency, frequency, products(name, uom))')
      .in('status', ['Baru', 'Proses Follow-up']),
  ]);

  const leadRows = leads || [];
  const freqMultiplier: Record<string, number> = { Harian: 30, Mingguan: 4.33, Bulanan: 1 };
  const leadsWithValue = leadRows.map((l: any) => {
    const items = l.lead_items || [];
    const estimasiBulanan = items.reduce((s: number, it: any) => s + (it.usual_price || 0) * (it.qty_per_frequency || 0) * (freqMultiplier[it.frequency] || 1), 0);
    const overdue = l.status === 'Proses Follow-up' && l.next_follow_up_date && l.next_follow_up_date < todayStr();
    return { ...l, estimasiBulanan, overdue, produk: items.map((it: any) => it.products?.name).filter(Boolean).join(', ') };
  });
  const followUpCount = leadsWithValue.filter((l: any) => l.status === 'Proses Follow-up').length;
  const overdueCount2 = leadsWithValue.filter((l: any) => l.overdue).length;
  const hotCount = leadsWithValue.filter((l: any) => l.deal_rating === 'Hot').length;
  const priorityLeads = leadsWithValue
    .sort((a: any, b: any) => (Number(b.overdue) - Number(a.overdue)) || (b.estimasiBulanan - a.estimasiBulanan))
    .slice(0, 6);

  const productAgg: Record<string, { name: string; uom: string; totalQtyMonthly: number; priceSum: number; priceCount: number; leadsSet: Set<string> }> = {};
  leadRows.forEach((l: any) => {
    (l.lead_items || []).forEach((it: any) => {
      const pid = it.product_id;
      if (!pid) return;
      const monthlyQty = (it.qty_per_frequency || 0) * (freqMultiplier[it.frequency] || 1);
      if (!productAgg[pid]) productAgg[pid] = { name: it.products?.name || '—', uom: it.products?.uom || '', totalQtyMonthly: 0, priceSum: 0, priceCount: 0, leadsSet: new Set() };
      productAgg[pid].totalQtyMonthly += monthlyQty;
      if (it.usual_price > 0) { productAgg[pid].priceSum += it.usual_price; productAgg[pid].priceCount++; }
      productAgg[pid].leadsSet.add(l.id);
    });
  });
  const productPotential = Object.values(productAgg)
    .map((p) => {
      const avgPrice = p.priceCount ? p.priceSum / p.priceCount : 0;
      return { name: p.name, uom: p.uom, totalQtyMonthly: p.totalQtyMonthly, avgPrice, leadsCount: p.leadsSet.size, potentialValue: p.totalQtyMonthly * avgPrice };
    })
    .sort((a, b) => b.potentialValue - a.potentialValue);

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

      <div className="flex justify-between items-end mb-3 mt-2">
        <h2 className="font-serif text-lg font-semibold">Leads yang Perlu Perhatian</h2>
        <Link href="/leads" className="text-xs font-semibold text-golddeep hover:underline">Lihat semua Leads →</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <Kpi label="Perlu Follow-up" value={String(followUpCount)} sub="leads aktif dalam proses" />
        <Kpi label="Follow-up Mendesak" value={String(overdueCount2)} sub={overdueCount2 ? 'sudah lewat jadwal' : 'tidak ada yang telat'} neg={overdueCount2 > 0} />
        <Kpi label="Rating Hot" value={String(hotCount)} sub="siap didorong closing" />
      </div>
      <div className="card mb-5">
        <h3 className="font-serif font-semibold mb-1">Leads Prioritas Follow-up</h3>
        <p className="text-[11px] text-gray-500 mb-2">Diurutkan: yang lewat jadwal dulu, lalu berdasarkan estimasi nilai bulanan terbesar.</p>
        <table>
          <thead><tr><th>Customer</th><th>Produk Diminati</th><th>Rating</th><th>Follow-up</th><th>Estimasi Nilai/Bulan</th></tr></thead>
          <tbody>
            {priorityLeads.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-8">Tidak ada leads yang perlu follow-up saat ini.</td></tr>}
            {priorityLeads.map((l: any) => {
              const ratingBadge: Record<string, string> = { Hot: 'bg-red-50 text-red-700', Warm: 'bg-amber-50 text-amber-700', Cold: 'bg-blue-50 text-blue-800' };
              return (
                <tr key={l.id}>
                  <td><b>{l.customers?.name || '—'}</b><div className="text-[11px] text-gray-400">{l.customers?.type}</div></td>
                  <td className="text-xs">{l.produk || '-'}</td>
                  <td><span className={`badge ${ratingBadge[l.deal_rating] || 'bg-gray-100'}`}>{l.deal_rating}</span></td>
                  <td className="text-xs">{l.next_follow_up_date ? <span className={l.overdue ? 'text-red-600 font-bold' : ''}>{l.next_follow_up_date}{l.overdue ? ' (lewat)' : ''}</span> : '-'}</td>
                  <td>{rp(l.estimasiBulanan)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card mb-5">
        <h3 className="font-serif font-semibold mb-1">Potensi Produk untuk Fulfillment</h3>
        <p className="text-[11px] text-gray-500 mb-2">Total kebutuhan per bulan dari semua leads aktif (Baru &amp; Proses Follow-up), disamakan satuannya sesuai UoM produk. Berguna untuk perencanaan stok.</p>
        <table>
          <thead><tr><th>Produk</th><th>Total Kebutuhan/Bulan</th><th>Harga Rata-rata</th><th>Jumlah Leads Berminat</th><th>Estimasi Nilai/Bulan</th></tr></thead>
          <tbody>
            {productPotential.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-8">Belum ada data kebutuhan produk dari leads.</td></tr>}
            {productPotential.map((p, i) => (
              <tr key={i}>
                <td><b>{p.name}</b></td>
                <td className="font-mono">{p.totalQtyMonthly.toLocaleString('id-ID', { maximumFractionDigits: 1 })} {p.uom}</td>
                <td>{p.avgPrice ? rp(p.avgPrice) : '—'}</td>
                <td>{p.leadsCount}</td>
                <td>{rp(p.potentialValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
