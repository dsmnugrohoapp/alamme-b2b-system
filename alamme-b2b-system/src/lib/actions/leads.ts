'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { todayStr } from '@/lib/utils';

type LeadItemInput = { productId: string; currentBrand: string; usualPrice: number; frequency: string; qtyPerFrequency: number };

export async function upsertLead(formData: FormData) {
  const supabase = createClient();
  const id = formData.get('id') as string;
  const customerId = formData.get('customer_id') as string;
  if (!customerId) throw new Error('Customer wajib dipilih.');
  const itemsJson = formData.get('items_json') as string;
  const items: LeadItemInput[] = JSON.parse(itemsJson || '[]');

  const payload = {
    customer_id: customerId,
    contact_name: formData.get('contact_name') as string,
    contact_phone: formData.get('contact_phone') as string,
    contact_email: formData.get('contact_email') as string,
    deal_rating: (formData.get('deal_rating') as string) || 'Warm',
    status: (formData.get('status') as string) || 'Baru',
    next_follow_up_date: (formData.get('next_follow_up_date') as string) || null,
    notes: formData.get('notes') as string,
  };

  let leadId = id;
  if (id) {
    await supabase.from('leads').update(payload).eq('id', id);
    await supabase.from('lead_items').delete().eq('lead_id', id);
  } else {
    const { data: inserted, error } = await supabase.from('leads').insert(payload).select('id').single();
    if (error) throw new Error(error.message);
    leadId = inserted.id;
  }

  if (items.length > 0) {
    const rows = items.map((it) => ({
      lead_id: leadId, product_id: it.productId, current_brand: it.currentBrand,
      usual_price: it.usualPrice, frequency: it.frequency, qty_per_frequency: it.qtyPerFrequency,
    }));
    await supabase.from('lead_items').insert(rows);
  }

  revalidatePath('/leads');
}

export async function deleteLead(id: string) {
  const supabase = createClient();
  await supabase.from('leads').delete().eq('id', id);
  revalidatePath('/leads');
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = createClient();
  await supabase.from('leads').update({ status }).eq('id', id);
  revalidatePath('/leads');
}

// Order yang gagal / batal / retur total didaur ulang jadi Lead baru untuk di-follow-up lagi.
export async function sendOrderToLeads(orderId: string) {
  const supabase = createClient();
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from('orders').select('*, customers(pic, phone, email)').eq('id', orderId).single(),
    supabase.from('order_items').select('product_id, qty, unit_price').eq('order_id', orderId),
  ]);
  if (!order) throw new Error('Order tidak ditemukan.');

  const { data: lead, error } = await supabase.from('leads').insert({
    customer_id: order.customer_id,
    contact_name: order.customers?.pic || '',
    contact_phone: order.customers?.phone || '',
    contact_email: order.customers?.email || '',
    deal_rating: 'Warm',
    status: 'Proses Follow-up',
    source_order_id: orderId,
    notes: `Follow-up ulang dari order ${order.order_no} yang tidak jadi difulfill.`,
  }).select('id').single();
  if (error) throw new Error(error.message);

  const itemRows = (items || []).map((it) => ({
    lead_id: lead.id, product_id: it.product_id, current_brand: '', usual_price: it.unit_price,
    frequency: 'Bulanan', qty_per_frequency: it.qty,
  }));
  if (itemRows.length > 0) await supabase.from('lead_items').insert(itemRows);

  revalidatePath('/leads');
  revalidatePath('/orders');
  redirect('/leads');
}
