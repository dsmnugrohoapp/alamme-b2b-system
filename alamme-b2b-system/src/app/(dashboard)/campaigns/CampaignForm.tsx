'use client';
import { useState } from 'react';
import { upsertCampaign } from '@/lib/actions/campaigns';

const TYPES = ['Direct Customer', 'Hotel', 'Restoran', 'Cafe', 'Distributor', 'Reseller'];

export default function CampaignForm({ mode, campaign, products }: { mode: 'create' | 'edit'; campaign?: any; products: any[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(campaign?.type || 'revenue');
  const [valueMode, setValueMode] = useState(campaign?.value_mode || 'value');

  return (
    <>
      <button onClick={() => setOpen(true)} className={mode === 'create' ? 'btn btn-primary' : 'btn'} style={mode === 'edit' ? { padding: '5px 10px', fontSize: 12 } : {}}>
        {mode === 'create' ? '+ Campaign Baru' : 'Edit'}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-semibold">{mode === 'create' ? 'Campaign Baru' : 'Edit Campaign'}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form action={async (fd) => { await upsertCampaign(fd); setOpen(false); }}>
              <input type="hidden" name="id" defaultValue={campaign?.id || ''} />
              <div className="field mb-3"><label>Nama Campaign</label><input name="name" defaultValue={campaign?.name} required /></div>

              <div className="field mb-3"><label>Tipe Perhitungan</label>
                <select name="type" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="revenue">Poin dari Nilai Transaksi (Rp)</option>
                  <option value="product">Poin dari Produk Spesial (per unit)</option>
                </select>
              </div>

              <div className="field mb-3">
                <label>Mode Nilai</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setValueMode('value')} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${valueMode === 'value' ? 'bg-ink text-white border-ink' : 'border-gray-200 text-gray-600'}`}>
                    Nilai Tetap
                  </button>
                  <button type="button" onClick={() => setValueMode('percent')} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${valueMode === 'percent' ? 'bg-ink text-white border-ink' : 'border-gray-200 text-gray-600'}`}>
                    Persentase / Margin
                  </button>
                </div>
                <input type="hidden" name="value_mode" value={valueMode} />
              </div>

              {type === 'revenue' && valueMode === 'value' && (
                <div className="field mb-3"><label>Rp per 1 Poin</label><input type="number" name="rp_per_point" defaultValue={campaign?.rp_per_point || 10000} /></div>
              )}
              {type === 'revenue' && valueMode === 'percent' && (
                <div className="field mb-3">
                  <label>Persentase dari Nilai Transaksi (%)</label>
                  <input type="number" step="0.1" name="percent_value" defaultValue={campaign?.percent_value || 1} />
                  <p className="text-[11px] text-gray-500 mt-1">Contoh: 2% dari subtotal order dikonversi jadi poin, memakai Nilai Tukar Poin di menu Pengaturan.</p>
                </div>
              )}
              {type === 'product' && valueMode === 'value' && (
                <div className="field mb-3"><label>Poin per Unit Terjual</label><input type="number" step="0.1" name="points_per_unit" defaultValue={campaign?.points_per_unit || 5} /></div>
              )}
              {type === 'product' && valueMode === 'percent' && (
                <div className="field mb-3">
                  <label>Persentase dari Harga Produk per Unit (%)</label>
                  <input type="number" step="0.1" name="percent_value" defaultValue={campaign?.percent_value || 5} />
                  <p className="text-[11px] text-gray-500 mt-1">Contoh: 5% dari harga jual tiap unit produk terpilih dikonversi jadi poin per unit terjual.</p>
                </div>
              )}

              {type === 'product' && (
                <div className="field mb-3"><label>Produk Spesial (pilih SKU)</label>
                  <select name="product_ids" multiple size={6} defaultValue={campaign?.product_ids || []}>
                    {products.map((p) => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                  </select>
                </div>
              )}
              <div className="field mb-3"><label>Berlaku untuk Tipe Customer</label>
                <div className="flex gap-3 flex-wrap">
                  {TYPES.map((t) => (
                    <label key={t} className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer">
                      <input type="checkbox" name="customer_types" value={t} defaultChecked={campaign ? (campaign.customer_types || []).includes(t) : t === 'Reseller'} className="w-auto" /> {t}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="field"><label>Tanggal Mulai</label><input type="date" name="start_date" defaultValue={campaign?.start_date} /></div>
                <div className="field"><label>Tanggal Selesai</label><input type="date" name="end_date" defaultValue={campaign?.end_date} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer mb-3">
                <input type="checkbox" name="active" defaultChecked={campaign?.active ?? true} className="w-auto" /> Campaign Aktif
              </label>
              <div className="field mb-4"><label>Catatan</label><textarea name="notes" rows={2} defaultValue={campaign?.notes} /></div>
              <div className="text-right"><button type="submit" className="btn btn-primary">Simpan Campaign</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
