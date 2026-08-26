'use client';
import { useState } from 'react';
import { saveCompanySettings, savePointValue } from '@/lib/actions/settings';

type BankAccount = { bank: string; accountNo: string; holder: string; type: string };

function CompanyCard({ id, title, initial, isPlain }: { id: string; title: string; initial: any; isPlain?: boolean }) {
  const [name, setName] = useState(initial?.name || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [city, setCity] = useState(initial?.city || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [npwp, setNpwp] = useState(initial?.npwp || '');
  const [accounts, setAccounts] = useState<BankAccount[]>(initial?.bank_accounts || []);
  const [saved, setSaved] = useState(false);

  function updateAccount(idx: number, field: keyof BankAccount, value: string) {
    const next = [...accounts];
    next[idx] = { ...next[idx], [field]: value };
    setAccounts(next);
  }
  function addAccount() { setAccounts([...accounts, { bank: '', accountNo: '', holder: '', type: 'Perusahaan' }]); }
  function removeAccount(idx: number) { setAccounts(accounts.filter((_, i) => i !== idx)); }

  async function save() {
    await saveCompanySettings(id, { name, address, city, phone, email, npwp, bank_accounts: accounts.filter((a) => a.bank || a.accountNo) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="card">
      <h3 className="font-serif font-semibold mb-3">{title}</h3>
      <div className="space-y-3">
        {isPlain && <div className="field"><label>Nama (opsional untuk dokumen tanpa kop)</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>}
        <div className="field"><label>Alamat Lengkap</label><input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        <div className="field"><label>Kota</label><input value={city} onChange={(e) => setCity(e.target.value)} /></div>
        <div className="field"><label>Telepon</label><input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="field"><label>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>NPWP</label><input value={npwp} onChange={(e) => setNpwp(e.target.value)} /></div>
        <div className="field">
          <label>Rekening Bank (Perusahaan / Pribadi)</label>
          <div className="space-y-1.5">
            {accounts.map((a, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-1.5">
                <input placeholder="Bank" value={a.bank} onChange={(e) => updateAccount(idx, 'bank', e.target.value)} className="!text-xs !py-1.5" />
                <input placeholder="No. Rekening" value={a.accountNo} onChange={(e) => updateAccount(idx, 'accountNo', e.target.value)} className="!text-xs !py-1.5" />
                <input placeholder="Atas Nama" value={a.holder} onChange={(e) => updateAccount(idx, 'holder', e.target.value)} className="!text-xs !py-1.5" />
                <div className="flex gap-1">
                  <select value={a.type} onChange={(e) => updateAccount(idx, 'type', e.target.value)} className="!text-xs !py-1.5"><option>Perusahaan</option><option>Pribadi</option></select>
                  <button type="button" onClick={() => removeAccount(idx)} className="text-red-600 text-sm px-2">✕</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addAccount} className="btn mt-2" style={{ padding: '5px 10px', fontSize: 12 }}>+ Tambah Rekening</button>
        </div>
        <button onClick={save} className="btn btn-primary">{saved ? 'Tersimpan ✓' : 'Simpan'}</button>
      </div>
    </div>
  );
}

export default function SettingsForm({ companies, pointValue: initialPointValue }: { companies: Record<string, any>; pointValue: number }) {
  const [pointValue, setPointValue] = useState(initialPointValue);
  const [savedPv, setSavedPv] = useState(false);

  async function savePv() {
    await savePointValue(pointValue);
    setSavedPv(true);
    setTimeout(() => setSavedPv(false), 2000);
  }

  return (
    <div>
      <div className="field max-w-xs mb-5">
        <label>Nilai Tukar Poin (Rp per 1 Poin)</label>
        <div className="flex gap-2">
          <input type="number" value={pointValue} onChange={(e) => setPointValue(parseFloat(e.target.value) || 0)} />
          <button onClick={savePv} className="btn btn-primary whitespace-nowrap">{savedPv ? '✓' : 'Simpan'}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CompanyCard id="sda" title="PT Semua Dari Alam" initial={companies.sda} />
        <CompanyCard id="mba" title="PT Maju Bersama Alam" initial={companies.mba} />
        <CompanyCard id="plain" title="Tanpa Kop Surat / Plain" initial={companies.plain} isPlain />
      </div>
    </div>
  );
}
