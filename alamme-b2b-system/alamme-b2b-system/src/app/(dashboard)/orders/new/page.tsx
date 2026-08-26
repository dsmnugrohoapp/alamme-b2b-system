import { createClient } from '@/lib/supabase/server';
import OrderForm from '../OrderForm';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  const supabase = createClient();
  const [{ data: products }, { data: customers }, { data: campaigns }, { data: pointValueRow }] = await Promise.all([
    supabase.from('products').select('id, sku, name, uom, price').order('name'),
    supabase.from('customers').select('id, name, type, city, pay_term, pkp, phone, pic').order('name'),
    supabase.from('campaigns').select('*'),
    supabase.from('app_settings').select('value').eq('key', 'point_value').single(),
  ]);
  const pointValue = (pointValueRow?.value as number) || 1000;
  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Transaksi</div>
        <h1 className="font-serif text-2xl font-semibold">Order Baru</h1>
      </div>
      <div className="card max-w-4xl">
        <OrderForm products={products || []} customers={customers || []} campaigns={(campaigns as any) || []} pointValue={pointValue} />
      </div>
    </div>
  );
}
