import { createClient } from '@/lib/supabase/server';
import LeadForm from './LeadForm';
import LeadsTable from './LeadsTable';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const supabase = createClient();
  const [{ data: leads }, { data: customers }, { data: products }] = await Promise.all([
    supabase.from('leads').select('*, customers(name, type, city, phone), lead_items(*, products(name, uom))').order('created_at', { ascending: false }),
    supabase.from('customers').select('id, name, type, city').order('name'),
    supabase.from('products').select('id, sku, name, uom, price').order('name'),
  ]);

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Sales Pipeline</div>
          <h1 className="font-serif text-2xl font-semibold">Leads Management</h1>
          <p className="text-sm text-gray-500 mt-1">Prospek Hotel/Restoran/Cafe/Distributor/Reseller yang belum atau baru akan closing.</p>
        </div>
        <LeadForm mode="create" customers={customers || []} products={products || []} />
      </div>
      <LeadsTable leads={leads || []} customers={customers || []} products={products || []} />
    </div>
  );
}
