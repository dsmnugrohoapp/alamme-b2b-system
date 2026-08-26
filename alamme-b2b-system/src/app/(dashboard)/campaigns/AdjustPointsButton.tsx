'use client';
import { adjustCustomerPoints } from '@/lib/actions/customers';

export default function AdjustPointsButton({ customerId, currentPoints }: { customerId: string; currentPoints: number }) {
  async function handle() {
    const val = prompt(`Saldo saat ini: ${currentPoints} poin\nMasukkan jumlah poin (minus untuk penukaran, misal -50):`, '0');
    if (val === null) return;
    const delta = parseFloat(val) || 0;
    if (delta === 0) return;
    await adjustCustomerPoints(customerId, delta, 'Penyesuaian manual');
  }
  return <button onClick={handle} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Sesuaikan</button>;
}
