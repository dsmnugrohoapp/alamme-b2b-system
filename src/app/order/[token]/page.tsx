import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import OrderPublicForm from './OrderPublicForm';

export const dynamic = 'force-dynamic';

export default async function PublicOrderPage({ params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const { data: customer } = await supabase.from('customers').select('*').eq('order_token', params.token).single();
  if (!customer) notFound();

  const [{ data: products }, { data: publicCompanyRow }, { data: companies }] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    supabase.from('app_settings').select('value').eq('key', 'public_order_company').single(),
    supabase.from('company_settings').select('*'),
  ]);
  const companyId = (publicCompanyRow?.value as string) || 'sda';
  const company = (companies || []).find((c: any) => c.id === companyId) || {};

  return <OrderPublicForm token={params.token} customer={customer} products={products || []} company={company} />;
}
