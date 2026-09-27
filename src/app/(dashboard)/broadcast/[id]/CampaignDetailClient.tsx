'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { setTargetStatus } from '@/lib/actions/broadcast';
import { waLink } from '@/lib/utils';

export default function CampaignDetailClient({ campaign, targets }: { campaign: any; targets: any[] }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [localTargets, setLocalTargets] = useState(targets);

  const filtered = useMemo(() => {
    if (filter === 'pending') return localTargets.filter((t) => t.status !== 'Terkirim');
    if (filter === 'sent') return localTargets.filter((t) => t.status === 'Terkirim');
    return localTargets;
  }, [localTargets, filter]);

  const sentCount = localTargets.filter((t) => t.status === 'Terkirim').length;
  const total = localTargets.length;

  async function toggle(target: any) {
    const nextSent = target.status !== 'Terkirim';
    setLocalTargets((prev) => prev.map((t) => (t.id === target.id ? { ...t, status: nextSent ? 'Terkirim' : 'Belum Dikirim' } : t)));
    await setTargetStatus(target.id, campaign.id, nextSent);
  }

  function openWa(target: any) {
    window.open(waLink(target.customer?.phone, target.personalized_message), '_blank');
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <Link href="/broadcast" className="text-xs text-golddeep hover:underline">← Kembali ke Broadcast</Link>
          <h1 className="font-serif text-2xl font-semibold mt-1">{campaign.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Klik <b>Buka WhatsApp</b> untuk tiap customer, cek pesan yang sudah terisi otomatis, lalu tekan kirim. Setelah kirim, tandai sebagai Terkirim.</p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gold transition-all" style={{ width: `${total ? (sentCount / total) * 100 : 0}%` }} />
          </div>
          <span className="text-sm font-semibold whitespace-nowrap">{sentCount} / {total} terkirim</span>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {(['all', 'pending', 'sent'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${filter === f ? 'bg-ink text-white border-ink' : 'border-gray-200 text-gray-600'}`}>
            {f === 'all' ? 'Semua' : f === 'pending' ? 'Belum Dikirim' : 'Sudah Terkirim'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Customer</th><th>No. WA</th><th>Pesan</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-10">Tidak ada target di filter ini.</td></tr>}
              {filtered.map((t: any) => (
                <tr key={t.id}>
                  <td><b>{t.customer?.name || '—'}</b><div className="text-[11px] text-gray-400">{t.customer?.type} — {t.customer?.city}</div></td>
                  <td className="text-xs">{t.customer?.phone || <span className="text-red-600">Tidak ada no. WA</span>}</td>
                  <td className="text-xs max-w-[280px] truncate" title={t.personalized_message}>{t.personalized_message}</td>
                  <td>{t.status === 'Terkirim' ? <span className="badge bg-green-50 text-green-700">Terkirim</span> : <span className="badge bg-gray-100 text-gray-600">Belum Dikirim</span>}</td>
                  <td className="whitespace-nowrap">
                    {t.customer?.phone && (
                      <button onClick={() => openWa(t)} className="btn btn-gold" style={{ padding: '5px 10px', fontSize: 12 }}>💬 Buka WhatsApp</button>
                    )}{' '}
                    <button onClick={() => toggle(t)} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>
                      {t.status === 'Terkirim' ? 'Tandai Belum' : 'Tandai Terkirim'}
                    </button>
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
