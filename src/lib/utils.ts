export function rp(n: number | null | undefined) {
  const v = Math.round(n || 0);
  return 'Rp' + v.toLocaleString('id-ID');
}
export function pct(n: number | null | undefined) {
  return (Math.round((n || 0) * 10) / 10) + '%';
}
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
export function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
export function termDays(term: string) {
  if (!term) return 0;
  if (term === 'Cash' || term === 'CBD' || term === 'COD' || term === 'Consignment') return 0;
  const m = term.match(/\d+/);
  return m ? parseInt(m[0]) : 0;
}
export function genDocNo(prefix: string, counter: number) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${prefix}/ALM/${y}${m}/${String(counter).padStart(3, '0')}`;
}

export type OrderItemInput = {
  productId: string;
  qty: number;
  unitPrice: number;
  discountType: 'percent' | 'value';
  discountValue: number;
};

export function computeLineTotal(item: OrderItemInput) {
  const gross = item.qty * item.unitPrice;
  let discountAmount = item.discountType === 'percent' ? (gross * (item.discountValue || 0)) / 100 : item.discountValue || 0;
  discountAmount = Math.max(0, Math.min(discountAmount, gross));
  return { gross, discountAmount, net: gross - discountAmount };
}

export function computeOrderCalc(
  items: OrderItemInput[],
  orderDiscountType: 'percent' | 'value',
  orderDiscountValue: number,
  shipCharge: number,
  shipActual: number,
  otherCost: number,
  ppn: boolean
) {
  const lineResults = items.map(computeLineTotal);
  const itemDiscountTotal = lineResults.reduce((s, l) => s + l.discountAmount, 0);
  const subtotal = lineResults.reduce((s, l) => s + l.net, 0);

  const orderDiscountAmount =
    orderDiscountType === 'percent' ? (subtotal * (orderDiscountValue || 0)) / 100 : orderDiscountValue || 0;
  const discount = Math.max(0, Math.min(orderDiscountAmount, subtotal));

  const dpp = subtotal - discount + shipCharge;
  const ppnValue = ppn ? dpp * 0.11 : 0;
  const grandTotal = dpp + ppnValue;
  const revenueBersih = subtotal - discount;
  const netProfit = revenueBersih + (shipCharge - shipActual) - otherCost;
  const netMargin = revenueBersih > 0 ? (netProfit / revenueBersih) * 100 : 0;
  return { subtotal, itemDiscountTotal, discount, dpp, ppnValue, grandTotal, revenueBersih, netProfit, netMargin };
}

export type Campaign = {
  id: string; name: string; type: string; value_mode?: string;
  rp_per_point: number; points_per_unit: number; percent_value?: number;
  product_ids: string[]; customer_types: string[]; start_date: string | null; end_date: string | null; active: boolean;
};

export function computePoints(
  campaigns: Campaign[],
  customerType: string,
  items: OrderItemInput[],
  subtotal: number,
  orderDate: string,
  pointValue: number = 1000
) {
  const breakdown: { campaign: string; points: number }[] = [];
  campaigns.forEach((camp) => {
    if (!camp.active) return;
    if (camp.customer_types?.length && !camp.customer_types.includes(customerType)) return;
    if (camp.start_date && orderDate < camp.start_date) return;
    if (camp.end_date && orderDate > camp.end_date) return;
    const mode = camp.value_mode || 'value';
    let pts = 0;
    if (camp.type === 'revenue') {
      if (mode === 'percent') {
        pts = pointValue > 0 ? Math.floor((subtotal * (camp.percent_value || 0)) / 100 / pointValue) : 0;
      } else if (camp.rp_per_point > 0) {
        pts = Math.floor(subtotal / camp.rp_per_point);
      }
    } else if (camp.type === 'product') {
      items.forEach((it) => {
        if (!(camp.product_ids || []).includes(it.productId)) return;
        if (mode === 'percent') {
          const lineRevenue = it.qty * it.unitPrice;
          pts += pointValue > 0 ? Math.floor((lineRevenue * (camp.percent_value || 0)) / 100 / pointValue) : 0;
        } else {
          pts += it.qty * (camp.points_per_unit || 0);
        }
      });
    }
    if (pts > 0) breakdown.push({ campaign: camp.name, points: pts });
  });
  return { total: breakdown.reduce((s, b) => s + b.points, 0), breakdown };
}

// ---------- CRM Broadcast WhatsApp helpers ----------

// Ubah nomor telepon Indonesia (format apa pun: 08xx, +628xx, 628xx, dengan spasi/strip)
// jadi format internasional murni (628xxxxxxxxxx) yang dibutuhkan link wa.me
export function toWaNumber(phone: string | null | undefined): string {
  let p = (phone || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+62')) p = p.slice(1);
  else if (p.startsWith('62')) { /* sudah benar */ }
  else if (p.startsWith('0')) p = '62' + p.slice(1);
  else if (p) p = '62' + p;
  return p;
}

export function waLink(phone: string | null | undefined, message?: string): string {
  const num = toWaNumber(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${num}${text}`;
}

function replaceAllSafe(str: string, token: string, val: string) {
  return str.split(token).join(val);
}

// Mendeteksi karakter "rusak" (mojibake) — biasanya muncul saat emoji di-paste dari
// sumber lain (Word, Notes, WA tool lain) dengan encoding yang tidak cocok.
// U+FFFD adalah "replacement character" yang browser tampilkan sebagai kotak/tanda tanya (�).
export function hasBrokenEncoding(text: string): boolean {
  return (text || '').includes('\uFFFD');
}

// Ganti placeholder {nama}, {tipe}, {kota}, {pic}, {termin}, {poin}, {margin} dengan data customer
export function renderTemplate(content: string, customer: any): string {
  let out = content || '';
  out = replaceAllSafe(out, '{nama}', customer?.name || '');
  out = replaceAllSafe(out, '{tipe}', customer?.type || '');
  out = replaceAllSafe(out, '{kota}', customer?.city || '');
  out = replaceAllSafe(out, '{pic}', customer?.pic || '');
  out = replaceAllSafe(out, '{termin}', customer?.pay_term || '');
  out = replaceAllSafe(out, '{poin}', String(customer?.points || 0));
  out = replaceAllSafe(out, '{margin}', String(customer?.margin || 0));
  return out;
}
