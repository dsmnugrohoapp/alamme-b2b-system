'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function upsertProduct(formData: FormData) {
  const supabase = createClient();
  const id = formData.get('id') as string;
  const payload = {
    sku: formData.get('sku') as string,
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    uom: formData.get('uom') as string,
    price: parseFloat((formData.get('price') as string) || '0'),
  };
  if (id) {
    await supabase.from('products').update(payload).eq('id', id);
  } else {
    await supabase.from('products').insert(payload);
  }
  revalidatePath('/products');
}

export async function deleteProduct(id: string) {
  const supabase = createClient();
  await supabase.from('products').delete().eq('id', id);
  revalidatePath('/products');
}
