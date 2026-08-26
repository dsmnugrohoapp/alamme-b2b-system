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
