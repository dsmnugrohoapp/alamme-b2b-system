'use client';
import { useState, useTransition } from 'react';
import { deleteOrder } from '@/lib/actions/orders';

export default function DeleteOrderButton({ id, orderNo }: { id: string; orderNo: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Hapus order ${orderNo}? Tindakan ini tidak bisa dibatalkan.`)) return;
    startTransition(async () => {
      try {
        await deleteOrder(id);
      } catch (e: any) {
        alert(e.message || 'Gagal menghapus order.');
      }
    });
  }

  return (
    <button onClick={handleClick} disabled={pending} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}>
      {pending ? 'Menghapus...' : 'Hapus'}
    </button>
  );
}
