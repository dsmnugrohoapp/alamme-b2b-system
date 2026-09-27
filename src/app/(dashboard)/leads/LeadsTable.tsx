'use client';
import { useMemo, useState } from 'react';
import LeadForm from './LeadForm';
import LeadStatusButtons from './LeadStatusButtons';
import { rp, todayStr } from '@/lib/utils';

const FREQ_MULT: Record<string, number> = { Harian: 30, Mingguan: 4.33, Bulanan: 1 };
const STATUS_OPTIONS = ['Baru', 'Proses Follow-up', 'Deal', 'Gagal/Batal'];
const RATING_OPTIONS = ['Hot', 'Warm', 'Cold'];

function ratingBadge(rating: string) {
  const map: Record<string, string> = { Hot: 'bg-red-50 text-red-700', Warm: 'bg-amber-50 text-amber-700', Cold: 'bg-blue-50 text-blue-800' };
  return <span className={`badge ${map[rating] || 'bg-gray-100'}`}>{rating}</span>;
}

export default function LeadsTable({ leads, customers, products }: { leads: any[]; customers: any[]; products: any[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');

  const enriched = useMemo(() => leads.map((l: any) => {
    const estimasiBulanan = (l.lead_items || []).reduce((s: number, it: any) => s + (it.usual_price || 0) * (it.qty_per_frequency || 0) * (FREQ_MULT[it.frequency] || 1), 0);
    const overdue = l.status === 'Proses Follow-up' && l.next_follow_up_date && l.next_follow_up_date < todayStr();
    return { ...l, estimasiBulanan, overdue };
  }), [leads]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return enriched.filter((l: any) => {
      const matchQ = !ql || [l.customers?.name, l.contact_name, l.contact_phone].filter(Boolean).some((v: string) => v.toLowerCase().includes(ql));
      const matchStatus = !status || l.status === status;
      const matchRating = !rating || l.deal_rating === rating;
      return matchQ && matchStatus && matchRating;
    });
  }, [enriched, q, status, rating]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama customer / kontak / no. HP..." className="!w-auto min-w-[240px]" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-auto">
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={rating} onChange={(e) => setRating(e.target.value)} className="!w-auto">
          <option value="">Semua Rating</option>
          {RATING_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {(q || status || rating) && <button onClick={() => { setQ(''); setStatus(''); setRating(''); }} className="btn" style={{ padding: '9px 14px', fontSize: 12 }}>Reset</button>}
        <span className="text-xs text-gray-400 self-center ml-1">{filtered.length} dari {leads.length} leads</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>Kontak</th><th>Rating</th><th>Status</th><th>Follow-up</th><th>Estimasi Nilai/Bulan</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-10">{leads.length === 0 ? 'Belum ada leads.' : 'Tidak ada leads yang cocok dengan pencarian/filter.'}</td></tr>}
              {filtered.map((l: any) => (
                <tr key={l.id}>
                  <td><b>{l.customers?.name || '—'}</b><div className="text-[11px] text-gray-400">{l.customers?.type} — {l.customers?.city}</div></td>
                  <td className="text-xs">{l.contact_name}<br />{l.contact_phone}</td>
                  <td>{ratingBadge(l.deal_rating)}</td>
                  <td><span className="badge bg-gray-100 text-gray-700">{l.status}</span></td>
                  <td className="text-xs">{l.next_follow_up_date ? <span className={l.overdue ? 'text-red-600 font-bold' : ''}>{l.next_follow_up_date}{l.overdue ? ' (lewat)' : ''}</span> : '-'}</td>
                  <td>{rp(l.estimasiBulanan)}</td>
                  <td className="whitespace-nowrap">
                    <LeadForm mode="edit" lead={l} customers={customers} products={products} />
                    <LeadStatusButtons lead={l} />
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
