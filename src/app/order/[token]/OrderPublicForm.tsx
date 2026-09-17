'use client';
import { useMemo, useState } from 'react';
import { submitCustomerOrder } from '@/lib/actions/customerOrder';
import { rp } from '@/lib/utils';

type Product = {
  id: string; sku: string; name: string; uom: string; price: number;
  commercial_name: string | null; image_url: string | null; description: string | null;
  variant_group: string | null; variant_label: string | null;
};
type Customer = { id: string; name: string; type: string; margin: number; pay_term: string; pkp: boolean; city: string };
type Company = { name: string; bank_accounts: { bank: string; accountNo: string; holder: string; type: string }[] } | null;

const SHIPPING_OPTIONS = ['Kurir Internal Alamme', 'Kurir Lain (JNE/J&T/dll)'];
const PAYMENT_OPTIONS = ['Transfer Bank', 'Sesuai Termin (Invoice)', 'COD'];

export default function OrderPublicForm({ token, customer, products, company }: { token: string; customer: Customer; products: Product[]; company: Company }) {
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const [poNumber, setPoNumber] = useState('');
  const [shipping, setShipping] = useState(SHIPPING_OPTIONS[0]);
  const [payment, setPayment] = useState(PAYMENT_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ orderNo: string; grandTotal: number; pointsEarned: number } | null>(null);
  const [error, setError] = useState('');

  const discountFactor = 1 - (customer.margin || 0) / 100;
  const priced = products.map((p) => ({ ...p, displayPrice: Math.round(p.price * discountFactor) }));

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; commercialName: string; imageUrl: string | null; description: string | null; variants: typeof priced }>();
    priced.forEach((p) => {
      const key = p.variant_group || p.id;
      if (!map.has(key)) map.set(key, { key, commercialName: p.commercial_name || p.name, imageUrl: p.image_url, description: p.description, variants: [] });
      map.get(key)!.variants.push(p);
    });
    return Array.from(map.values());
  }, [priced]);

  const cartItems = priced.filter((p) => (qtys[p.id] || 0) > 0);
  const subtotal = cartItems.reduce((s, p) => s + (qtys[p.id] || 0) * p.displayPrice, 0);

  async function handleSubmit() {
    setLoading(true); setError('');
    try {
      const payload = cartItems.map((p) => ({ productId: p.id, qty: qtys[p.id] }));
      const res = await submitCustomerOrder(token, poNumber, shipping, payment, payload);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Gagal mengirim order. Coba lagi ya.');
    }
    setLoading(false);
  }

  if (result) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-3xl mb-2">✓</div>
          <div className="font-serif text-xl font-bold mb-2">Order Diterima</div>
          <p className="text-sm text-gray-600 mb-4">Terima kasih, <b>{customer.name}</b>. Order kamu sudah kami terima dan akan segera diproses tim kami.</p>
          <div className="bg-cream border border-goldsoft rounded-lg p-4 text-sm text-left space-y-1">
            <div className="flex justify-between"><span>No. Order</span><b className="font-mono">{result.orderNo}</b></div>
            <div className="flex justify-between"><span>Estimasi Total</span><b>{rp(result.grandTotal)}</b></div>
            {result.pointsEarned > 0 && <div className="flex justify-between text-golddeep"><span>Poin Diperoleh</span><b>{result.pointsEarned} poin</b></div>}
          </div>
          <p className="text-xs text-gray-400 mt-4">Tim kami akan menghubungi kamu untuk konfirmasi &amp; informasi pengiriman.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <div className="font-serif text-2xl font-bold text-ink">Alamme</div>
          <div className="text-xs uppercase tracking-wide text-golddeep font-bold mt-1">Order Mandiri</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-5">
          <div className="text-sm text-gray-600">Halo, <b className="text-ink">{customer.name}</b> ({customer.type})</div>
          <div className="text-xs text-gray-500 mt-1">Termin: <b>{customer.pay_term}</b>{customer.pkp && <> · Harga sudah termasuk PPN 11%</>}</div>
        </div>

        <h2 className="font-serif text-lg font-semibold mb-3">Pilih Produk</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {groups.map((g) => {
            const activeId = selectedVariant[g.key] || g.variants[0].id;
            const active = g.variants.find((v) => v.id === activeId) || g.variants[0];
            return (
              <div key={g.key} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                {g.imageUrl ? (
                  <img src={g.imageUrl} alt={g.commercialName} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-cream flex items-center justify-center text-gray-300 text-xs">Belum ada gambar</div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="font-serif font-bold text-ink">{g.commercialName}</div>
                  {g.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{g.description}</p>}

                  {g.variants.length > 1 && (
                    <div className="flex gap-1.5 flex-wrap mt-3">
                      {g.variants.map((v) => (
                        <button
                          key={v.id} type="button"
                          onClick={() => setSelectedVariant({ ...selectedVariant, [g.key]: v.id })}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${activeId === v.id ? 'bg-ink text-white border-ink' : 'border-gray-200 text-gray-600'}`}
                        >
                          {v.variant_label || v.uom}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <div className="font-bold text-ink">{rp(active.displayPrice)}</div>
                      <div className="text-[10px] text-gray-400">/{active.uom}</div>
                    </div>
                    <input
                      type="number" step="0.01" min={0} placeholder="0"
                      value={qtys[active.id] || ''}
                      onChange={(e) => setQtys({ ...qtys, [active.id]: parseFloat(e.target.value) || 0 })}
                      className="!w-20 !text-sm text-center"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="font-serif text-lg font-semibold mb-3">Ringkasan Pesanan</h2>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-5">
          {cartItems.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Belum ada produk dipilih.</p>}
          {cartItems.map((p) => (
            <div key={p.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-50 last:border-0">
              <div>
                <div className="font-semibold">{p.commercial_name || p.name} {p.variant_label && <span className="text-gray-400 font-normal">({p.variant_label})</span>}</div>
                <div className="text-xs text-gray-400">{qtys[p.id]} {p.uom} × {rp(p.displayPrice)}</div>
              </div>
              <div className="flex items-center gap-3">
                <b>{rp((qtys[p.id] || 0) * p.displayPrice)}</b>
                <button type="button" onClick={() => setQtys({ ...qtys, [p.id]: 0 })} className="text-red-600 text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-5">
          <div className="field mb-0"><label>No. PO / Catatan (opsional)</label><input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Referensi order kamu" /></div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-5">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Metode Pengiriman</label>
          <div className="flex flex-col gap-2">
            {SHIPPING_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="shipping" checked={shipping === opt} onChange={() => setShipping(opt)} className="w-auto" /> {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-5">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Metode Pembayaran</label>
          <div className="flex flex-col gap-2 mb-3">
            {PAYMENT_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="payment" checked={payment === opt} onChange={() => setPayment(opt)} className="w-auto" /> {opt}
              </label>
            ))}
          </div>
          {payment === 'Transfer Bank' && (
            <div className="bg-cream border border-goldsoft rounded-lg p-3 text-xs text-gray-700 leading-relaxed">
              <div className="font-semibold text-golddeep mb-1">Transfer ke rekening {company?.name || 'Alamme'}:</div>
              {(company?.bank_accounts || []).length === 0 && <div className="text-gray-400">Rekening belum diisi admin.</div>}
              {(company?.bank_accounts || []).map((b, i) => (
                <div key={i}>{b.bank} — <b>{b.accountNo}</b> a.n. {b.holder} ({b.type})</div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-ink text-white rounded-xl p-5 flex justify-between items-center mb-4">
          <span className="text-sm">Subtotal ({cartItems.length} produk dipilih)</span>
          <span className="font-serif text-xl font-bold">{rp(subtotal)}</span>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}

        <button onClick={handleSubmit} disabled={loading || cartItems.length === 0} className="btn btn-primary w-full justify-center py-3 text-base disabled:opacity-50">
          {loading ? 'Mengirim...' : 'Ajukan Order'}
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-3">Order ini akan masuk sebagai penawaran dan dikonfirmasi oleh tim Alamme.</p>
      </div>
    </div>
  );
}
