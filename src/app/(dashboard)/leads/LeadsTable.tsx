'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { deleteLead } from '@/lib/actions/leads';
import LeadForm from './LeadForm';
import LeadStatusButtons from './LeadStatusButtons';
import { rp, todayStr } from '@/lib/utils';

const RATING_BADGE: Record<string, string> = { Hot: 'bg-red-50 text-red-700', Warm: 'bg-amber-50 text-amber-700', Cold: 'bg-blue-50 text-blue-800' };
const STATUS_BADGE: Record<string, string> = { 'Baru': 'bg-gray-100 text-gray-600', 'Proses Follow-up': 'bg-amber-50 text-amber-700', 'Deal': 'bg-green-50 text-green-700', 'Gagal/Batal': 'bg-red-50 text-red-700' };
const STATUS_OPTIONS = ['Baru', 'Proses Follow-up', 'Deal', 'Gagal/Batal'];
const RATING_OPTIONS = ['Hot', 'Warm', 'Cold'];

export default function LeadsTable({ rows, customers, products }: { rows: any[]; customers: any[]; products: any[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((l) => {
      const matchQ = !ql || [l.customers?.name, l.contact_name, l.contact_phone].filter(Boolean).some((v: string) => v.toLowerCase().includes(ql));
      const matchStatus = !status || l.status === status;
      const matchRating = !rating || l.deal_rating === rating;
      return matchQ && matchStatus && matchRating;
    });
  }, [rows, q, status, rating]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama customer / PIC / no. HP..." className="!w-auto min-w-[240px]" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-auto">
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={rating} onChange={(e) => setRating(e.target.value)} className="!w-auto">
          <option value="">Semua Rating</option>
          {RATING_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {(q || status || rating) && <button onClick={() => { setQ(''); setStatus(''); setRating(''); }} className="btn" style={{ padding: '9px 14px', fontSize: 12 }}>Reset</button>}
        <span className="text-xs text-gray-400 self-center ml-1">{filtered.length} dari {rows.length} leads</span>
      </div>

      <div className="card">
        <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Customer</th><th>PIC / Kontak</th><th>Produk Diminati</th><th>Rating</th><th>Status</th><th>Follow-up Berikutnya</th><th>Asal / Hasil</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-gray-400 py-10">{rows.length === 0 ? 'Belum ada leads.' : 'Tidak ada leads yang cocok dengan pencarian/filter.'}</td></tr>}
            {filtered.map((l: any) => {
              const overdue = l.status === 'Proses Follow-up' && l.next_follow_up_date && l.next_follow_up_date < todayStr();
              return (
                <tr key={l.id}>
                  <td><b>{l.customers?.name || '—'}</b><div className="text-[11px] text-gray-400">{l.customers?.type} · {l.customers?.city || '-'}</div></td>
                  <td className="text-xs">{l.contact_name || '-'}<br />{l.contact_phone && <span>{l.contact_phone}</span>}{l.contact_email && <div className="text-gray-400">{l.contact_email}</div>}</td>
                  <td className="text-xs">
                    {(l.lead_items || []).length === 0 && <span className="text-gray-400">-</span>}
                    {(l.lead_items || []).map((it: any) => (
                      <div key={it.id} className="mb-1">
                        {it.products?.name} <span className="text-gray-400">({it.qty_per_frequency}{it.unit ? ` ${it.unit}` : ''}/{it.frequency}{it.current_brand ? `, biasa pakai: ${it.current_brand}` : ''}{it.usual_price ? `, ${rp(it.usual_price)}` : ''})</span>
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
                    <LeadForm mode="edit" lead={l} leadItems={l.lead_items} customers={customers} products={products} />
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
