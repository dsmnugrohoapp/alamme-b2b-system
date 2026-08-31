'use client';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { bulkImportCustomers } from '@/lib/actions/customers';

export default function ImportButton() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function downloadTemplate() {
    const header = ['Nama', 'Tipe', 'Segmen', 'Provinsi', 'Kota/Kabupaten', 'Kecamatan', 'Alamat Detail', 'PIC', 'Telepon', 'Email', 'Termin Bayar', 'Margin(%)', 'PKP(1/0)', 'Catatan'];
    const example = ['Hotel Contoh Bandung', 'Hotel', 'Domestik', 'Jawa Barat', 'Kota Bandung', 'Coblong', 'Jl. Contoh No. 1', 'Budi', '081234567890', 'budi@contoh.com', 'TOP 14', '20', '1', 'Contoh data'];
    const csv = header.join(',') + '\n' + example.map((v) => `"${v.replace(/"/g, '""')}"`).join(',');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Template-Import-Customer-Alamme.csv';
    link.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, any>[];
        const res = await bulkImportCustomers(rows);
        setResult(res);
      } catch (err: any) {
        setResult({ added: 0, skipped: 0, error: err.message });
      }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  }

  return (
    <>
      <button className="btn" onClick={() => { setOpen(true); setResult(null); }}>⤒ Import Excel/CSV</button>
      {open && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-semibold">Import Customer</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 mb-3">
              Mendukung ribuan baris sekaligus (misal 1.500 data). Gunakan template agar kolom terbaca otomatis.
            </div>
            <button className="btn" style={{ fontSize: 12 }} onClick={downloadTemplate}>⤓ Download Template CSV</button>
            <div className="field mt-3"><label>Pilih File (.csv / .xlsx)</label><input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} /></div>
            {loading && <p className="text-sm text-gray-500 mt-2">Memproses...</p>}
            {result && (
              <div className="text-sm mt-3">
                {result.error
                  ? <span className="text-red-600">Gagal: {result.error}</span>
                  : <><span className="text-green-700">{result.added} customer berhasil diimport.</span>{result.skipped > 0 && <span className="text-red-600"> {result.skipped} baris dilewati.</span>}</>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
