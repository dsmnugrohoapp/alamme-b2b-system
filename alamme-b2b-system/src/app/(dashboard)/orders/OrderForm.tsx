'use client';
import { useMemo, useState } from 'react';
import { saveOrder } from '@/lib/actions/orders';
import WilayahSelect from '@/components/WilayahSelect';
import { computeOrderCalc, computePoints, rp, pct, todayStr, type Campaign, type OrderItemInput } from '@/lib/utils';

type Product = { id: string; sku: string; name: string; uom: string; price: number };
type Customer = { id: string; name: string; type: string; city: string; pay_term: string; pkp: boolean; phone: string; pic: string };
type Item = OrderItemInput;

export default function OrderForm({
  products, customers, campaigns, order, orderItems, pointValue = 1000,
}: {
  products: Product[]; customers: Customer[]; campaigns: Campaign[]; pointValue?: number;
  order?: any; orderItems?: { product_id: string; qty: number; unit_price: number; discount_type?: string; discount_value?: number }[];
}) {
  const [customerId, setCustomerId] = useState(order?.customer_id || '');
  const [customerQuery, setCustomerQuery] = useState(
    order ? customers.find((c) => c.id === order.customer_id)?.name || '' : ''
  );
  const [showResults, setShowResults] = useState(false);
  const [items, setItems] = useState<Item[]>(
    orderItems?.map((it) => ({
      productId: it.product_id, qty: Number(it.qty), unitPrice: Number(it.unit_price),
      discountType: (it.discount_type as 'percent' | 'value') || 'percent', discountValue: Number(it.discount_value || 0),
    })) || []
  );
  const [orderDiscountType, setOrderDiscountType] = useState<'percent' | 'value'>((order?.discount_type as any) || 'value');
  const [orderDiscountValue, setOrderDiscountValue] = useState(order?.discount_value || 0);
  const [shipCharge, setShipCharge] = useState(order?.ship_charge || 0);
  const [shipActual, setShipActual] = useState(order?.ship_actual || 0);
  const [otherCost, setOtherCost] = useState(order?.other_cost || 0);
  const [ppn, setPpn] = useState<boolean>(order?.ppn ?? false);
  const [payTerm, setPayTerm] = useState(order?.pay_term || 'Cash');
  const [status, setStatus] = useState(order?.status || 'Penawaran');
  const [date, setDate] = useState(order?.order_date || todayStr());
  const [shipDiffer, setShipDiffer] = useState(order ? !order.ship_same_as_customer : false);

  const customer = customers.find((c) => c.id === customerId);
  const matches = customerQuery ? customers.filter((c) => c.name.toLowerCase().includes(customerQuery.toLowerCase())).slice(0, 15) : [];

  function selectCustomer(c: Customer) {
    setCustomerId(c.id);
    setCustomerQuery(c.name);
    setShowResults(false);
    setPayTerm(c.pay_term);
    setPpn(!!c.pkp);
  }

  function addItem() {
    if (products.length === 0) return;
    const p = products[0];
    const newItem: Item = { productId: p.id, qty: 1, unitPrice: p.price, discountType: 'percent', discountValue: 0 };
    setItems([...items, newItem]);
  }
  function updateItem(idx: number, field: keyof Item, value: any) {
    const next = [...items];
    if (field === 'productId') {
      const p = products.find((p) => p.id === value);
      next[idx] = { ...next[idx], productId: value, unitPrice: p ? p.price : next[idx].unitPrice };
    } else if (field === 'discountType') {
      next[idx] = { ...next[idx], discountType: value };
    } else {
      next[idx] = { ...next[idx], [field]: parseFloat(value) || 0 };
    }
    setItems(next);
  }
  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  const calc = useMemo(
    () => computeOrderCalc(items, orderDiscountType, orderDiscountValue, shipCharge, shipActual, otherCost, ppn),
    [items, orderDiscountType, orderDiscountValue, shipCharge, shipActual, otherCost, ppn]
  );
  const pointsPreview = useMemo(() => {
    if (!customer || customer.type !== 'Reseller') return { total: 0, breakdown: [] };
    return computePoints(campaigns, customer.type, items, calc.subtotal, date, pointValue);
  }, [customer, items, calc.subtotal, date, campaigns, pointValue]);

  return (
    <form action={saveOrder}>
      <input type="hidden" name="id" defaultValue={order?.id || ''} />
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="items_json" value={JSON.stringify(items)} />
      <input type="hidden" name="ppn" value={ppn ? '1' : '0'} />
      <input type="hidden" name="ship_differ" value={shipDiffer ? '1' : '0'} />
      <input type="hidden" name="discount_type" value={orderDiscountType} />
      <input type="hidden" name="discount_value" value={orderDiscountValue} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="field relative">
          <label>Cari Customer</label>
          <input
            value={customerQuery}
            onChange={(e) => { setCustomerQuery(e.target.value); setShowResults(true); setCustomerId(''); }}
            onFocus={() => setShowResults(true)}
            placeholder="Ketik nama customer..."
            autoComplete="off"
          />
          {showResults && matches.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-56 overflow-y-auto">
              {matches.map((c) => (
                <div key={c.id} className="px-3 py-2 text-sm cursor-pointer hover:bg-cream border-b border-gray-50" onClick={() => selectCustomer(c)}>
                  <b>{c.name}</b><div className="text-[11px] text-gray-400">{c.type} — {c.city || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="field"><label>No. PO Customer</label><input name="po_number" defaultValue={order?.po_number} /></div>
        <div className="field"><label>Tanggal Order</label><input type="date" name="order_date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      </div>

      {customer && (
        <div className="bg-cream border border-dashed border-goldsoft rounded-lg px-3 py-2.5 text-xs text-gray-600 mb-3">
          <b>{customer.name}</b> ({customer.type}) — {customer.city || 'alamat belum diisi'} {customer.phone && `— ${customer.phone}`}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="field"><label>Termin Pembayaran</label>
          <select name="pay_term" value={payTerm} onChange={(e) => setPayTerm(e.target.value)}>
            <option>Cash</option><option>CBD</option><option>COD</option><option>TOP 7</option><option>TOP 14</option><option>TOP 30</option><option>TOP 45</option><option>TOP 60</option>
          </select>
        </div>
        <div className="field"><label>Status Order</label>
          <select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Penawaran</option><option>PO Diterima</option><option>Diproses</option><option>Invoiced</option><option>Dikirim</option><option>Lunas</option><option>Batal</option>
          </select>
        </div>
        <div className="field"><label>PPN 11%?</label>
          <div className="flex gap-2 mt-1.5">
            <button type="button" onClick={() => setPpn(true)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${ppn ? 'bg-ink text-white border-ink' : 'border-gray-200 text-gray-600'}`}>Kena PPN</button>
            <button type="button" onClick={() => setPpn(false)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${!ppn ? 'bg-ink text-white border-ink' : 'border-gray-200 text-gray-600'}`}>Non-PPN</button>
          </div>
        </div>
      </div>

      <fieldset className="border border-dashed border-gray-300 rounded-lg p-3 mb-3">
        <legend className="text-[11px] font-bold uppercase text-golddeep px-1">Alamat Pengiriman</legend>
        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
          <input type="checkbox" checked={shipDiffer} onChange={(e) => setShipDiffer(e.target.checked)} className="w-auto" />
          Kirim ke alamat berbeda dari alamat customer
        </label>
        {shipDiffer && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="field"><label>Nama Penerima</label><input name="ship_recipient_name" defaultValue={order?.ship_recipient_name} /></div>
              <div className="field"><label>No. Telepon Penerima</label><input name="ship_recipient_phone" defaultValue={order?.ship_recipient_phone} /></div>
            </div>
            <WilayahSelect
              namePrefix="ship_"
              defaultProvinceName={order?.ship_province} defaultCityName={order?.ship_city} defaultDistrictName={order?.ship_district}
            />
            <div className="field"><label>Alamat Detail</label><textarea name="ship_address_detail" rows={2} defaultValue={order?.ship_address_detail} /></div>
          </div>
        )}
      </fieldset>

      <fieldset className="border border-dashed border-gray-300 rounded-lg p-3 mb-3">
        <legend className="text-[11px] font-bold uppercase text-golddeep px-1">Item Order</legend>
        <p className="text-xs text-gray-500 mb-2">Diskon per produk untuk deal khusus reseller/distributor — pilih Persen atau Rp per baris.</p>
        <div className="hidden md:grid grid-cols-[2fr_70px_110px_130px_120px_30px] gap-2 text-[10.5px] uppercase text-gray-500 font-bold mb-1.5">
          <div>Produk</div><div>Qty</div><div>Harga Jual/unit</div><div>Diskon</div><div>Subtotal Bersih</div><div></div>
        </div>
        {items.length === 0 && <p className="text-sm text-gray-400 mb-2">Belum ada item.</p>}
        {items.map((it, idx) => {
          const line = (() => {
            const gross = it.qty * it.unitPrice;
            const disc = it.discountType === 'percent' ? (gross * (it.discountValue || 0)) / 100 : it.discountValue || 0;
            return { gross, net: Math.max(0, gross - Math.min(disc, gross)) };
          })();
          return (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-[2fr_70px_110px_130px_120px_30px] gap-2 mb-2 items-center border md:border-0 rounded-lg p-2 md:p-0">
              <select value={it.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)}>
                {products.map((p) => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
              </select>
              <input type="number" value={it.qty} min={0} onChange={(e) => updateItem(idx, 'qty', e.target.value)} />
              <input type="number" value={it.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} />
              <div className="flex gap-1">
                <select value={it.discountType} onChange={(e) => updateItem(idx, 'discountType', e.target.value)} className="!px-1.5 !text-xs w-16">
                  <option value="percent">%</option>
                  <option value="value">Rp</option>
                </select>
                <input type="number" value={it.discountValue} min={0} onChange={(e) => updateItem(idx, 'discountValue', e.target.value)} placeholder="0" className="!text-xs" />
              </div>
              <div className="font-mono text-xs pt-2">{rp(line.net)}</div>
              <button type="button" onClick={() => removeItem(idx)} className="text-red-600 text-sm">✕</button>
            </div>
          );
        })}
        <button type="button" onClick={addItem} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>+ Tambah Item</button>
      </fieldset>

      <fieldset className="border border-dashed border-gray-300 rounded-lg p-3 mb-3">
        <legend className="text-[11px] font-bold uppercase text-golddeep px-1">Biaya &amp; Ongkir</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="field">
            <label>Diskon Keseluruhan Order (toko)</label>
            <div className="flex gap-1">
              <select value={orderDiscountType} onChange={(e) => setOrderDiscountType(e.target.value as any)} className="w-24">
                <option value="value">Rp</option>
                <option value="percent">% / Margin</option>
              </select>
              <input type="number" value={orderDiscountValue} min={0} onChange={(e) => setOrderDiscountValue(parseFloat(e.target.value) || 0)} />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">≈ {rp(calc.discount)} {orderDiscountType === 'percent' ? `(dari subtotal setelah diskon item)` : ''}</p>
          </div>
          <div className="field"><label>Ongkir Dibebankan ke Customer (Rp)</label><input type="number" name="ship_charge" value={shipCharge} onChange={(e) => setShipCharge(parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Biaya Ongkir Aktual (Rp)</label><input type="number" name="ship_actual" value={shipActual} onChange={(e) => setShipActual(parseFloat(e.target.value) || 0)} /></div>
        </div>
        <div className="field mt-1"><label>Biaya Operasional Lain (Rp)</label><input type="number" name="other_cost" value={otherCost} onChange={(e) => setOtherCost(parseFloat(e.target.value) || 0)} /></div>
      </fieldset>

      <div className="bg-cream border border-goldsoft rounded-lg p-4 text-sm space-y-1">
        <Row label="Subtotal Kotor (sebelum diskon item)" value={rp(items.reduce((s, it) => s + it.qty * it.unitPrice, 0))} />
        <Row label="Total Diskon per Item (deal khusus)" value={'− ' + rp(calc.itemDiscountTotal)} />
        <Row label="Subtotal Bersih" value={rp(calc.subtotal)} />
        <Row label={`Diskon Keseluruhan Order ${orderDiscountType === 'percent' ? `(${orderDiscountValue}%)` : ''}`} value={'− ' + rp(calc.discount)} />
        <Row label="Ongkir (dibebankan ke customer)" value={rp(shipCharge)} />
        <Row label="DPP" value={rp(calc.dpp)} />
        <Row label={`PPN 11% ${ppn ? '' : '(non-PPN)'}`} value={rp(calc.ppnValue)} />
        <div className="flex justify-between font-extrabold text-base border-t border-goldsoft mt-1.5 pt-2">
          <span>Grand Total Invoice</span><span>{rp(calc.grandTotal)}</span>
        </div>
        <div className="border-t border-dashed border-gray-300 mt-2 pt-2 space-y-1 text-[12.5px] text-gray-600">
          <Row label="Revenue Bersih" value={rp(calc.revenueBersih)} />
          <Row label="Selisih Ongkir (charge − real cost)" value={rp(shipCharge - shipActual)} />
          <Row label="Biaya Operasional Lain" value={'− ' + rp(otherCost)} />
          <div className="flex justify-between font-extrabold text-green-700 border-t border-dashed border-gray-300 mt-1 pt-1.5">
            <span>Net Profit (Margin {pct(calc.netMargin)})</span><span>{rp(calc.netProfit)}</span>
          </div>
        </div>
        {customer?.type === 'Reseller' && (
          <div className="border-t border-dashed border-goldsoft mt-2 pt-2">
            <div className="flex justify-between font-bold text-golddeep text-[12.5px]">
              <span>Poin Diperoleh{pointsPreview.breakdown.length ? ' — ' + pointsPreview.breakdown.map((b) => b.campaign).join(', ') : ''}</span>
              <span>{pointsPreview.total} poin</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-right mt-4"><button type="submit" className="btn btn-primary">Simpan Order</button></div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span>{label}</span><span>{value}</span></div>;
}
