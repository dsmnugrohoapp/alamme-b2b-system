import { createClient } from '@/lib/supabase/server';
import NewBroadcastClient from './NewBroadcastClient';

export const dynamic = 'force-dynamic';

export default async function NewBroadcastPage() {
  const supabase = createClient();
  const [{ data: customers }, { data: templates }] = await Promise.all([
    supabase.from('customers').select('*').order('name'),
    supabase.from('message_templates').select('*').order('name'),
  ]);

  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">CRM</div>
        <h1 className="font-serif text-2xl font-semibold">Buat Broadcast Baru</h1>
        <p className="text-sm text-gray-500 mt-1">Pilih script pesan, pilih target customer, lalu kirim personal satu-satu lewat WhatsApp.</p>
      </div>
      <NewBroadcastClient customers={customers || []} templates={templates || []} />
    </div>
  );
}
