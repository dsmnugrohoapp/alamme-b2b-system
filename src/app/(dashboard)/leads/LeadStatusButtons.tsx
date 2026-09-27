'use client';
import { updateLeadStatus, deleteLead } from '@/lib/actions/leads';
import Link from 'next/link';

const STATUSES = ['Baru', 'Proses Follow-up', 'Deal', 'Gagal/Batal'];

export default function LeadStatusButtons({ lead }: { lead: any }) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      <select
        defaultValue={lead.status}
        onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
        className="!w-auto !text-xs !py-1.5"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {lead.status !== 'Deal' && (
        <Link href={`/orders/new?leadId=${lead.id}`} className="btn btn-gold" style={{ padding: '5px 8px', fontSize: 11 }}>Buat Order</Link>
      )}
      <form action={deleteLead.bind(null, lead.id)} className="inline">
        <button className="btn btn-danger" style={{ padding: '5px 8px', fontSize: 11 }}>Hapus</button>
      </form>
    </div>
  );
}
