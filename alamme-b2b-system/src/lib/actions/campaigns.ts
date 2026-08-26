'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function upsertCampaign(formData: FormData) {
  const supabase = createClient();
  const id = formData.get('id') as string;
  const customerTypes = formData.getAll('customer_types') as string[];
  const productIds = formData.getAll('product_ids') as string[];
  const payload = {
    name: formData.get('name') as string,
    type: formData.get('type') as string,
    rp_per_point: parseFloat((formData.get('rp_per_point') as string) || '0'),
    points_per_unit: parseFloat((formData.get('points_per_unit') as string) || '0'),
    product_ids: productIds,
    customer_types: customerTypes.length ? customerTypes : ['Reseller'],
    start_date: (formData.get('start_date') as string) || null,
    end_date: (formData.get('end_date') as string) || null,
    active: formData.get('active') === 'on',
    notes: formData.get('notes') as string,
  };
  if (id) {
    await supabase.from('campaigns').update(payload).eq('id', id);
  } else {
    await supabase.from('campaigns').insert(payload);
  }
  revalidatePath('/campaigns');
}

export async function deleteCampaign(id: string) {
  const supabase = createClient();
  await supabase.from('campaigns').delete().eq('id', id);
  revalidatePath('/campaigns');
}

export async function toggleCampaignActive(id: string, active: boolean) {
  const supabase = createClient();
  await supabase.from('campaigns').update({ active }).eq('id', id);
  revalidatePath('/campaigns');
}
