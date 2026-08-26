import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import DocClient from './DocClient';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: order }, { data: items }, { data: companies }, { data: pointValueRow }] = await Promise.all([
    supabase.from('orders').select('*, customers(*)').eq('id', params.id).single(),
    supabase.from('order_items').select('*, products(sku, name, uom)').eq('order_id', params.id),
    supabase.from('company_settings').select('*'),
    supabase.from('app_settings').select('value').eq('key', 'point_value').single(),
  ]);
  if (!order) notFound();

  const companyMap: Record<string, any> = {};
  (companies || []).forEach((c: any) => { companyMap[c.id] = c; });

  return (
    <DocClient
      order={order}
      items={items || []}
      companies={companyMap}
      pointValue={(pointValueRow?.value as number) || 1000}
    />
  );
}
