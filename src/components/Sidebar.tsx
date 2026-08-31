'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/', label: 'Dashboard', icon: '◆' },
  { href: '/leads', label: 'Leads Management', icon: '◎' },
  { href: '/customers', label: 'Customer', icon: '◈' },
  { href: '/products', label: 'Produk / SKU', icon: '◇' },
  { href: '/orders', label: 'Order & Kalkulator', icon: '▤' },
  { href: '/campaigns', label: 'Campaign & Poin', icon: '★' },
  { href: '/fulfillment', label: 'Fulfillment', icon: '▣' },
  { href: '/reports', label: 'Laporan', icon: '⤓' },
  { href: '/settings', label: 'Pengaturan', icon: '⚙' },
];

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <div className="md:hidden flex items-center justify-between bg-ink text-white px-4 py-3 sticky top-0 z-40">
        <span className="font-serif text-lg font-bold text-goldsoft">Alamme</span>
        <button onClick={() => setOpen(!open)} className="border border-white/30 rounded px-3 py-1 text-sm">☰ Menu</button>
      </div>
      {open && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />}
      <aside className={`bg-ink text-[#EDE7D9] w-[230px] flex-shrink-0 flex flex-col p-4 fixed md:sticky top-0 h-screen z-50 transition-transform
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-2 pb-5 border-b border-white/10 mb-4">
          <div className="font-serif text-xl font-bold text-goldsoft">Alamme</div>
          <div className="text-[10px] uppercase tracking-wide text-[#A9A28C] mt-1">B2B &amp; Reseller System</div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition
                ${pathname === item.href ? 'bg-gold text-ink font-bold' : 'text-[#CFC8B4] hover:bg-gold/10 hover:text-white'}`}
            >
              <span className="w-4 text-center">{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-white/10 text-xs text-[#8A836F]">
          <div className="mb-2 truncate">{userEmail}</div>
          <button onClick={signOut} className="text-goldsoft hover:underline">Keluar</button>
        </div>
      </aside>
    </>
  );
}
