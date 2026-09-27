'use client';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';

function download(rows: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, filename);
}

export default function ExportButtons() {
  const [loading, setLoading] = useState('');

  async function exportOrders() {
    setLoading('orders');
    const supabase = createClient();
    const { data: orders } = await supabase.from('orders').select('*, customers(name, type), order_items(qty, unit_price, product_id, products(name, sku))');
    const rows = (orders || []).map((o: any) => ({
      'No Order': o.order_no, Tanggal: o.order_date, Customer: o.customers?.name, Tipe: o.customers?.type,
      'No PO': o.po_number, Status: o.status, Termin: o.pay_term,
      Item: (o.order_items || []).map((it: any) => `${it.products?.name} x${it.qty}`).join('; '),
      Subtotal: o.subtotal, Diskon: o.discount, Ongkir: o.ship_charge, PPN: o.ppn ? 'Ya' : 'Tidak',
      'Grand Total': o.grand_total, 'Net Profit': o.net_profit, 'Net Margin %': o.net_margin,
      'Poin Diperoleh': o.points_earned, 'Jatuh Tempo': o.due_date, 'Tgl Lunas': o.paid_date || '',
    }));
    download(rows, 'Alamme-Order-PNL.xlsx');
    setLoading('');
  }

  async function exportCustomers() {
    setLoading('customers');
    const supabase = createClient();
    const { data: customers } = await supabase.from('customers').select('*');
    const rows = (customers || []).map((c: any) => ({
      Nama: c.name, Tipe: c.type, Segmen: c.segment, Provinsi: c.province, 'Kota/Kabupaten': c.city, Kecamatan: c.district,
      'Alamat Detail': c.address_detail, PIC: c.pic, Telepon: c.phone, Email: c.email, 'Termin Bayar': c.pay_term,
      'Margin(%)': c.margin, PKP: c.pkp ? 'Ya' : 'Tidak', 'Saldo Poin': c.points, Catatan: c.notes,
    }));
    download(rows, 'Alamme-Customer.xlsx');
    setLoading('');
  }

  async function exportPoints() {
    setLoading('points');
    const supabase = createClient();
    const { data: ledger } = await supabase.from('points_ledger').select('*').order('ledger_date', { ascending: false });
    const customerIds = Array.from(new Set((ledger || []).map((l: any) => l.customer_id).filter(Boolean)));
    let customerMap: Record<string, string> = {};
    if (customerIds.length > 0) {
      const { data: customers } = await supabase.from('customers').select('id, name').in('id', customerIds);
      (customers || []).forEach((c: any) => { customerMap[c.id] = c.name; });
    }
    const orderIds = Array.from(new Set((ledger || []).map((l: any) => l.order_id).filter(Boolean)));
    let orderMap: Record<string, string> = {};
    if (orderIds.length > 0) {
      const { data: orders } = await supabase.from('orders').select('id, order_no').in('id', orderIds);
      (orders || []).forEach((o: any) => { orderMap[o.id] = o.order_no; });
    }
    const rows = (ledger || []).map((l: any) => ({
      Tanggal: l.ledger_date, Customer: customerMap[l.customer_id] || '-', 'No Order': l.order_id ? orderMap[l.order_id] || '-' : '-',
      Poin: l.points, Tipe: l.type, Catatan: l.notes,
    }));
    download(rows, 'Alamme-Poin.xlsx');
    setLoading('');
  }

  async function exportFulfillment() {
    setLoading('fulfillment');
    const supabase = createClient();
    const { data: orders } = await supabase.from('orders').select('*, customers(name), order_returns(id, reason, order_return_items(qty, product_id))').neq('status', 'Batal');
    const rows = (orders || []).map((o: any) => ({
      'No Order': o.order_no, Customer: o.customers?.name, 'Status Fulfillment': o.fulfillment_status,
      'Tgl Disiapkan': o.prepared_at || '', 'Tgl Dikirim': o.shipped_at || '', Kurir: o.courier || '', 'No Resi': o.tracking_no || '',
      'Tgl Diterima': o.delivered_at || '', 'Diterima Oleh': o.received_by || '',
      'Jumlah Retur': (o.order_returns || []).reduce((s: number, r: any) => s + (r.order_return_items || []).reduce((s2: number, i: any) => s2 + Number(i.qty), 0), 0),
      'Alasan Retur': (o.order_returns || []).map((r: any) => r.reason).filter(Boolean).join('; '),
    }));
    download(rows, 'Alamme-Fulfillment-Retur.xlsx');
    setLoading('');
  }

  async function exportLeads() {
    setLoading('leads');
    const supabase = createClient();
    // PENTING: pakai pola join 2 tahap yang aman (fetch base rows lalu fetch related via .in()),
    // JANGAN pakai sintaks embed `table!constraint_name(...)` — pernah menyebabkan data hilang diam-diam.
    const { data: leads } = await supabase.from('leads').select('*');
    const customerIds = Array.from(new Set((leads || []).map((l: any) => l.customer_id).filter(Boolean)));
    let customerMap: Record<string, any> = {};
    if (customerIds.length > 0) {
      const { data: customers } = await supabase.from('customers').select('id, name, type, city').in('id', customerIds);
      (customers || []).forEach((c: any) => { customerMap[c.id] = c; });
    }
    const leadIds = (leads || []).map((l: any) => l.id);
    let itemsByLead: Record<string, any[]> = {};
    if (leadIds.length > 0) {
      const { data: leadItems } = await supabase.from('lead_items').select('*').in('lead_id', leadIds);
      const productIds = Array.from(new Set((leadItems || []).map((it: any) => it.product_id).filter(Boolean)));
      let productMap: Record<string, any> = {};
      if (productIds.length > 0) {
        const { data: products } = await supabase.from('products').select('id, name, uom').in('id', productIds);
        (products || []).forEach((p: any) => { productMap[p.id] = p; });
      }
      (leadItems || []).forEach((it: any) => {
        if (!itemsByLead[it.lead_id]) itemsByLead[it.lead_id] = [];
        itemsByLead[it.lead_id].push({ ...it, product: productMap[it.product_id] });
      });
    }
    const freqMult: Record<string, number> = { Harian: 30, Mingguan: 4.33, Bulanan: 1 };
    const rows = (leads || []).map((l: any) => {
      const cust = customerMap[l.customer_id];
      const items = itemsByLead[l.id] || [];
      const estimasiBulanan = items.reduce((s, it) => s + (it.usual_price || 0) * (it.qty_per_frequency || 0) * (freqMult[it.frequency] || 1), 0);
      return {
        Customer: cust?.name || '-', Tipe: cust?.type || '-', Kota: cust?.city || '-',
        'Kontak': l.contact_name, Telepon: l.contact_phone, Rating: l.deal_rating, Status: l.status,
        'Follow-up Berikutnya': l.next_follow_up_date || '', 'Produk Diminati': items.map((it) => it.product?.name).filter(Boolean).join('; '),
        'Estimasi Nilai/Bulan': estimasiBulanan, Catatan: l.notes,
      };
    });
    download(rows, 'Alamme-Leads.xlsx');
    setLoading('');
  }

  const items = [
    { key: 'orders', label: 'Order & PNL', fn: exportOrders },
    { key: 'customers', label: 'Customer', fn: exportCustomers },
    { key: 'points', label: 'Poin Reseller', fn: exportPoints },
    { key: 'fulfillment', label: 'Fulfillment & Retur', fn: exportFulfillment },
    { key: 'leads', label: 'Leads', fn: exportLeads },
  ];

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <button key={it.key} onClick={it.fn} disabled={loading === it.key} className="btn w-full justify-between">
          <span>⤓ Export {it.label}</span>{loading === it.key && <span className="text-xs">Memproses...</span>}
        </button>
      ))}
    </div>
  );
}
