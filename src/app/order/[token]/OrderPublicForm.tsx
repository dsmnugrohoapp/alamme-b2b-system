'use client';
import { useMemo, useState } from 'react';
import { submitCustomerOrder } from '@/lib/actions/customerOrder';
import { rp } from '@/lib/utils';

export default function OrderPublicForm({ token, customer, products, company }: { token: string; customer: any; products: any[]; company: any }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [poNumber, setPoNumber] = useState('');
  const [shippingPreference, setShippingPreference] = useState('Kurir Internal Alamme');
  const [paymentMethodPreference, setPaymentMethodPreference] = useState('Sesuai Termin');
  const [variantPick, setVariantPick] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ orderNo: string; grandTotal: number; pointsEarned: number } | null>(null);
  const [error, setError] = useState('');

  const discountFactor = 1 - (customer.margin || 0) / 100;

  const groups = useMemo(() => {
    const map: Record<string, any[]> = {};
    const standalone: any[] = [];
    products.forEach((p) => {
      if (p.variant_group) {
        if (!map[p.variant_group]) map[p.variant_group] = [];
        map[p.variant_group].push(p);
      } else {
        standalone.push(p);
      }
    });
    return { variantGroups: map, standalone };
  }, [products]);

  function setQty(productId: string, qty: number) {
    setCart({ ...cart, [productId]: Math.max(0, qty) });
  }

  const cartLines = Object.entries(cart).filter(([, qty]) => qty > 0).map(([productId, qty]) => {
    const p = products.find((p: any) => p.id === productId);
    const price = Math.round((p?.price || 0) * discountFactor);
    return { productId, name: p?.commercial_name || p?.name, qty, price, subtotal: price * qty };
  });
  const total = cartLines.reduce((s, l) => s + l.subtotal, 0);

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const items = Object.entries(cart).filter(([, qty]) => qty > 0).map(([productId, qty]) => ({ productId, qty }));
      const res = await submitCustomerOrder(token, poNumber, shippingPreference, paymentMethodPreference, items);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Gagal mengirim order, silakan coba lagi.');
    }
    setSubmitting(false);
  }

  if (result) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-3">✓</div>
          <h1 className="font-serif text-xl font-bold mb-2">Order Berhasil Dikirim</h1>
          <p className="text-sm text-gray-500 mb-4">Nomor order Anda:</p>
          <div className="font-mono font-bold text-lg bg-cream rounded-lg py-2.5 mb-4">{result.orderNo}</div>
          <div className="text-sm text-gray-600 space-y-1 mb-4">
            <div>Total: <b>{rp(result.grandTotal)}</b></div>
            {result.pointsEarned > 0 && <div>Poin didapat: <b className="text-golddeep">{result.pointsEarned} poin</b></div>}
          </div>
          <p className="text-xs text-gray-400">Tim kami akan segera memproses order Anda. Terima kasih!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-ink text-white px-5 py-5 text-center">
        <div className="font-serif text-xl font-bold text-goldsoft">{company.name || 'Alamme'}</div>
        <div className="text-xs text-[#CFC8B4] mt-1">Order Mandiri — Halo, {customer.pic || customer.name}!</div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-40">
        <div className="bg-white rounded-xl p-4 mb-4 text-sm">
          <b>{customer.name}</b> ({customer.type}) — Margin harga khusus Anda: <b className="text-golddeep">{customer.margin || 0}%</b>
        </div>

        <h2 className="font-serif font-semibold text-lg mb-3">Katalog Produk</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {Object.entries(groups.variantGroups).map(([groupKey, variants]: [string, any[]]) => {
            const selectedId = variantPick[groupKey] || variants[0].id;
            const p = variants.find((v) => v.id === selectedId) || variants[0];
            const price = Math.round((p.price || 0) * discountFactor);
            return (
              <div key={groupKey} className="bg-white rounded-xl p-3 flex gap-3">
                {p.image_url ? <img src={p.image_url} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" /> : <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{p.commercial_name || p.name}</div>
                  {p.description && <div className="text-[11px] text-gray-500 line-clamp-2">{p.description}</div>}
                  <select value={selectedId} onChange={(e) => setVariantPick({ ...variantPick, [groupKey]: e.target.value })} className="!text-xs !py-1 mt-1.5">
                    {variants.map((v) => <option key={v.id} value={v.id}>{v.variant_label || v.name}</option>)}
                  </select>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm">{rp(price)}</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setQty(p.id, (cart[p.id] || 0) - 1)} className="w-7 h-7 rounded-full border border-gray-300 text-sm">−</button>
                      <input type="number" value={cart[p.id] || 0} onChange={(e) => setQty(p.id, parseInt(e.target.value) || 0)} className="w-12 !text-center !py-1 !text-sm" />
                      <button onClick={() => setQty(p.id, (cart[p.id] || 0) + 1)} className="w-7 h-7 rounded-full border border-gray-300 text-sm">+</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {groups.standalone.map((p: any) => {
            const price = Math.round((p.price || 0) * discountFactor);
            return (
              <div key={p.id} className="bg-white rounded-xl p-3 flex gap-3">
                {p.image_url ? <img src={p.image_url} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" /> : <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{p.commercial_name || p.name}</div>
                  <div className="text-[11px] text-gray-400">{p.uom}</div>
                  {p.description && <div className="text-[11px] text-gray-500 line-clamp-2">{p.description}</div>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm">{rp(price)}</span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setQty(p.id, (cart[p.id] || 0) - 1)} className="w-7 h-7 rounded-full border border-gray-300 text-sm">−</button>
                      <input type="number" value={cart[p.id] || 0} onChange={(e) => setQty(p.id, parseInt(e.target.value) || 0)} className="w-12 !text-center !py-1 !text-sm" />
                      <button onClick={() => setQty(p.id, (cart[p.id] || 0) + 1)} className="w-7 h-7 rounded-full border border-gray-300 text-sm">+</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl p-4 mb-4">
          <div className="field mb-3"><label>No. PO (opsional)</label><input value={poNumber} onChange={(e) => setPoNumber(e.target.value)} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="field mb-0"><label>Preferensi Kurir</label>
              <select value={shippingPreference} onChange={(e) => setShippingPreference(e.target.value)}>
                <option>Kurir Internal Alamme</option><option>Kurir Lain</option>
              </select>
            </div>
            <div className="field mb-0"><label>Metode Pembayaran</label>
              <select value={paymentMethodPreference} onChange={(e) => setPaymentMethodPreference(e.target.value)}>
                <option>Sesuai Termin</option><option>Transfer Bank</option><option>COD</option>
              </select>
              {paymentMethodPreference === 'Transfer Bank' && (company.bank_accounts || []).length > 0 && (
                <div className="text-[11px] text-gray-500 mt-1.5">
                  {(company.bank_accounts || []).map((b: any, i: number) => <div key={i}>{b.bank} {b.accountNo} a.n. {b.holder}</div>)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto">
          {cartLines.length > 0 && (
            <div className="text-xs text-gray-500 mb-2 max-h-24 overflow-y-auto">
              {cartLines.map((l) => <div key={l.productId} className="flex justify-between"><span>{l.name} x{l.qty}</span><span>{rp(l.subtotal)}</span></div>)}
            </div>
          )}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[11px] text-gray-500">Total ({cartLines.length} item)</div>
              <div className="font-serif font-bold text-lg">{rp(total)}</div>
            </div>
            <button onClick={handleSubmit} disabled={submitting || cartLines.length === 0} className="btn btn-primary">
              {submitting ? 'Mengirim...' : 'Kirim Order'}
            </button>
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
