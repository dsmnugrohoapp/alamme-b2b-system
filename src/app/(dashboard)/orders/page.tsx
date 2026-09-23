import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import OrdersTable from './OrdersTable';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: orders } = await supabase.from('orders').select('*, customers(name)').order('order_date', { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-3 mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Transaksi</div>
          <h1 className="font-serif text-2xl font-semibold">Order &amp; Kalkulator</h1>
          <p className="text-sm text-gray-500 mt-1">Input PO, hitung diskon, ongkir, PPN, dan poin reseller otomatis.</p>
        </div>
        <Link href="/orders/new" className="btn btn-primary">+ Order Baru</Link>
      </div>
      <OrdersTable orders={orders || []} />
    </div>
  );
}
