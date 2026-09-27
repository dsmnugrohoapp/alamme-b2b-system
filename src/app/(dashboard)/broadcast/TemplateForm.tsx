'use client';
import { useState } from 'react';
import { upsertTemplate } from '@/lib/actions/broadcast';

const CATEGORIES = ['Promo', 'Pengingat Bayar', 'Restock', 'Ucapan/Relationship', 'Poin Reseller', 'Lainnya'];

export default function TemplateForm({ mode, template }: { mode: 'create' | 'edit'; template?: any }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(template?.content || '');

  function insertPlaceholder(token: string) {
    setContent((prev: string) => prev + token);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={mode === 'create' ? 'btn btn-primary' : 'btn'} style={mode === 'edit' ? { padding: '5px 10px', fontSize: 12 } : {}}>
        {mode === 'create' ? '+ Script Baru' : 'Edit'}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-semibold">{mode === 'create' ? 'Script Pesan Baru' : 'Edit Script Pesan'}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form action={async (fd) => { fd.set('content', content); await upsertTemplate(fd); setOpen(false); }}>
              <input type="hidden" name="id" defaultValue={template?.id || ''} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="field mb-0"><label>Nama Script</label><input name="name" defaultValue={template?.name} required placeholder="mis. Promo Akhir Bulan" /></div>
                <div className="field mb-0"><label>Kategori</label>
                  <select name="category" defaultValue={template?.category || 'Lainnya'}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="field mb-2">
                <label>Isi Pesan</label>
                <textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Halo {nama}, ..." />
              </div>
              <div className="mb-4">
                <p className="text-[11px] text-gray-500 mb-1.5">Klik untuk sisipkan variabel (otomatis terisi data customer saat dikirim):</p>
                <div className="flex flex-wrap gap-1.5">
                  {['{nama}', '{tipe}', '{kota}', '{pic}', '{termin}', '{poin}', '{margin}'].map((tok) => (
                    <button type="button" key={tok} onClick={() => insertPlaceholder(tok)} className="px-2.5 py-1 rounded-full bg-goldsoft text-golddeep text-[11px] font-semibold">{tok}</button>
                  ))}
                </div>
              </div>
              <div className="text-right"><button type="submit" className="btn btn-primary">Simpan Script</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
