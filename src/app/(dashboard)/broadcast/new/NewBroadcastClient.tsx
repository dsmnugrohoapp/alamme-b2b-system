'use client';
import { useMemo, useState, useTransition } from 'react';
import { createBroadcast } from '@/lib/actions/broadcast';
import { renderTemplate } from '@/lib/utils';

const TYPES = ['Direct Customer', 'Hotel', 'Restoran', 'Cafe', 'Distributor', 'Reseller'];

export default function NewBroadcastClient({ customers, templates }: { customers: any[]; templates: any[] }) {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [content, setContent] = useState('');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = templates.find((t) => t.id === id);
    if (t) setContent(t.content);
  }

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return customers.filter((c) => {
      const matchQ = !ql || (c.name || '').toLowerCase().includes(ql);
      const matchType = !type || c.type === type;
      const hasPhone = !!c.phone;
      return matchQ && matchType && hasPhone;
    });
  }, [customers, q, type]);

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const previewCustomer = customers.find((c) => selectedIds.includes(c.id)) || customers[0];

  function toggleAll() {
    const allSelected = filtered.length > 0 && filtered.every((c) => selected[c.id]);
    const next = { ...selected };
    filtered.forEach((c) => { next[c.id] = !allSelected; });
    setSelected(next);
  }

  function handleSubmit() {
    setError('');
    if (!name.trim()) { setError('Isi nama broadcast dulu.'); return; }
    if (!content.trim()) { setError('Isi pesan tidak boleh kosong.'); return; }
    if (selectedIds.length === 0) { setError('Pilih minimal 1 customer target.'); return; }
    startTransition(async () => {
      try {
        await createBroadcast(name, content, templateId || null, selectedIds);
      } catch (e: any) {
        setError(e.message || 'Gagal membuat broadcast.');
      }
    });
  }

  const noPhoneCount = customers.filter((c) => !c.phone).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
      <div className="space-y-4">
        <div className="card">
          <div className="field mb-3"><label>Nama Broadcast (internal, untuk pelacakan)</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Promo Akhir Bulan - Reseller Bandung" /></div>
          <div className="field mb-3">
            <label>Pakai Script Pesan (opsional)</label>
            <select value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">— Tulis pesan sendiri —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field mb-1"><label>Isi Pesan</label><textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Halo {nama}, ..." /></div>
          <p className="text-[11px] text-gray-500">Variabel tersedia: {'{nama} {tipe} {kota} {pic} {termin} {poin} {margin}'} — otomatis terisi data tiap customer.</p>
        </div>

        <div className="card">
          <h3 className="font-serif font-semibold mb-1">Preview Pesan</h3>
          <p className="text-[11px] text-gray-500 mb-2">Contoh untuk: <b>{previewCustomer?.name || '(belum ada customer dipilih)'}</b></p>
          <div className="bg-[#DCF8C6] rounded-lg p-3 text-sm whitespace-pre-wrap">{previewCustomer ? renderTemplate(content, previewCustomer) || <span className="text-gray-400">(pesan kosong)</span> : content}</div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={handleSubmit} disabled={pending} className="btn btn-primary w-full justify-center">
          {pending ? 'Membuat Broadcast...' : `Buat Broadcast untuk ${selectedIds.length} Customer`}
        </button>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-2 mb-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama customer..." className="!w-auto min-w-[160px] flex-1" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="!w-auto">
            <option value="">Semua Tipe</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex justify-between items-center mb-2">
          <button onClick={toggleAll} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Pilih Semua yang Tampil</button>
          <span className="text-xs text-gray-500">{selectedIds.length} dipilih dari {filtered.length} tampil</span>
        </div>
        {noPhoneCount > 0 && <p className="text-[11px] text-amber-700 mb-2">⚠ {noPhoneCount} customer tidak punya no. WA dan otomatis disembunyikan dari daftar ini.</p>}
        <div className="max-h-[420px] overflow-y-auto border border-gray-100 rounded-lg">
          {filtered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Tidak ada customer yang cocok (atau tidak punya no. WA).</p>}
          {filtered.map((c) => (
            <label key={c.id} className="flex items-center gap-2.5 px-3 py-2 border-b border-gray-50 text-sm cursor-pointer hover:bg-cream">
              <input type="checkbox" className="w-auto" checked={!!selected[c.id]} onChange={(e) => setSelected({ ...selected, [c.id]: e.target.checked })} />
              <div>
                <b>{c.name}</b>
                <div className="text-[11px] text-gray-400">{c.type} — {c.city || '-'} — {c.phone}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
