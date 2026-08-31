import { createClient } from '@/lib/supabase/server';
import { deleteLead } from '@/lib/actions/leads';
import LeadForm from './LeadForm';
import LeadStatusButtons from './LeadStatusButtons';
import { rp, todayStr } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const RATING_BADGE: Record<string, string> = { Hot: 'bg-red-50 text-red-700', Warm: 'bg-amber-50 text-amber-700', Cold: 'bg-blue-50 text-blue-800' };
const STATUS_BADGE: Record<string, string> = { 'Baru': 'bg-gray-100 text-gray-600', 'Proses Follow-up': 'bg-amber-50 text-amber-700', 'Deal': 'bg-green-50 text-green-700', 'Gagal/Batal': 'bg-red-50 text-red-700' };

export default async function LeadsPage() {
  const supabase = createClient();
  const [{ data: leads }, { data: customers }, { data: products }] = await Promise.all([
    supabase.from('leads').select('*, customers(name, type, city), lead_items(id, product_id, current_brand, usual_price, frequency, qty_per_frequency, products(sku, name, uom)), source_order:orders!leads_source_order_id_fkey(order_no), converted_order:orders!leads_converted_order_id_fkey(order_no)').order('created_at', { ascending: false }),
    supabase.from('customers').select('id, name, type, city, pic, phone, email').order('name'),
    supabase.from('products').select('id, sku, name, uom').order('name'),
  ]);

  const rows = leads || [];
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

      <div className="card">
        <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Customer</th><th>PIC / Kontak</th><th>Produk Diminati</th><th>Rating</th><th>Status</th><th>Follow-up Berikutnya</th><th>Asal / Hasil</th><th></th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-10">Belum ada leads.</td></tr>}
            {rows.map((l: any) => {
              const overdue = l.status === 'Proses Follow-up' && l.next_follow_up_date && l.next_follow_up_date < todayStr();
              return (
                <tr key={l.id}>
                  <td><b>{l.customers?.name || '—'}</b><div className="text-[11px] text-gray-400">{l.customers?.type} · {l.customers?.city || '-'}</div></td>
                  <td className="text-xs">{l.contact_name || '-'}<br />{l.contact_phone && <span>{l.contact_phone}</span>}{l.contact_email && <div className="text-gray-400">{l.contact_email}</div>}</td>
                  <td className="text-xs">
                    {(l.lead_items || []).length === 0 && <span className="text-gray-400">-</span>}
                    {(l.lead_items || []).map((it: any) => (
                      <div key={it.id} className="mb-1">
                        {it.products?.name} <span className="text-gray-400">({it.qty_per_frequency}/{it.frequency}{it.current_brand ? `, biasa pakai: ${it.current_brand}` : ''}{it.usual_price ? `, ${rp(it.usual_price)}` : ''})</span>
                      </div>
                    ))}
                  </td>
                  <td><span className={`badge ${RATING_BADGE[l.deal_rating] || 'bg-gray-100'}`}>{l.deal_rating}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[l.status] || 'bg-gray-100'}`}>{l.status}</span></td>
                  <td className="text-xs">{l.next_follow_up_date ? <span className={overdue ? 'text-red-600 font-bold' : ''}>{l.next_follow_up_date}{overdue ? ' (lewat jadwal)' : ''}</span> : '-'}</td>
                  <td className="text-xs">
                    {l.source_order && <div>Dari order: <span className="font-mono">{l.source_order.order_no}</span></div>}
                    {l.converted_order && <div className="text-green-700">Jadi order: <span className="font-mono">{l.converted_order.order_no}</span></div>}
                    {!l.source_order && !l.converted_order && '-'}
                  </td>
                  <td className="whitespace-nowrap">
                    <LeadForm mode="edit" lead={l} leadItems={l.lead_items} customers={customers || []} products={products || []} />
                    <LeadStatusButtons id={l.id} status={l.status} />
                    {l.status === 'Deal' && !l.converted_order && (
                      <Link href={`/orders/new?leadId=${l.id}`} className="btn btn-gold" style={{ padding: '5px 10px', fontSize: 12 }}>Convert ke Order</Link>
                    )}
                    <form action={deleteLead.bind(null, l.id)} className="inline">
                      <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}>Hapus</button>
                    </form>
                  </td>
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
