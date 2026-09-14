'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveCompanySettings(companyId: string, data: any) {
  const supabase = createClient();
  await supabase.from('company_settings').upsert({ id: companyId, ...data });
  revalidatePath('/settings');
  revalidatePath('/orders');
}

export async function savePointValue(value: number) {
  const supabase = createClient();
  await supabase.from('app_settings').upsert({ key: 'point_value', value });
  revalidatePath('/settings');
  revalidatePath('/campaigns');
}

export async function savePublicOrderCompany(companyId: string) {
  const supabase = createClient();
  await supabase.from('app_settings').upsert({ key: 'public_order_company', value: companyId });
  revalidatePath('/settings');
}
