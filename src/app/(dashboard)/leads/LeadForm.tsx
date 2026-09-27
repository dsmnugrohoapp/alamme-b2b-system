'use client';
import { useMemo, useState } from 'react';
import { upsertLead } from '@/lib/actions/leads';
import { rp } from '@/lib/utils';

type Product = { id: string; sku: string; name: string; uom: string; price: number };
type Customer = { id: string; name: string; type: string; city: string };
type LeadItem = { productId: string; currentBrand: string; usualPrice: number; frequency: string; qtyPerFrequency: number; unit: string };

const FREQ_MULT: Record<string, number> = { Harian: 30, Mingguan: 4.33, Bulanan: 1 };

export default function LeadForm({ mode, lead, customers, products }: { mode: 'create' | 'edit'; lead?: any; customers: Customer[]; products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState(lead?.customer_id || '');
  const [customerQuery, setCustomerQuery] = useState(lead ? customers.find((c) => c.id === lead.customer_id)?.name || '' : '');
  const [showResults, setShowResults] = useState(false);
  const [items, setItems] = useState<LeadItem[]>(
    (lead?.lead_items || []).map((it: any) => ({
      productId: it.product_id, currentBrand: it.current_brand || '', usualPrice: Number(it.usual_price) || 0,
      frequency: it.frequency || 'Bulanan', qtyPerFrequency: Number(it.qty_per_frequency) || 0, unit: it.unit || it.products?.uom || '',
    }))
  );

  const matches = customerQuery ? customers.filter((c) => c.name.toLowerCase().includes(customerQuery.toLowerCase())).slice(0, 15) : [];

  function selectCustomer(c: Customer) { setCustomerId(c.id); setCustomerQuery(c.name); setShowResults(false); }
  function addItem() {
    const p = products[0];
    if (!p) return;
    setItems([...items, { productId: p.id, currentBrand: '', usualPrice: p.price, frequency: 'Bulanan', qtyPerFrequency: 1, unit: p.uom }]);
  }
  function updateItem(idx: number, field: keyof LeadItem, value: any) {
    const next = [...items];
    if (field === 'productId') {
      const p = products.find((p) => p.id === value);
      next[idx] = { ...next[idx], productId: value, unit: p?.uom || next[idx].unit };
    } else if (field === 'currentBrand' || field === 'frequency') {
      next[idx] = { ...next[idx], [field]: value };
    } else {
      next[idx] = { ...next[idx], [field]: parseFloat(value) || 0 };
    }
    setItems(next);
  }
  function removeItem(idx: number) { setItems(items.filter((_, i) => i !== idx)); }

  const estimasiBulanan = useMemo(
    () => items.reduce((s, it) => s + it.usualPrice * it.qtyPerFrequency * (FREQ_MULT[it.frequency] || 1), 0),
    [items]
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className={mode === 'create' ? 'btn btn-primary' : 'btn'} style={mode === 'edit' ? { padding: '5px 10px', fontSize: 12 } : {}}>
        {mode === 'create' ? '+ Lead Baru' : 'Edit'}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-semibold">{mode === 'create' ? 'Lead Baru' : 'Edit Lead'}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form action={async (fd) => { fd.set('items_json', JSON.stringify(items)); await upsertLead(fd); setOpen(false); }}>
              <input type="hidden" name="id" defaultValue={lead?.id || ''} />
              <input type="hidden" name="customer_id" value={customerId} />

              <div className="field mb-3 relative">
                <label>Cari Customer</label>
                <input value={customerQuery} onChange={(e) => { setCustomerQuery(e.target.value); setShowResults(true); setCustomerId(''); }} onFocus={() => setShowResults(true)} placeholder="Ketik nama customer..." autoComplete="off" />
                {showResults && matches.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {matches.map((c) => (
                      <div key={c.id} className="px-3 py-2 text-sm cursor-pointer hover:bg-cream border-b border-gray-50" onClick={() => selectCustomer(c)}>
                        <b>{c.name}</b><div className="text-[11px] text-gray-400">{c.type} — {c.city || '-'}</div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-gray-500 mt-1">Belum ada di database? Tambah dulu lewat menu Customer.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="field"><label>Nama Kontak</label><input name="contact_name" defaultValue={lead?.contact_name} /></div>
                <div className="field"><label>No. WA/Telepon</label><input name="contact_phone" defaultValue={lead?.contact_phone} /></div>
                <div className="field"><label>Email</label><input name="contact_email" defaultValue={lead?.contact_email} /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="field"><label>Rating</label>
                  <select name="deal_rating" defaultValue={lead?.deal_rating || 'Warm'}><option>Hot</option><option>Warm</option><option>Cold</option></select>
                </div>
                <div className="field"><label>Status</label>
                  <select name="status" defaultValue={lead?.status || 'Baru'}><option>Baru</option><option>Proses Follow-up</option><option>Deal</option><option>Gagal/Batal</option></select>
                </div>
                <div className="field"><label>Follow-up Berikutnya</label><input type="date" name="next_follow_up_date" defaultValue={lead?.next_follow_up_date} /></div>
              </div>

              <fieldset className="border border-dashed border-gray-300 rounded-lg p-3 mb-3">
                <legend className="text-[11px] font-bold uppercase text-golddeep px-1">Produk yang Diminati</legend>
                <p className="text-xs text-gray-500 mb-2">Isi kebiasaan pembelian mereka saat ini untuk estimasi potensi nilai bulanan.</p>
                {items.length === 0 && <p className="text-sm text-gray-400 mb-2">Belum ada produk diinput.</p>}
                {items.map((it, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-3 mb-2 grid grid-cols-1 md:grid-cols-2 gap-2 relative">
                    <button type="button" onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-red-600 text-sm">✕</button>
                    <div className="field mb-0"><label>Produk Alamme</label>
                      <select value={it.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)}>
                        {products.map((p) => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                      </select>
                    </div>
                    <div className="field mb-0"><label>Brand yang Dipakai Sekarang</label><input value={it.currentBrand} onChange={(e) => updateItem(idx, 'currentBrand', e.target.value)} /></div>
                    <div className="field mb-0"><label>Harga Biasa (Rp)</label><input type="number" value={it.usualPrice} onChange={(e) => updateItem(idx, 'usualPrice', e.target.value)} /></div>
                    <div className="field mb-0"><label>Frekuensi Beli</label>
                      <select value={it.frequency} onChange={(e) => updateItem(idx, 'frequency', e.target.value)}><option>Harian</option><option>Mingguan</option><option>Bulanan</option></select>
                    </div>
                    <div className="field mb-0"><label>Qty per Frekuensi</label><input type="number" step="0.01" value={it.qtyPerFrequency} onChange={(e) => updateItem(idx, 'qtyPerFrequency', e.target.value)} /></div>
                    <div className="field mb-0"><label>Satuan</label><input value={it.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} /></div>
                  </div>
                ))}
                <button type="button" onClick={addItem} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>+ Tambah Produk</button>
                {items.length > 0 && (
                  <div className="bg-goldsoft text-golddeep font-bold text-sm rounded-lg px-3.5 py-2.5 mt-3">Estimasi Nilai per Bulan: {rp(estimasiBulanan)}</div>
                )}
              </fieldset>

              <div className="field mb-4"><label>Catatan</label><textarea name="notes" rows={2} defaultValue={lead?.notes} /></div>
              <div className="text-right"><button type="submit" className="btn btn-primary">Simpan Lead</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
