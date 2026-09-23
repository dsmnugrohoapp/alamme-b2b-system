import { createClient } from '@/lib/supabase/server';
import CustomerForm from './CustomerForm';
import ImportButton from './ImportButton';
import CustomersTable from './CustomersTable';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const supabase = createClient();
  const { data: customers } = await supabase.from('customers').select('*').order('name');

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Database</div>
          <h1 className="font-serif text-2xl font-semibold">Customer</h1>
          <p className="text-sm text-gray-500 mt-1">Hotel, restoran, cafe, distributor, dan reseller — domestik &amp; mancanegara.</p>
        </div>
        <div className="flex gap-2">
          <ImportButton />
          <CustomerForm mode="create" />
        </div>
      </div>
      <CustomersTable customers={customers || []} />
    </div>
  );
}
