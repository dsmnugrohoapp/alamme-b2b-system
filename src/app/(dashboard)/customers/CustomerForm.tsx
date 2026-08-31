'use client';
import { useState } from 'react';
import { upsertCustomer } from '@/lib/actions/customers';
import WilayahSelect from '@/components/WilayahSelect';

export default function CustomerForm({ mode, customer }: { mode: 'create' | 'edit'; customer?: any }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className={mode === 'create' ? 'btn btn-primary' : 'btn'} style={mode === 'edit' ? { padding: '5px 10px', fontSize: 12 } : {}}>
        {mode === 'create' ? '+ Tambah Customer' : 'Edit'}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-semibold">{mode === 'create' ? 'Tambah Customer' : 'Edit Customer'}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form action={async (fd) => { await upsertCustomer(fd); setOpen(false); }}>
              <input type="hidden" name="id" defaultValue={customer?.id || ''} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="field"><label>Nama Customer</label><input name="name" defaultValue={customer?.name} required /></div>
                <div className="field"><label>Tipe</label>
                  <select name="type" defaultValue={customer?.type || 'Hotel'}>
                    <option>Direct Customer</option><option>Hotel</option><option>Restoran</option><option>Cafe</option><option>Distributor</option><option>Reseller</option>
                  </select>
                </div>
                <div className="field"><label>Segmen</label>
                  <select name="segment" defaultValue={customer?.segment || 'Domestik'}><option>Domestik</option><option>Mancanegara</option></select>
                </div>
                <div className="field"><label>PIC</label><input name="pic" defaultValue={customer?.pic} /></div>
              </div>
              <fieldset className="border border-dashed border-gray-300 rounded-lg p-3 mb-3">
                <legend className="text-[11px] font-bold uppercase text-golddeep px-1">Alamat</legend>
                <WilayahSelect
                  defaultProvinceId={customer?.province_id} defaultCityId={customer?.city_id} defaultDistrictId={customer?.district_id}
                  defaultProvinceName={customer?.province} defaultCityName={customer?.city} defaultDistrictName={customer?.district}
                />
                <div className="field mt-3"><label>Alamat Detail (jalan, no, RT/RW, patokan)</label><textarea name="address_detail" rows={2} defaultValue={customer?.address_detail} /></div>
              </fieldset>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="field"><label>No. WA/Telepon</label><input name="phone" defaultValue={customer?.phone} /></div>
                <div className="field"><label>Email</label><input name="email" defaultValue={customer?.email} /></div>
                <div className="field"><label>Termin Pembayaran</label>
                  <select name="pay_term" defaultValue={customer?.pay_term || 'Cash'}>
                    <option>Cash</option><option>CBD</option><option>COD</option><option>TOP 7</option><option>TOP 14</option><option>TOP 30</option><option>TOP 45</option><option>TOP 60</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="field"><label>Margin Tier Referensi (%)</label><input type="number" step="0.1" name="margin" defaultValue={customer?.margin || 0} /></div>
                <div className="field"><label>Status PKP</label>
                  <select name="pkp" defaultValue={customer?.pkp === false ? '0' : '1'}><option value="1">Ya, PKP</option><option value="0">Tidak/Non-PKP</option></select>
                </div>
              </div>
              <div className="field mb-4"><label>Catatan</label><textarea name="notes" rows={2} defaultValue={customer?.notes} /></div>
              <div className="text-right"><button type="submit" className="btn btn-primary">Simpan Customer</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
