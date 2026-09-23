'use client';
import { useMemo, useState } from 'react';
import { deleteCustomer } from '@/lib/actions/customers';
import CustomerForm from './CustomerForm';
import CopyOrderLink from './CopyOrderLink';

const TYPES = ['Direct Customer', 'Hotel', 'Restoran', 'Cafe', 'Distributor', 'Reseller'];

export default function CustomersTable({ customers }: { customers: any[] }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [segment, setSegment] = useState('');

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return customers.filter((c) => {
      const matchQ = !ql || [c.name, c.city, c.pic, c.phone].filter(Boolean).some((v: string) => v.toLowerCase().includes(ql));
      const matchType = !type || c.type === type;
      const matchSegment = !segment || c.segment === segment;
      return matchQ && matchType && matchSegment;
    });
  }, [customers, q, type, segment]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / kota / PIC / no. HP..." className="!w-auto min-w-[240px]" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="!w-auto">
          <option value="">Semua Tipe</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={segment} onChange={(e) => setSegment(e.target.value)} className="!w-auto">
          <option value="">Semua Segmen</option>
          <option>Domestik</option><option>Mancanegara</option>
        </select>
        {(q || type || segment) && <button onClick={() => { setQ(''); setType(''); setSegment(''); }} className="btn" style={{ padding: '9px 14px', fontSize: 12 }}>Reset</button>}
        <span className="text-xs text-gray-400 self-center ml-1">{filtered.length} dari {customers.length} customer</span>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nama</th><th>Tipe</th><th>Segmen</th><th>Kota</th><th>PIC</th><th>Termin</th><th>Poin</th><th>PKP</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center text-gray-400 py-10">{customers.length === 0 ? 'Belum ada customer.' : 'Tidak ada customer yang cocok dengan pencarian/filter.'}</td></tr>
              )}
              {filtered.map((c: any) => (
                <tr key={c.id}>
                  <td><b>{c.name}</b>{c.notes && <div className="text-[11px] text-gray-400">{c.notes}</div>}</td>
                  <td>{c.type}</td><td>{c.segment}</td><td>{c.city || '-'}</td><td>{c.pic || '-'}</td>
                  <td><span className="badge bg-blue-50 text-blue-800">{c.pay_term}</span></td>
                  <td>{c.type === 'Reseller' ? <span className="badge bg-goldsoft text-golddeep">{c.points || 0} pts</span> : <span className="text-gray-400">—</span>}</td>
                  <td>{c.pkp ? <span className="badge bg-green-50 text-green-700">PKP</span> : <span className="badge bg-gray-100 text-gray-600">Non-PKP</span>}</td>
                  <td className="whitespace-nowrap">
                    <CustomerForm mode="edit" customer={c} />
                    {c.order_token && <CopyOrderLink token={c.order_token} />}
                    <form action={deleteCustomer.bind(null, c.id)} className="inline">
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
