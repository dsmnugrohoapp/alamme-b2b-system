import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import TemplateForm from './TemplateForm';
import { deleteTemplate, deleteBroadcastCampaign } from '@/lib/actions/broadcast';

export const dynamic = 'force-dynamic';

export default async function BroadcastPage() {
  const supabase = createClient();
  const [{ data: templates }, { data: campaignsRaw }] = await Promise.all([
    supabase.from('message_templates').select('*').order('created_at', { ascending: false }),
    supabase.from('broadcast_campaigns').select('*, broadcast_targets(id, status)').order('created_at', { ascending: false }),
  ]);

  const campaigns = (campaignsRaw || []).map((c: any) => {
    const targets = c.broadcast_targets || [];
    const sent = targets.filter((t: any) => t.status === 'Terkirim').length;
    return { ...c, total: targets.length, sent };
  });

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">CRM</div>
          <h1 className="font-serif text-2xl font-semibold">Broadcast WhatsApp</h1>
          <p className="text-sm text-gray-500 mt-1">Script pesan siap pakai + kirim personal ke banyak customer, satu klik per orang.</p>
        </div>
        <Link href="/broadcast/new" className="btn btn-primary">+ Buat Broadcast Baru</Link>
      </div>

      <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs rounded-lg px-4 py-3 mb-5">
        💡 WhatsApp tidak mengizinkan kirim otomatis massal tanpa WhatsApp Business API resmi (berbayar &amp; butuh approval terpisah). Fitur ini menyiapkan pesan personal untuk tiap customer — Anda tinggal klik <b>Buka WhatsApp</b> lalu tekan kirim, satu per satu, jauh lebih cepat dari copy-paste manual.
      </div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="font-serif text-lg font-semibold">Script Pesan</h2>
        <TemplateForm mode="create" />
      </div>
      <div className="card mb-6">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama Script</th><th>Kategori</th><th>Isi Pesan</th><th></th></tr></thead>
            <tbody>
              {(!templates || templates.length === 0) && <tr><td colSpan={4} className="text-center text-gray-400 py-8">Belum ada script pesan.</td></tr>}
              {(templates || []).map((t: any) => (
                <tr key={t.id}>
                  <td><b>{t.name}</b></td>
                  <td><span className="badge bg-goldsoft text-golddeep">{t.category}</span></td>
                  <td className="text-xs max-w-[320px] truncate">{t.content}</td>
                  <td className="whitespace-nowrap">
                    <TemplateForm mode="edit" template={t} />
                    <form action={deleteTemplate.bind(null, t.id)} className="inline">
                      <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}>Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="font-serif text-lg font-semibold mb-3">Riwayat Broadcast</h2>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama Broadcast</th><th>Target</th><th>Progress</th><th>Tanggal</th><th></th></tr></thead>
            <tbody>
              {campaigns.length === 0 && <tr><td colSpan={5} className="text-center text-gray-400 py-8">Belum ada broadcast yang dibuat.</td></tr>}
              {campaigns.map((c: any) => (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td>{c.total} customer</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gold" style={{ width: `${c.total ? (c.sent / c.total) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{c.sent}/{c.total}</span>
                    </div>
                  </td>
                  <td className="text-xs">{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="whitespace-nowrap">
                    <Link href={`/broadcast/${c.id}`} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Buka</Link>
                    <form action={deleteBroadcastCampaign.bind(null, c.id)} className="inline">
                      <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}>Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
