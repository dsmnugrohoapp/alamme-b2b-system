'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function upsertCustomer(formData: FormData) {
  const supabase = createClient();
  const id = formData.get('id') as string;
  const payload = {
    name: formData.get('name') as string,
    type: formData.get('type') as string,
    segment: formData.get('segment') as string,
    province: formData.get('province') as string,
    province_id: formData.get('province_id') as string,
    city: formData.get('city') as string,
    city_id: formData.get('city_id') as string,
    district: formData.get('district') as string,
    district_id: formData.get('district_id') as string,
    address_detail: formData.get('address_detail') as string,
    pic: formData.get('pic') as string,
    phone: formData.get('phone') as string,
    email: formData.get('email') as string,
    pay_term: formData.get('pay_term') as string,
    margin: parseFloat((formData.get('margin') as string) || '0'),
    pkp: formData.get('pkp') === '1',
    notes: formData.get('notes') as string,
  };
  if (id) {
    await supabase.from('customers').update(payload).eq('id', id);
  } else {
    await supabase.from('customers').insert(payload);
  }
  revalidatePath('/customers');
}

export async function deleteCustomer(id: string) {
  const supabase = createClient();
  await supabase.from('customers').delete().eq('id', id);
  revalidatePath('/customers');
}

export async function adjustCustomerPoints(id: string, delta: number, notes: string) {
  const supabase = createClient();
  const { data: cust } = await supabase.from('customers').select('points').eq('id', id).single();
  const newPoints = (cust?.points || 0) + delta;
  await supabase.from('customers').update({ points: newPoints }).eq('id', id);
  await supabase.from('points_ledger').insert({
    customer_id: id, order_id: null, points: delta, type: delta > 0 ? 'earn' : 'redeem', notes,
  });
  revalidatePath('/customers');
  revalidatePath('/campaigns');
}

export async function bulkImportCustomers(rows: Record<string, any>[]) {
  const supabase = createClient();
  const norm = (r: Record<string, any>, key: string) => {
    const found = Object.keys(r).find((k) => k.toLowerCase().trim() === key.toLowerCase());
    return found ? r[found] : '';
  };
  const payloadRows = rows
    .map((r) => ({
      name: (norm(r, 'Nama') || '').toString().trim(),
      type: norm(r, 'Tipe') || 'Reseller',
      segment: norm(r, 'Segmen') || 'Domestik',
      province: norm(r, 'Provinsi'),
      city: norm(r, 'Kota/Kabupaten'),
      district: norm(r, 'Kecamatan'),
      address_detail: norm(r, 'Alamat Detail'),
      pic: norm(r, 'PIC'),
      phone: (norm(r, 'Telepon') || '').toString(),
      email: norm(r, 'Email'),
      pay_term: norm(r, 'Termin Bayar') || 'Cash',
      margin: parseFloat(norm(r, 'Margin(%)')) || 0,
      pkp: parseInt(norm(r, 'PKP(1/0)')) !== 0,
      notes: norm(r, 'Catatan'),
    }))
    .filter((r) => r.name);
  if (payloadRows.length === 0) return { added: 0, skipped: rows.length };
  const { error } = await supabase.from('customers').insert(payloadRows);
  revalidatePath('/customers');
  return { added: error ? 0 : payloadRows.length, skipped: rows.length - payloadRows.length, error: error?.message };
}
