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

export type OrderItemInput = { productId: string; qty: number; unitPrice: number };

// Kalkulator inti — fokus revenue & biaya operasional (tanpa HPP), sama seperti versi Artifact sebelumnya.
export function computeOrderCalc(
  items: OrderItemInput[],
  discount: number,
  shipCharge: number,
  shipActual: number,
  otherCost: number,
  ppn: boolean
) {
  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const dpp = subtotal - discount + shipCharge;
  const ppnValue = ppn ? dpp * 0.11 : 0;
  const grandTotal = dpp + ppnValue;
  const revenueBersih = subtotal - discount;
  const netProfit = revenueBersih + (shipCharge - shipActual) - otherCost;
  const netMargin = revenueBersih > 0 ? (netProfit / revenueBersih) * 100 : 0;
  return { subtotal, dpp, ppnValue, grandTotal, revenueBersih, netProfit, netMargin };
}

export type Campaign = {
  id: string; name: string; type: string; rp_per_point: number; points_per_unit: number;
  product_ids: string[]; customer_types: string[]; start_date: string | null; end_date: string | null; active: boolean;
};

// Engine poin — dijalankan saat order disimpan, terhadap campaign yang aktif & berlaku untuk tipe customer & tanggal order.
export function computePoints(
  campaigns: Campaign[],
  customerType: string,
  items: OrderItemInput[],
  subtotal: number,
  orderDate: string
) {
  const breakdown: { campaign: string; points: number }[] = [];
  campaigns.forEach((camp) => {
    if (!camp.active) return;
    if (camp.customer_types?.length && !camp.customer_types.includes(customerType)) return;
    if (camp.start_date && orderDate < camp.start_date) return;
    if (camp.end_date && orderDate > camp.end_date) return;
    let pts = 0;
    if (camp.type === 'revenue' && camp.rp_per_point > 0) {
      pts = Math.floor(subtotal / camp.rp_per_point);
    } else if (camp.type === 'product') {
      items.forEach((it) => {
        if ((camp.product_ids || []).includes(it.productId)) pts += it.qty * (camp.points_per_unit || 0);
      });
    }
    if (pts > 0) breakdown.push({ campaign: camp.name, points: pts });
  });
  return { total: breakdown.reduce((s, b) => s + b.points, 0), breakdown };
}
