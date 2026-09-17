import { createAdminClient } from '@/lib/supabase/admin';
import OrderPublicForm from './OrderPublicForm';

export const dynamic = 'force-dynamic';

export default async function CustomerOrderPage({ params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, type, margin, pay_term, pkp, city')
    .eq('order_token', params.token)
    .single();

  if (!customer) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-sm text-center">
          <div className="font-serif text-xl font-bold mb-2">Link Tidak Valid</div>
          <p className="text-sm text-gray-500">Link order ini sudah tidak berlaku atau salah ketik. Hubungi tim Alamme untuk mendapatkan link yang benar.</p>
        </div>
      </div>
    );
  }

  const [{ data: products }, { data: companyRow }] = await Promise.all([
    supabase.from('products').select('id, sku, name, uom, price, commercial_name, image_url, description, variant_group, variant_label').order('name'),
    supabase.from('app_settings').select('value').eq('key', 'public_order_company').single(),
  ]);
  const companyId = (companyRow?.value as string) || 'sda';
  const { data: company } = await supabase.from('company_settings').select('*').eq('id', companyId).single();

  return <OrderPublicForm token={params.token} customer={customer} products={products || []} company={company} />;
}
