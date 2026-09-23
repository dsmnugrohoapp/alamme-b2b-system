'use client';
import { useMemo, useState } from 'react';
import { deleteCampaign, toggleCampaignActive } from '@/lib/actions/campaigns';
import CampaignForm from './CampaignForm';
import { rp } from '@/lib/utils';

export default function CampaignsTable({ campaigns, products }: { campaigns: any[]; products: any[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return campaigns.filter((c) => {
      const matchQ = !ql || (c.name || '').toLowerCase().includes(ql);
      const matchStatus = !status || (status === 'Aktif' ? c.active : !c.active);
      const matchType = !type || c.type === type;
      return matchQ && matchStatus && matchType;
    });
  }, [campaigns, q, status, type]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama campaign..." className="!w-auto min-w-[220px]" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="!w-auto">
          <option value="">Semua Tipe</option>
          <option value="revenue">Nilai Transaksi</option>
          <option value="product">Produk Spesial</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="!w-auto">
          <option value="">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
        {(q || status || type) && <button onClick={() => { setQ(''); setStatus(''); setType(''); }} className="btn" style={{ padding: '9px 14px', fontSize: 12 }}>Reset</button>}
        <span className="text-xs text-gray-400 self-center ml-1">{filtered.length} dari {campaigns.length} campaign</span>
      </div>

      <div className="card mb-4">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Campaign</th><th>Tipe</th><th>Aturan</th><th>Berlaku Untuk</th><th>Periode</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center text-gray-400 py-10">{campaigns.length === 0 ? 'Belum ada campaign poin.' : 'Tidak ada campaign yang cocok dengan pencarian/filter.'}</td></tr>}
              {filtered.map((c: any) => {
                const rule = c.value_mode === 'percent'
                  ? `${c.percent_value}% ${c.type === 'revenue' ? 'dari nilai transaksi' : 'dari harga produk/unit'}`
                  : c.type === 'revenue' ? `1 poin / ${rp(c.rp_per_point)}` : `${c.points_per_unit} poin/unit`;
                return (
                  <tr key={c.id}>
                    <td><b>{c.name}</b>{c.notes && <div className="text-[11px] text-gray-400">{c.notes}</div>}</td>
                    <td>{c.type === 'revenue' ? 'Nilai Transaksi' : 'Produk Spesial'}</td>
                    <td>{rule}{c.type === 'product' && ` (${(c.product_ids || []).length} SKU)`}</td>
                    <td>{(c.customer_types || []).join(', ')}</td>
                    <td>{c.start_date || '-'} s.d {c.end_date || '∞'}</td>
                    <td>{c.active ? <span className="badge bg-green-50 text-green-700">Aktif</span> : <span className="badge bg-gray-100 text-gray-600">Nonaktif</span>}</td>
                    <td className="whitespace-nowrap">
                      <CampaignForm mode="edit" campaign={c} products={products} />
                      <form action={toggleCampaignActive.bind(null, c.id, !c.active)} className="inline">
                        <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>{c.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                      </form>
                      <form action={deleteCampaign.bind(null, c.id)} className="inline">
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
