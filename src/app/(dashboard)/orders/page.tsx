import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import OrdersTable from './OrdersTable';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let currentRole = 'staff';
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    currentRole = profile?.role || 'staff';
  }

  const { data: ordersRaw } = await supabase.from('orders').select('*, customers(name)').order('order_date', { ascending: false });
  const rows = ordersRaw || [];

  // Ambil nama PIC (pembuat order) & nama peminta hapus dengan cara aman (bukan embed by-constraint-name yang rapuh)
  const profileIds = Array.from(new Set(rows.flatMap((o: any) => [o.created_by, o.delete_requested_by]).filter(Boolean)));
  let profileMap: Record<string, string> = {};
  if (profileIds.length > 0) {
    const { data: profs } = await supabase.from('profiles').select('id, name').in('id', profileIds);
    (profs || []).forEach((p: any) => { profileMap[p.id] = p.name; });
  }
  const orders = rows.map((o: any) => ({
    ...o,
    created_by_name: o.created_by ? profileMap[o.created_by] : null,
    delete_requested_by_name: o.delete_requested_by ? profileMap[o.delete_requested_by] : null,
  }));

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
      <OrdersTable orders={orders} currentRole={currentRole} />
    </div>
  );
}
