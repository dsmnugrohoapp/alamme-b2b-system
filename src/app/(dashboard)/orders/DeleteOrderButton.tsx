'use client';
import { useState, useTransition } from 'react';
import { deleteOrder, rejectDeleteRequest } from '@/lib/actions/orders';

const FINANCE_ROLES = ['admin', 'finance'];

export default function DeleteOrderButton({
  id, orderNo, currentRole, deleteRequested, requestedByName, requestNote,
}: {
  id: string; orderNo: string; currentRole: string;
  deleteRequested?: boolean; requestedByName?: string | null; requestNote?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const isFinance = FINANCE_ROLES.includes(currentRole);

  function handleDeleteClick() {
    if (deleteRequested && isFinance) {
      // Finance menyetujui permintaan yang sudah ada
      if (!confirm(`Setujui & hapus order ${orderNo}? Tindakan ini tidak bisa dibatalkan.`)) return;
      startTransition(async () => {
        try { await deleteOrder(id); } catch (e: any) { alert(e.message || 'Gagal menghapus order.'); }
      });
      return;
    }
    if (isFinance) {
      if (!confirm(`Hapus order ${orderNo}? Tindakan ini tidak bisa dibatalkan.`)) return;
      startTransition(async () => {
        try { await deleteOrder(id); } catch (e: any) { alert(e.message || 'Gagal menghapus order.'); }
      });
      return;
    }
    // Staff biasa -> kirim permintaan approval ke Finance
    const note = prompt('Alasan hapus order ini (opsional, akan dilihat Finance):', '') || '';
    startTransition(async () => {
      try {
        const res = await deleteOrder(id, note);
        if (!res.approved) alert('Permintaan hapus terkirim. Menunggu approval dari Admin/Finance.');
      } catch (e: any) {
        alert(e.message || 'Gagal mengirim permintaan hapus.');
      }
    });
  }

  function handleReject() {
    if (!confirm('Tolak permintaan hapus ini?')) return;
    startTransition(async () => {
      try { await rejectDeleteRequest(id); } catch (e: any) { alert(e.message || 'Gagal menolak permintaan.'); }
    });
  }

  if (deleteRequested && !isFinance) {
    return (
      <span className="badge bg-amber-50 text-amber-700" title={requestNote ? `Alasan: ${requestNote}` : ''}>
        Menunggu Approval Hapus
      </span>
    );
  }

  if (deleteRequested && isFinance) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="badge bg-amber-50 text-amber-700" title={`Diminta oleh: ${requestedByName || '-'}${requestNote ? ' — ' + requestNote : ''}`}>
          Perlu Approval
        </span>
        <button onClick={handleDeleteClick} disabled={pending} className="btn btn-gold" style={{ padding: '5px 10px', fontSize: 12 }}>
          {pending ? '...' : 'Setujui & Hapus'}
        </button>
        <button onClick={handleReject} disabled={pending} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Tolak</button>
      </span>
    );
  }

  return (
    <button onClick={handleDeleteClick} disabled={pending} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}>
      {pending ? 'Memproses...' : 'Hapus'}
    </button>
  );
}
