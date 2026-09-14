'use server';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeOrderCalc, computePoints, addDays, termDays, genDocNo, todayStr } from '@/lib/utils';

type PublicItem = { productId: string; qty: number };

async function nextCounter(supabase: any, key: string) {
  const { data } = await supabase.from('app_settings').select('value').eq('key', key).single();
  const current = (data?.value as number) || 0;
  const next = current + 1;
  await supabase.from('app_settings').upsert({ key, value: next });
  return next;
}

export async function submitCustomerOrder(token: string, poNumber: string, shippingPreference: string, paymentMethodPreference: string, rawItems: PublicItem[]) {
  const supabase = createAdminClient();

  const { data: customer } = await supabase.from('customers').select('*').eq('order_token', token).single();
  if (!customer) throw new Error('Link tidak valid atau sudah tidak berlaku.');

  const selected = (rawItems || []).filter((i) => i.qty > 0);
  if (selected.length === 0) throw new Error('Pilih minimal 1 produk dengan jumlah lebih dari 0.');

  const { data: products } = await supabase.from('products').select('id, price').in('id', selected.map((i) => i.productId));
  const priceMap = new Map((products || []).map((p: any) => [p.id, p.price]));
  const discountFactor = 1 - (customer.margin || 0) / 100;

  const items = selected.map((i) => ({
    productId: i.productId,
    qty: i.qty,
    unitPrice: Math.round((priceMap.get(i.productId) || 0) * discountFactor),
    discountType: 'percent' as const,
    discountValue: 0,
  }));

  const date = todayStr();
  const calc = computeOrderCalc(items, 'value', 0, 0, 0, 0, !!customer.pkp);

  const [{ data: campaigns }, { data: pointValueRow }] = await Promise.all([
    supabase.from('campaigns').select('*'),
    supabase.from('app_settings').select('value').eq('key', 'point_value').single(),
  ]);
  const pointValue = (pointValueRow?.value as number) || 1000;
  const pts = customer.type === 'Reseller' ? computePoints(campaigns || [], customer.type, items, calc.subtotal, date, pointValue) : { total: 0, breakdown: [] };

  const orderNo = 'ORD/ALM/' + date.slice(0, 4) + date.slice(5, 7) + '/' + String(Date.now()).slice(-5);
  const invCounter = await nextCounter(supabase, 'invoice_counter');
  const quoCounter = await nextCounter(supabase, 'quo_counter');

  const orderPayload: any = {
    customer_id: customer.id, po_number: poNumber || '', order_date: date, pay_term: customer.pay_term,
    status: 'Penawaran', discount: 0, discount_type: 'value', discount_value: 0,
    ship_charge: 0, ship_actual: 0, other_cost: 0, ppn: !!customer.pkp,
    shipping_preference: shippingPreference || null, payment_method_preference: paymentMethodPreference || null,
    due_date: addDays(date, termDays(customer.pay_term)),
    subtotal: calc.subtotal, grand_total: calc.grandTotal, net_profit: calc.netProfit, net_margin: calc.netMargin,
    points_earned: pts.total,
    ship_same_as_customer: true, ship_recipient_name: customer.pic, ship_recipient_phone: customer.phone,
    ship_province: customer.province, ship_city: customer.city, ship_district: customer.district, ship_address_detail: customer.address_detail,
    order_no: orderNo, invoice_no: genDocNo('INV', invCounter), quo_no: genDocNo('QUO', quoCounter),
    fulfillment_status: 'Perlu Disiapkan',
  };

  const { data: inserted, error } = await supabase.from('orders').insert(orderPayload).select('id').single();
  if (error) throw new Error(error.message);

  const itemRows = items.map((it) => ({
    order_id: inserted.id, product_id: it.productId, qty: it.qty, unit_price: it.unitPrice,
    discount_type: it.discountType, discount_value: it.discountValue,
  }));
  await supabase.from('order_items').insert(itemRows);

  if (customer.type === 'Reseller' && pts.total > 0) {
    await supabase.from('customers').update({ points: (customer.points || 0) + pts.total }).eq('id', customer.id);
    await supabase.from('points_ledger').insert({ customer_id: customer.id, order_id: inserted.id, points: pts.total, type: 'earn', notes: 'Order mandiri ' + orderNo });
  }

  return { orderNo, grandTotal: calc.grandTotal, pointsEarned: pts.total };
}
