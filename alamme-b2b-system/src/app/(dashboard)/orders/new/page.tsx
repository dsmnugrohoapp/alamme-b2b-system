import { createClient } from '@/lib/supabase/server';
import OrderForm from '../OrderForm';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage({ searchParams }: { searchParams: { leadId?: string } }) {
  const supabase = createClient();
  const [{ data: products }, { data: customers }, { data: campaigns }, { data: pointValueRow }] = await Promise.all([
    supabase.from('products').select('id, sku, name, uom, price').order('name'),
    supabase.from('customers').select('id, name, type, city, pay_term, pkp, phone, pic').order('name'),
    supabase.from('campaigns').select('*'),
    supabase.from('app_settings').select('value').eq('key', 'point_value').single(),
  ]);
  const pointValue = (pointValueRow?.value as number) || 1000;

  let prefillCustomerId: string | undefined;
  let prefillItems: any[] | undefined;
  const leadId = searchParams?.leadId;

  if (leadId) {
    const [{ data: lead }, { data: leadItems }] = await Promise.all([
      supabase.from('leads').select('customer_id').eq('id', leadId).single(),
      supabase.from('lead_items').select('product_id, usual_price, qty_per_frequency').eq('lead_id', leadId),
    ]);
    if (lead) {
      prefillCustomerId = lead.customer_id;
      prefillItems = (leadItems || []).map((it: any) => ({
        productId: it.product_id, qty: Number(it.qty_per_frequency) || 1, unitPrice: Number(it.usual_price) || 0,
        discountType: 'percent', discountValue: 0,
      }));
    }
  }

  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Transaksi</div>
        <h1 className="font-serif text-2xl font-semibold">Order Baru</h1>
      </div>
      <div className="card max-w-4xl">
        <OrderForm
          products={products || []} customers={customers || []} campaigns={(campaigns as any) || []} pointValue={pointValue}
          prefillCustomerId={prefillCustomerId} prefillItems={prefillItems} leadId={leadId}
        />
      </div>
    </div>
  );
}
