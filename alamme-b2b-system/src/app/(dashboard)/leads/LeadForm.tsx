'use client';
import { useState } from 'react';
import { upsertLead } from '@/lib/actions/leads';
import { todayStr } from '@/lib/utils';

type Product = { id: string; sku: string; name: string; uom: string };
type Customer = { id: string; name: string; type: string; city: string; pic: string; phone: string; email: string };
type ItemRow = { productId: string; currentBrand: string; usualPrice: number; frequency: string; qtyPerFrequency: number };

export default function LeadForm({ mode, lead, leadItems, customers, products }: {
  mode: 'create' | 'edit'; lead?: any; leadItems?: any[]; customers: Customer[]; products: Product[];
}) {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState(lead?.customer_id || '');
  const [contactName, setContactName] = useState(lead?.contact_name || '');
  const [contactPhone, setContactPhone] = useState(lead?.contact_phone || '');
  const [contactEmail, setContactEmail] = useState(lead?.contact_email || '');
  const [items, setItems] = useState<ItemRow[]>(
    leadItems?.map((it) => ({
      productId: it.product_id, currentBrand: it.current_brand || '', usualPrice: Number(it.usual_price) || 0,
      frequency: it.frequency || 'Bulanan', qtyPerFrequency: Number(it.qty_per_frequency) || 0,
    })) || []
  );

  function onCustomerChange(id: string) {
    setCustomerId(id);
    const c = customers.find((c) => c.id === id);
    if (c && !lead) { setContactName(c.pic || ''); setContactPhone(c.phone || ''); setContactEmail(c.email || ''); }
  }
  function addItem() {
    if (products.length === 0) return;
    setItems([...items, { productId: products[0].id, currentBrand: '', usualPrice: 0, frequency: 'Bulanan', qtyPerFrequency: 1 }]);
  }
  function updateItem(idx: number, field: keyof ItemRow, value: any) {
    const next = [...items];
    if (field === 'usualPrice' || field === 'qtyPerFrequency') next[idx] = { ...next[idx], [field]: parseFloat(value) || 0 };
    else next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  }
  function removeItem(idx: number) { setItems(items.filter((_, i) => i !== idx)); }

  return (
    <>
      <button onClick={() => setOpen(true)} className={mode === 'create' ? 'btn btn-primary' : 'btn'} style={mode === 'edit' ? { padding: '5px 10px', fontSize: 12 } : {}}>
        {mode === 'create' ? '+ Lead Baru' : 'Edit'}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-semibold">{mode === 'create' ? 'Lead Baru' : 'Edit Lead'}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form action={async (fd) => { await upsertLead(fd); setOpen(false); }}>
              <input type="hidden" name="id" defaultValue={lead?.id || ''} />
              <input type="hidden" name="customer_id" value={customerId} />
              <input type="hidden" name="items_json" value={JSON.stringify(items)} />

              <div className="field mb-3">
                <label>Customer (potensi)</label>
                <select value={customerId} onChange={(e) => onCustomerChange(e.target.value)} required>
                  <option value="">Pilih Customer</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.type} ({c.city || '-'})</option>)}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">Belum ada di daftar? Tambahkan dulu lewat menu Customer, baru pilih di sini.</p>
              </div>

              <fieldset className="border border-dashed border-gray-300 rounded-lg p-3 mb-3">
                <legend className="text-[11px] font-bold uppercase text-golddeep px-1">PIC / Kontak untuk Deal Ini</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="field mb-0"><label>Nama PIC</label><input name="contact_name" value={contactName} onChange={(e) => setContactName(e.target.value)} /></div>
                  <div className="field mb-0"><label>No. WhatsApp</label><input name="contact_phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></div>
                  <div className="field mb-0"><label>Email</label><input name="contact_email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></div>
                </div>
                <p className="text-[11px] text-gray-500 mt-2">Terisi otomatis dari data customer, bisa diganti kalau kontak untuk deal ini beda orang.</p>
              </fieldset>

              <fieldset className="border border-dashed border-gray-300 rounded-lg p-3 mb-3">
                <legend className="text-[11px] font-bold uppercase text-golddeep px-1">Produk yang Diminati</legend>
                <div className="hidden md:grid grid-cols-[1.6fr_1fr_100px_100px_90px_28px] gap-2 text-[10.5px] uppercase text-gray-500 font-bold mb-1.5">
                  <div>Produk</div><div>Merek Biasa Dipakai</div><div>Harga Biasa Beli</div><div>Frekuensi</div><div>Jml/Periode</div><div></div>
                </div>
                {items.length === 0 && <p className="text-sm text-gray-400 mb-2">Belum ada produk. Klik "+ Tambah Produk".</p>}
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_100px_100px_90px_28px] gap-2 mb-2 items-center border md:border-0 rounded-lg p-2.5 md:p-0">
                    <select value={it.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)}>
                      {products.map((p) => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                    </select>
                    <input value={it.currentBrand} onChange={(e) => updateItem(idx, 'currentBrand', e.target.value)} placeholder="mis. Bango, kompetitor lokal, dll" className="!text-xs" />
                    <input type="number" value={it.usualPrice} onChange={(e) => updateItem(idx, 'usualPrice', e.target.value)} placeholder="Rp" className="!text-xs" />
                    <select value={it.frequency} onChange={(e) => updateItem(idx, 'frequency', e.target.value)} className="!text-xs">
                      <option>Harian</option><option>Mingguan</option><option>Bulanan</option>
                    </select>
                    <input type="number" value={it.qtyPerFrequency} onChange={(e) => updateItem(idx, 'qtyPerFrequency', e.target.value)} placeholder="Qty" className="!text-xs" />
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-600 text-sm justify-self-end md:justify-self-auto">✕</button>
                  </div>
                ))}
                <button type="button" onClick={addItem} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>+ Tambah Produk</button>
              </fieldset>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="field mb-0"><label>Rating Potensi Deal</label>
                  <select name="deal_rating" defaultValue={lead?.deal_rating || 'Warm'}>
                    <option value="Hot">🔥 Hot — siap deal</option>
                    <option value="Warm">🟡 Warm — perlu follow-up</option>
                    <option value="Cold">❄️ Cold — belum tertarik</option>
                  </select>
                </div>
                <div className="field mb-0"><label>Status</label>
                  <select name="status" defaultValue={lead?.status || 'Baru'}>
                    <option value="Baru">Baru</option>
                    <option value="Proses Follow-up">Proses Follow-up</option>
                    <option value="Deal">Deal</option>
                    <option value="Gagal/Batal">Gagal/Batal</option>
                  </select>
                </div>
                <div className="field mb-0"><label>Follow-up Berikutnya</label><input type="date" name="next_follow_up_date" defaultValue={lead?.next_follow_up_date || todayStr()} /></div>
              </div>
              <div className="field mb-4"><label>Catatan</label><textarea name="notes" rows={2} defaultValue={lead?.notes} placeholder="Konteks negosiasi, kendala, dll" /></div>
              <div className="text-right"><button type="submit" className="btn btn-primary">Simpan Lead</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
