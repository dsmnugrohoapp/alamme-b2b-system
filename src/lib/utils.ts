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
  if (term === 'Cash' || term === 'CBD' || term === 'COD') return 0;
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
  discountType: 'percent' | 'value'; // diskon deal khusus per produk
  discountValue: number;
};

export function computeLineTotal(item: OrderItemInput) {
  const gross = item.qty * item.unitPrice;
  let discountAmount = item.discountType === 'percent' ? (gross * (item.discountValue || 0)) / 100 : item.discountValue || 0;
  discountAmount = Math.max(0, Math.min(discountAmount, gross));
  return { gross, discountAmount, net: gross - discountAmount };
}

// Kalkulator inti — fokus revenue & biaya operasional (tanpa HPP).
// discount order-level bisa dalam mode 'value' (Rp) atau 'percent' (dari subtotal setelah diskon per-item).
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

// value_mode 'value'   -> revenue: Rp per 1 poin | product: poin tetap per unit
// value_mode 'percent' -> revenue: % dari nilai transaksi | product: % dari harga produk per unit
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
