import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import CampaignDetailClient from './CampaignDetailClient';

export const dynamic = 'force-dynamic';

export default async function BroadcastDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: campaign } = await supabase.from('broadcast_campaigns').select('*').eq('id', params.id).single();
  if (!campaign) notFound();

  const { data: targets } = await supabase.from('broadcast_targets').select('*').eq('campaign_id', params.id);

  // Pola join dua tahap yang aman: fetch target rows dulu, lalu fetch customer terkait via .in()
  const customerIds = Array.from(new Set((targets || []).map((t: any) => t.customer_id).filter(Boolean)));
  let customerMap: Record<string, any> = {};
  if (customerIds.length > 0) {
    const { data: customers } = await supabase.from('customers').select('id, name, type, city, phone').in('id', customerIds);
    (customers || []).forEach((c: any) => { customerMap[c.id] = c; });
  }

  const enrichedTargets = (targets || []).map((t: any) => ({ ...t, customer: customerMap[t.customer_id] }));

  return <CampaignDetailClient campaign={campaign} targets={enrichedTargets} />;
}
