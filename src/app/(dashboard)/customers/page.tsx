import { createClient } from '@/lib/supabase/server';
import { deleteCustomer } from '@/lib/actions/customers';
import CustomerForm from './CustomerForm';
import ImportButton from './ImportButton';

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

      <div className="card">
        <table>
          <thead>
            <tr><th>Nama</th><th>Tipe</th><th>Segmen</th><th>Kota</th><th>PIC</th><th>Termin</th><th>Poin</th><th>PKP</th><th></th></tr>
          </thead>
          <tbody>
            {(!customers || customers.length === 0) && (
              <tr><td colSpan={9} className="text-center text-gray-400 py-10">Belum ada customer.</td></tr>
            )}
            {(customers || []).map((c: any) => (
              <tr key={c.id}>
                <td><b>{c.name}</b>{c.notes && <div className="text-[11px] text-gray-400">{c.notes}</div>}</td>
                <td>{c.type}</td><td>{c.segment}</td><td>{c.city || '-'}</td><td>{c.pic || '-'}</td>
                <td><span className="badge bg-blue-50 text-blue-800">{c.pay_term}</span></td>
                <td>{c.type === 'Reseller' ? <span className="badge bg-goldsoft text-golddeep">{c.points || 0} pts</span> : <span className="text-gray-400">—</span>}</td>
                <td>{c.pkp ? <span className="badge bg-green-50 text-green-700">PKP</span> : <span className="badge bg-gray-100 text-gray-600">Non-PKP</span>}</td>
                <td className="whitespace-nowrap">
                  <CustomerForm mode="edit" customer={c} />
                  <form action={deleteCustomer.bind(null, c.id)} className="inline">
                    <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}>Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
