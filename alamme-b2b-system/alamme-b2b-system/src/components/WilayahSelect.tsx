'use client';
import { useEffect, useState } from 'react';

type Item = { id: string; name: string };
const BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export default function WilayahSelect({
  defaultProvinceId, defaultCityId, defaultDistrictId,
  defaultProvinceName, defaultCityName, defaultDistrictName,
  namePrefix = '',
}: {
  defaultProvinceId?: string; defaultCityId?: string; defaultDistrictId?: string;
  defaultProvinceName?: string; defaultCityName?: string; defaultDistrictName?: string;
  namePrefix?: string;
}) {
  const [provinces, setProvinces] = useState<Item[]>([]);
  const [cities, setCities] = useState<Item[]>([]);
  const [districts, setDistricts] = useState<Item[]>([]);
  const [provinceId, setProvinceId] = useState(defaultProvinceId || '');
  const [cityId, setCityId] = useState(defaultCityId || '');
  const [districtId, setDistrictId] = useState(defaultDistrictId || '');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/provinces.json`).then((r) => r.json()).then(setProvinces).catch(() => setFailed(true));
  }, []);
  useEffect(() => {
    if (!provinceId) { setCities([]); return; }
    fetch(`${BASE}/regencies/${provinceId}.json`).then((r) => r.json()).then(setCities).catch(() => setFailed(true));
  }, [provinceId]);
  useEffect(() => {
    if (!cityId) { setDistricts([]); return; }
    fetch(`${BASE}/districts/${cityId}.json`).then((r) => r.json()).then(setDistricts).catch(() => setFailed(true));
  }, [cityId]);

  const provinceName = provinces.find((p) => p.id === provinceId)?.name || defaultProvinceName || '';
  const cityName = cities.find((c) => c.id === cityId)?.name || defaultCityName || '';
  const districtName = districts.find((d) => d.id === districtId)?.name || defaultDistrictName || '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="field">
        <label>Provinsi</label>
        <select name={`${namePrefix}province_id`} value={provinceId} onChange={(e) => { setProvinceId(e.target.value); setCityId(''); setDistrictId(''); }}>
          <option value="">{failed ? '(gagal memuat — isi manual di Alamat Detail)' : 'Pilih Provinsi'}</option>
          {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="hidden" name={`${namePrefix}province`} value={provinceName} />
      </div>
      <div className="field">
        <label>Kota / Kabupaten</label>
        <select name={`${namePrefix}city_id`} value={cityId} onChange={(e) => { setCityId(e.target.value); setDistrictId(''); }} disabled={!provinceId}>
          <option value="">{provinceId ? 'Pilih Kota/Kabupaten' : 'Pilih Provinsi dulu'}</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="hidden" name={`${namePrefix}city`} value={cityName} />
      </div>
      <div className="field">
        <label>Kecamatan</label>
        <select name={`${namePrefix}district_id`} value={districtId} onChange={(e) => setDistrictId(e.target.value)} disabled={!cityId}>
          <option value="">{cityId ? 'Pilih Kecamatan' : 'Pilih Kota dulu'}</option>
          {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input type="hidden" name={`${namePrefix}district`} value={districtName} />
      </div>
    </div>
  );
}
