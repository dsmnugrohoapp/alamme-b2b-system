'use client';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';

function download(data: any[], prefix: string, sheetName: string) {
  if (data.length === 0) { alert('Tidak ada data untuk diexport.'); return; }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${prefix}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export default function ExportButtons() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const supabase = createClient();

  async function exportOrders() {
    let q = supabase.from('orders').select('*, customers(name, type)');
    if (from) q = q.gte('order_date', from);
    if (to) q = q.lte('order_date', to);
    const { data } = await q;
    const rows = (data || []).map((o: any) => ({
      'No Order': o.order_no, Tanggal: o.order_date, Customer: o.customers?.name, Tipe: o.customers?.type,
      'No PO': o.po_number, Termin: o.pay_term, 'Jatuh Tempo': o.due_date, Status: o.status,
      Subtotal: o.subtotal, Diskon: o.discount, 'Ongkir Charge': o.ship_charge, 'Ongkir Aktual': o.ship_actual,
      PPN: o.ppn ? 'Ya' : 'Tidak', 'Grand Total': o.grand_total, 'Net Profit': o.net_profit,
      'Net Margin %': Math.round(o.net_margin * 10) / 10, Poin: o.points_earned, Fulfillment: o.fulfillment_status,
    }));
    download(rows, 'Laporan-Order', 'Order');
  }

  async function exportCustomers() {
    const { data } = await supabase.from('customers').select('*');
    const rows = (data || []).map((c: any) => ({
      Nama: c.name, Tipe: c.type, Segmen: c.segment, Provinsi: c.province, 'Kota/Kabupaten': c.city, Kecamatan: c.district,
      'Alamat Detail': c.address_detail, PIC: c.pic, Telepon: c.phone, Email: c.email, Termin: c.pay_term,
      'Margin %': c.margin, PKP: c.pkp ? 'Ya' : 'Tidak', Poin: c.points, Catatan: c.notes,
    }));
    download(rows, 'Laporan-Customer', 'Customer');
  }

  async function exportPoints() {
    const { data } = await supabase.from('points_ledger').select('*, customers(name), orders(order_no)').order('ledger_date', { ascending: false });
    const rows = (data || []).map((l: any) => ({
      Tanggal: l.ledger_date, Customer: l.customers?.name, 'Tipe Transaksi': l.type, Poin: l.points,
      'No Order': l.orders?.order_no || '-', Catatan: l.notes,
    }));
    download(rows, 'Laporan-Poin', 'Poin');
  }

  async function exportFulfillment() {
    const { data } = await supabase.from('orders').select('*, customers(name), order_returns(reason, order_return_items(qty))').not('fulfillment_status', 'is', null);
    const rows = (data || []).map((o: any) => ({
      'No Order': o.order_no, Customer: o.customers?.name, 'Status Fulfillment': o.fulfillment_status,
      Disiapkan: o.prepared_at || '', Dikirim: o.shipped_at || '', Kurir: o.courier || '', 'No Resi': o.tracking_no || '',
      Diterima: o.delivered_at || '', 'Diterima Oleh': o.received_by || '',
      'Jumlah Retur': (o.order_returns || []).reduce((s: number, r: any) => s + (r.order_return_items || []).reduce((s2: number, i: any) => s2 + Number(i.qty), 0), 0),
      'Catatan Retur': (o.order_returns || []).map((r: any) => r.reason).join('; '),
    }));
    download(rows, 'Laporan-Fulfillment', 'Fulfillment');
  }

  return (
    <div>
      <div className="card mb-4">
        <h3 className="font-serif font-semibold mb-3">Rentang Tanggal (khusus Laporan Order)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="field"><label>Dari Tanggal</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="field"><label>Sampai Tanggal</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card"><h3 className="font-semibold text-sm">Laporan Order &amp; PNL</h3><p className="text-xs text-gray-500 mt-1">Semua order, status, revenue, net profit.</p><button className="btn btn-primary mt-2" onClick={exportOrders}>⤓ Download .xlsx</button></div>
        <div className="card"><h3 className="font-semibold text-sm">Laporan Customer</h3><p className="text-xs text-gray-500 mt-1">Database customer lengkap.</p><button className="btn btn-primary mt-2" onClick={exportCustomers}>⤓ Download .xlsx</button></div>
        <div className="card"><h3 className="font-semibold text-sm">Laporan Poin Reseller</h3><p className="text-xs text-gray-500 mt-1">Riwayat perolehan &amp; penukaran poin.</p><button className="btn btn-primary mt-2" onClick={exportPoints}>⤓ Download .xlsx</button></div>
        <div className="card"><h3 className="font-semibold text-sm">Laporan Fulfillment &amp; Retur</h3><p className="text-xs text-gray-500 mt-1">Status pengiriman &amp; retur.</p><button className="btn btn-primary mt-2" onClick={exportFulfillment}>⤓ Download .xlsx</button></div>
      </div>
    </div>
  );
}
