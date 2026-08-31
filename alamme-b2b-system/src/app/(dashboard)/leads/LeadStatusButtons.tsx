'use client';
import { updateLeadStatus } from '@/lib/actions/leads';

export default function LeadStatusButtons({ id, status }: { id: string; status: string }) {
  return (
    <>
      {status !== 'Deal' && (
        <form action={updateLeadStatus.bind(null, id, 'Deal')} className="inline">
          <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Tandai Deal</button>
        </form>
      )}
      {status === 'Baru' && (
        <form action={updateLeadStatus.bind(null, id, 'Proses Follow-up')} className="inline">
          <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Mulai Follow-up</button>
        </form>
      )}
      {!['Deal', 'Gagal/Batal'].includes(status) && (
        <form action={updateLeadStatus.bind(null, id, 'Gagal/Batal')} className="inline">
          <button className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Tandai Gagal</button>
        </form>
      )}
    </>
  );
}
