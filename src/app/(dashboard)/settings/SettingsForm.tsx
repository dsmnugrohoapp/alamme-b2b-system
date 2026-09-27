'use client';
import { useState } from 'react';
import { saveCompanySettings, savePointValue, savePublicOrderCompany } from '@/lib/actions/settings';

const COMPANIES = [
  { id: 'sda', label: 'PT Semua Dari Alam' },
  { id: 'mba', label: 'PT Maju Bersama Alam' },
  { id: 'plain', label: 'Tanpa Kop Surat / Plain' },
];

export default function SettingsForm({ companies, pointValue, publicOrderCompany }: { companies: Record<string, any>; pointValue: number; publicOrderCompany: string }) {
  const [pv, setPv] = useState(pointValue);
  const [publicCompany, setPublicCompany] = useState(publicOrderCompany);
  const [banks, setBanks] = useState<Record<string, any[]>>(() => {
    const init: Record<string, any[]> = {};
    COMPANIES.forEach((c) => { init[c.id] = companies[c.id]?.bank_accounts || []; });
    return init;
  });

  function addBank(companyId: string) {
    setBanks({ ...banks, [companyId]: [...(banks[companyId] || []), { bank: '', accountNo: '', holder: '', type: 'Giro' }] });
  }
  function updateBank(companyId: string, idx: number, field: string, value: string) {
    const list = [...(banks[companyId] || [])];
    list[idx] = { ...list[idx], [field]: value };
    setBanks({ ...banks, [companyId]: list });
  }
  function removeBank(companyId: string, idx: number) {
    setBanks({ ...banks, [companyId]: (banks[companyId] || []).filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card">
        <h3 className="font-serif font-semibold mb-3">Nilai Tukar Poin &amp; Kop Surat Order Mandiri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="field mb-0">
            <label>1 Poin setara Rp</label>
            <div className="flex gap-2">
              <input type="number" value={pv} onChange={(e) => setPv(parseFloat(e.target.value) || 0)} />
              <button onClick={() => savePointValue(pv)} className="btn btn-primary whitespace-nowrap">Simpan</button>
            </div>
          </div>
          <div className="field mb-0">
            <label>Kop Surat untuk Link Order Mandiri Customer</label>
            <div className="flex gap-2">
              <select value={publicCompany} onChange={(e) => setPublicCompany(e.target.value)}>
                {COMPANIES.filter((c) => c.id !== 'plain').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <button onClick={() => savePublicOrderCompany(publicCompany)} className="btn btn-primary whitespace-nowrap">Simpan</button>
            </div>
          </div>
        </div>
      </div>

      {COMPANIES.map((company) => {
        const c = companies[company.id] || {};
        return (
          <div key={company.id} className="card">
            <h3 className="font-serif font-semibold mb-3">{company.label}</h3>
            <form action={async (fd) => {
              const data = {
                name: (fd.get('name') as string) || '',
                address: (fd.get('address') as string) || '',
                city: (fd.get('city') as string) || '',
                phone: (fd.get('phone') as string) || '',
                email: (fd.get('email') as string) || '',
                npwp: (fd.get('npwp') as string) || '',
                bank_accounts: banks[company.id] || [],
              };
              await saveCompanySettings(company.id, data);
            }}>
              {company.id !== 'plain' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="field mb-0"><label>Nama Perusahaan</label><input name="name" defaultValue={c.name || company.label} /></div>
                    <div className="field mb-0"><label>Kota</label><input name="city" defaultValue={c.city} /></div>
                  </div>
                  <div className="field mb-3"><label>Alamat</label><textarea name="address" rows={2} defaultValue={c.address} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="field mb-0"><label>Telepon</label><input name="phone" defaultValue={c.phone} /></div>
                    <div className="field mb-0"><label>Email</label><input name="email" defaultValue={c.email} /></div>
                    <div className="field mb-0"><label>NPWP</label><input name="npwp" defaultValue={c.npwp} /></div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Rekening Bank</label>
                    {(banks[company.id] || []).map((b, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_100px_28px] gap-2 mb-2">
                        <input placeholder="Nama Bank" value={b.bank} onChange={(e) => updateBank(company.id, idx, 'bank', e.target.value)} />
                        <input placeholder="No. Rekening" value={b.accountNo} onChange={(e) => updateBank(company.id, idx, 'accountNo', e.target.value)} />
                        <input placeholder="Atas Nama" value={b.holder} onChange={(e) => updateBank(company.id, idx, 'holder', e.target.value)} />
                        <select value={b.type} onChange={(e) => updateBank(company.id, idx, 'type', e.target.value)}><option>Giro</option><option>Tabungan</option></select>
                        <button type="button" onClick={() => removeBank(company.id, idx)} className="text-red-600">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addBank(company.id)} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>+ Tambah Rekening</button>
                  </div>
                </>
              )}
              {company.id === 'plain' && <p className="text-xs text-gray-500 mb-3">Opsi ini mencetak dokumen tanpa kop surat perusahaan (polos).</p>}
              <div className="text-right"><button type="submit" className="btn btn-primary">Simpan {company.label}</button></div>
            </form>
          </div>
        );
      })}
    </div>
  );
}
