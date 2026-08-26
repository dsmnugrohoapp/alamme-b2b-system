'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { todayStr, genDocNo } from '@/lib/utils';

export async function startPrepare(orderId: string) {
  const supabase = createClient();
  await supabase.from('orders').update({ fulfillment_status: 'Disiapkan', prepared_at: todayStr() }).eq('id', orderId);
  revalidatePath('/fulfillment');
}

export async function confirmShip(orderId: string, courier: string, trackingNo: string, notes: string) {
  const supabase = createClient();
  const { data: order } = await supabase.from('orders').select('surat_jalan_no,status').eq('id', orderId).single();
  let suratJalanNo = order?.surat_jalan_no;
  if (!suratJalanNo) {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'surat_jalan_counter').single();
    const next = ((data?.value as number) || 0) + 1;
    await supabase.from('app_settings').upsert({ key: 'surat_jalan_counter', value: next });
    suratJalanNo = genDocNo('SJ', next);
  }
  const newStatus = order?.status === 'PO Diterima' || order?.status === 'Diproses' ? 'Dikirim' : order?.status;
  await supabase.from('orders').update({
    fulfillment_status: 'Dikirim', shipped_at: todayStr(), courier, tracking_no: trackingNo,
    fulfillment_notes: notes, surat_jalan_no: suratJalanNo, status: newStatus,
  }).eq('id', orderId);
  revalidatePath('/fulfillment');
  revalidatePath('/orders');
  return suratJalanNo;
}

export async function confirmDeliver(orderId: string, receivedBy: string, deliveredDate: string, notes: string) {
  const supabase = createClient();
  await supabase.from('orders').update({
    fulfillment_status: 'Diterima', delivered_at: deliveredDate || todayStr(), received_by: receivedBy, fulfillment_notes: notes,
  }).eq('id', orderId);
  revalidatePath('/fulfillment');
}

export async function submitReturn(orderId: string, reason: string, items: { productId: string; qty: number }[]) {
  const supabase = createClient();
  const { data: ret } = await supabase.from('order_returns').insert({ order_id: orderId, reason }).select('id').single();
  const rows = items.map((it) => ({ return_id: ret!.id, product_id: it.productId, qty: it.qty }));
  await supabase.from('order_return_items').insert(rows);

  const { data: orderItems } = await supabase.from('order_items').select('qty').eq('order_id', orderId);
  const totalOrdered = (orderItems || []).reduce((s, it) => s + Number(it.qty), 0);
  const { data: allReturns } = await supabase.from('order_returns').select('id, order_return_items(qty)').eq('order_id', orderId);
  const totalReturned = (allReturns || []).reduce((s: number, r: any) => s + (r.order_return_items || []).reduce((s2: number, i: any) => s2 + Number(i.qty), 0), 0);
  const status = totalReturned >= totalOrdered ? 'Retur Total' : 'Retur Sebagian';
  await supabase.from('orders').update({ fulfillment_status: status }).eq('id', orderId);
  revalidatePath('/fulfillment');
}
