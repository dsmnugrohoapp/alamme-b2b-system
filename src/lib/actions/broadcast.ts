'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { renderTemplate } from '@/lib/utils';

export async function upsertTemplate(formData: FormData) {
  const supabase = createClient();
  const id = formData.get('id') as string;
  const payload = {
    name: formData.get('name') as string,
    category: (formData.get('category') as string) || 'Lainnya',
    content: formData.get('content') as string,
  };
  if (id) {
    await supabase.from('message_templates').update(payload).eq('id', id);
  } else {
    await supabase.from('message_templates').insert(payload);
  }
  revalidatePath('/broadcast');
}

export async function deleteTemplate(id: string) {
  const supabase = createClient();
  await supabase.from('message_templates').delete().eq('id', id);
  revalidatePath('/broadcast');
}

export async function createBroadcast(name: string, messageContent: string, templateId: string | null, customerIds: string[]) {
  const supabase = createClient();
  if (!name.trim()) throw new Error('Nama broadcast wajib diisi.');
  if (customerIds.length === 0) throw new Error('Pilih minimal 1 customer.');

  const { data: { user } } = await supabase.auth.getUser();
  const { data: customers } = await supabase.from('customers').select('*').in('id', customerIds);

  const { data: campaign, error } = await supabase.from('broadcast_campaigns').insert({
    name, template_id: templateId, message_snapshot: messageContent, created_by: user?.id || null,
  }).select('id').single();
  if (error) throw new Error(error.message);

  const targets = (customers || []).map((c: any) => ({
    campaign_id: campaign.id, customer_id: c.id, personalized_message: renderTemplate(messageContent, c), status: 'Belum Dikirim',
  }));
  if (targets.length > 0) await supabase.from('broadcast_targets').insert(targets);

  revalidatePath('/broadcast');
  redirect(`/broadcast/${campaign.id}`);
}

export async function setTargetStatus(id: string, campaignId: string, sent: boolean) {
  const supabase = createClient();
  await supabase.from('broadcast_targets').update({
    status: sent ? 'Terkirim' : 'Belum Dikirim',
    sent_at: sent ? new Date().toISOString() : null,
  }).eq('id', id);
  revalidatePath(`/broadcast/${campaignId}`);
  revalidatePath('/broadcast');
}

export async function deleteBroadcastCampaign(id: string) {
  const supabase = createClient();
  await supabase.from('broadcast_campaigns').delete().eq('id', id);
  revalidatePath('/broadcast');
}
