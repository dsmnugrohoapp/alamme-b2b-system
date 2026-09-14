import { createClient } from '@/lib/supabase/server';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createClient();
  const [{ data: companies }, { data: pointValueRow }, { data: publicOrderCompanyRow }] = await Promise.all([
    supabase.from('company_settings').select('*'),
    supabase.from('app_settings').select('value').eq('key', 'point_value').single(),
    supabase.from('app_settings').select('value').eq('key', 'public_order_company').single(),
  ]);
  const companyMap: Record<string, any> = {};
  (companies || []).forEach((c: any) => { companyMap[c.id] = c; });

  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Konfigurasi</div>
        <h1 className="font-serif text-2xl font-semibold">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kop surat, rekening bank, dan nilai tukar poin — muncul otomatis di invoice/quotation.</p>
      </div>
      <SettingsForm
        companies={companyMap}
        pointValue={(pointValueRow?.value as number) || 1000}
        publicOrderCompany={(publicOrderCompanyRow?.value as string) || 'sda'}
      />
    </div>
  );
}
