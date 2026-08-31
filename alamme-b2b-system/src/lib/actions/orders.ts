'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { computeOrderCalc, computePoints, addDays, termDays, genDocNo, todayStr } from '@/lib/utils';

type ItemInput = { productId: string; qty: number; unitPrice: number; discountType: 'percent' | 'value'; discountValue: number };

async function nextCounter(supabase: any, key: string) {
  const { data } = await supabase.from('app_settings').select('value').eq('key', key).single();
  const current = (data?.value as number) || 0;
  const next = current + 1;
  await supabase.from('app_settings').upsert({ key, value: next });
  return next;
}

export async function saveOrder(formData: FormData) {
  const supabase = createClient();
  const id = formData.get('id') as string;
  const customerId = formData.get('customer_id') as string;
  const itemsJson = formData.get('items_json') as string;
  const items: ItemInput[] = JSON.parse(itemsJson || '[]');
  if (!customerId || items.length === 0) throw new Error('Customer dan minimal 1 item wajib diisi.');

  const { data: customer } = await supabase.from('customers').select('*').eq('id', customerId).single();

  const date = (formData.get('order_date') as string) || todayStr();
  const payTerm = formData.get('pay_term') as string;
  const orderDiscountType = ((formData.get('discount_type') as string) || 'value') as 'percent' | 'value';
  const orderDiscountValue = parseFloat((formData.get('discount_value') as string) || '0');
  const shipCharge = parseFloat((formData.get('ship_charge') as string) || '0');
  const shipActual = parseFloat((formData.get('ship_actual') as string) || '0');
  const otherCost = parseFloat((formData.get('other_cost') as string) || '0');
  const ppn = formData.get('ppn') === '1';
  const calc = computeOrderCalc(items, orderDiscountType, orderDiscountValue, shipCharge, shipActual, otherCost, ppn);

  const shipDiffer = formData.get('ship_differ') === '1';
  const shipTo = shipDiffer
    ? {
        ship_same_as_customer: false,
        ship_recipient_name: formData.get('ship_recipient_name') as string,
        ship_recipient_phone: formData.get('ship_recipient_phone') as string,
        ship_province: formData.get('ship_province') as string,
        ship_city: formData.get('ship_city') as string,
        ship_district: formData.get('ship_district') as string,
        ship_address_detail: formData.get('ship_address_detail') as string,
      }
    : {
        ship_same_as_customer: true,
        ship_recipient_name: customer?.pic,
        ship_recipient_phone: customer?.phone,
        ship_province: customer?.province,
        ship_city: customer?.city,
        ship_district: customer?.district,
        ship_address_detail: customer?.address_detail,
      };

  const { data: campaigns } = await supabase.from('campaigns').select('*');
  const { data: pointValueRow } = await supabase.from('app_settings').select('value').eq('key', 'point_value').single();
  const pointValue = (pointValueRow?.value as number) || 1000;
  const pts = customer?.type === 'Reseller'
    ? computePoints(campaigns || [], customer.type, items, calc.subtotal, date, pointValue)
    : { total: 0, breakdown: [] };

  const orderPayload: any = {
    customer_id: customerId,
    po_number: formData.get('po_number') as string,
    order_date: date,
    pay_term: payTerm,
    status: formData.get('status') as string,
    discount: calc.discount, discount_type: orderDiscountType, discount_value: orderDiscountValue,
    ship_charge: shipCharge, ship_actual: shipActual, other_cost: otherCost, ppn,
    due_date: addDays(date, termDays(payTerm)),
    subtotal: calc.subtotal, grand_total: calc.grandTotal, net_profit: calc.netProfit, net_margin: calc.netMargin,
    points_earned: pts.total,
    ...shipTo,
  };

  let orderId = id;
  if (id) {
    const { data: existing } = await supabase.from('orders').select('points_earned').eq('id', id).single();
    await supabase.from('orders').update(orderPayload).eq('id', id);
    await supabase.from('order_items').delete().eq('order_id', id);
    if (customer?.type === 'Reseller') {
      const delta = pts.total - (existing?.points_earned || 0);
      if (delta !== 0) {
        const { data: c2 } = await supabase.from('customers').select('points').eq('id', customerId).single();
        await supabase.from('customers').update({ points: (c2?.points || 0) + delta }).eq('id', customerId);
        await supabase.from('points_ledger').insert({ customer_id: customerId, order_id: id, points: delta, type: 'adjust', notes: 'Update order' });
      }
    }
  } else {
    const orderNo = 'ORD/ALM/' + date.slice(0, 4) + date.slice(5, 7) + '/' + String(Date.now()).slice(-5);
    const invCounter = await nextCounter(supabase, 'invoice_counter');
    const quoCounter = await nextCounter(supabase, 'quo_counter');
    orderPayload.order_no = orderNo;
    orderPayload.invoice_no = genDocNo('INV', invCounter);
    orderPayload.quo_no = genDocNo('QUO', quoCounter);
    orderPayload.fulfillment_status = 'Perlu Disiapkan';
    const { data: inserted, error } = await supabase.from('orders').insert(orderPayload).select('id').single();
    if (error) throw new Error(error.message);
    orderId = inserted.id;
    if (customer?.type === 'Reseller' && pts.total > 0) {
      await supabase.from('customers').update({ points: (customer.points || 0) + pts.total }).eq('id', customerId);
      await supabase.from('points_ledger').insert({ customer_id: customerId, order_id: orderId, points: pts.total, type: 'earn', notes: 'Order ' + orderNo });
    }
    const leadId = formData.get('lead_id') as string;
    if (leadId) {
      await supabase.from('leads').update({ status: 'Deal', converted_order_id: orderId }).eq('id', leadId);
      revalidatePath('/leads');
    }
  }

  const itemRows = items.map((it) => ({
    order_id: orderId, product_id: it.productId, qty: it.qty, unit_price: it.unitPrice,
    discount_type: it.discountType || 'percent', discount_value: it.discountValue || 0,
  }));
  await supabase.from('order_items').insert(itemRows);

  revalidatePath('/orders');
  revalidatePath('/fulfillment');
  redirect('/orders');
}

export async function deleteOrder(id: string) {
  const supabase = createClient();
  await supabase.from('orders').delete().eq('id', id);
  revalidatePath('/orders');
}

export async function markPaid(id: string) {
  const supabase = createClient();
  await supabase.from('orders').update({ status: 'Lunas', paid_date: todayStr() }).eq('id', id);
  revalidatePath('/orders');
}
