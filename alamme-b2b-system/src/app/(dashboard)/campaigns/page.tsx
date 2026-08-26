import { createClient } from '@/lib/supabase/server';
import { deleteCampaign, toggleCampaignActive } from '@/lib/actions/campaigns';
import { adjustCustomerPoints } from '@/lib/actions/customers';
import CampaignForm from './CampaignForm';
import { rp } from '@/lib/utils';
import AdjustPointsButton from './AdjustPointsButton';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const supabase = createClient();
  const [{ data: campaigns }, { data: resellers }, { data: products }, { data: pointValueRow }] = await Promise.all([
    supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
    supabase.from('customers').select('id, name, points').eq('type', 'Reseller').order('name'),
    supabase.from('products').select('id, sku, name'),
    supabase.from('app_settings').select('value').eq('key', 'point_value').single(),
  ]);
  const pointValue = (pointValueRow?.value as number) || 1000;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Loyalty Program</div>
          <h1 className="font-serif text-2xl font-semibold">Campaign &amp; Poin Reseller</h1>
          <p className="text-sm text-gray-500 mt-1">Aturan poin dari nilai transaksi atau produk spesial — otomatis terhubung ke order &amp; invoice.</p>
        </div>
        <CampaignForm mode="create" products={products || []} />
      </div>

      <div className="card mb-4">
        <table>
          <thead><tr><th>Campaign</th><th>Tipe</th><th>Aturan</th><th>Berlaku Untuk</th><th>Periode</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(!campaigns || campaigns.length === 0) && <tr><td colSpan={7} className="text-center text-gray-400 py-10">Belum ada campaign poin.</td></tr>}
            {(campaigns || []).map((c: any) => (
              <tr key={c.id}>
                <td><b>{c.name}</b>{c.notes && <div className="text-[11px] text-gray-400">{c.notes}</div>}</td>
                <td>{c.type === 'revenue' ? 'Nilai Transaksi' : 'Produk Spesial'}</td>
                <td>{c.type === 'revenue' ? `1 poin / ${rp(c.rp_per_point)}` : `${c.points_per_unit} poin/unit (${(c.product_ids || []).length} SKU)`}</td>
                <td>{(c.customer_types || []).join(', ')}</td>
                <td>{c.start_date || '-'} s.d {c.end_date || '∞'}</td>
                <td>{c.active ? <span className="badge bg-green-50 text-green-700">Aktif</span> : <span className="badge bg-gray-100 text-gray-600">Nonaktif</span>}</td>
                <td className="whitespace-nowrap">
                  <CampaignForm mode="edit" campaign={c} products={products || []} />
                  <form action={toggleCampaignActive.bind(null, c.id, !c.active)} className="inline">
                    <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>{c.active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                  </form>
                  <form action={deleteCampaign.bind(null, c.id)} className="inline">
                    <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}>Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-serif font-semibold">Saldo Poin Reseller</h3>
          <span className="text-xs text-gray-500">Nilai tukar: <b>{rp(pointValue)}</b> / poin</span>
        </div>
        <table>
          <thead><tr><th>Reseller</th><th>Saldo Poin</th><th>Setara Nilai</th><th></th></tr></thead>
          <tbody>
            {(!resellers || resellers.length === 0) && <tr><td colSpan={4} className="text-center text-gray-400 py-8">Belum ada customer Reseller.</td></tr>}
            {(resellers || []).map((c: any) => (
              <tr key={c.id}>
                <td>{c.name}</td><td><span className="badge bg-goldsoft text-golddeep">{c.points || 0} pts</span></td>
                <td>{rp((c.points || 0) * pointValue)}</td>
                <td><AdjustPointsButton customerId={c.id} currentPoints={c.points || 0} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
