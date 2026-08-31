'use client';
import { useRef, useState } from 'react';
import { rp, addDays } from '@/lib/utils';

export default function DocClient({ order, items, companies, pointValue }: { order: any; items: any[]; companies: Record<string, any>; pointValue: number }) {
  const [docType, setDocType] = useState<'invoice' | 'quotation' | 'suratjalan'>('invoice');
  const [companyKey, setCompanyKey] = useState<'sda' | 'mba' | 'plain'>('sda');
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const comp = companies[companyKey] || {};
  const c = order.customers;
  const shipAddrText = order.ship_same_as_customer
    ? [c?.address_detail, c?.district, c?.city, c?.province].filter(Boolean).join(', ')
    : [order.ship_address_detail, order.ship_district, order.ship_city, order.ship_province].filter(Boolean).join(', ');

  const docNo = docType === 'invoice' ? order.invoice_no : docType === 'quotation' ? order.quo_no : order.surat_jalan_no;
  const docLabel = docType === 'invoice' ? 'INVOICE' : docType === 'quotation' ? 'QUOTATION' : 'SURAT JALAN';
  const bankAccounts: any[] = comp.bank_accounts || [];

  async function downloadPdf() {
    if (!printRef.current) return;
    setDownloading(true);
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
    pdf.save((docNo || 'dokumen').replace(/\//g, '-') + '.pdf');
    setDownloading(false);
  }

  return (
    <div>
      <div className="no-print card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="field"><label>Jenis Dokumen</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value as any)}>
              <option value="quotation">Quotation / Penawaran</option>
              <option value="invoice">Invoice</option>
              <option value="suratjalan">Surat Jalan / Packing List</option>
            </select>
          </div>
          <div className="field"><label>Kop Surat</label>
            <select value={companyKey} onChange={(e) => setCompanyKey(e.target.value as any)}>
              <option value="sda">PT Semua Dari Alam</option>
              <option value="mba">PT Maju Bersama Alam</option>
              <option value="plain">Tanpa Kop Surat / Plain</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadPdf} disabled={downloading} className="btn btn-gold">{downloading ? 'Memproses...' : '⤓ Download PDF'}</button>
          <button onClick={() => window.print()} className="btn">🖨 Cetak</button>
        </div>
      </div>

      <div ref={printRef} className="bg-white max-w-[800px] mx-auto p-8 md:p-12 border border-gray-200 shadow-sm" id="doc-printable">
        <div className={`flex justify-between items-start pb-4 mb-5 ${companyKey === 'plain' ? 'border-b border-gray-200' : 'border-b-[3px] border-ink'}`}>
          <div>
            <div className={companyKey === 'plain' ? 'text-base font-bold' : 'font-serif text-xl font-bold'}>{comp.name || '(Nama Perusahaan)'}</div>
            <div className="text-[11px] text-gray-500 mt-1 leading-relaxed max-w-[280px]">
              {comp.address || '[Alamat — isi di Pengaturan]'}<br />{comp.city}<br />
              {comp.phone && <>Telp: {comp.phone}<br /></>}{comp.email && <>Email: {comp.email}<br /></>}{comp.npwp && <>NPWP: {comp.npwp}</>}
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-golddeep text-right">{docLabel}</div>
            <div className="text-right text-xs text-gray-600 mt-1.5 space-y-0.5">
              <div>No: <b className="font-mono">{docNo}</b></div>
              <div>Tanggal: {order.order_date}</div>
              {docType === 'invoice' && <div>Jatuh Tempo: {order.due_date}</div>}
              {docType === 'quotation' && <div>Berlaku s.d: {addDays(order.order_date, 14)}</div>}
              <div>Ref. PO: {order.po_number || '-'}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-8 mb-5 flex-wrap text-sm">
          <div>
            <div className="text-[10.5px] uppercase text-gray-500 font-bold mb-1.5">{docType === 'suratjalan' ? 'Kirim Kepada' : 'Ditujukan kepada'}</div>
            <b>{c?.name}</b><br />{shipAddrText}<br />
            {(order.ship_recipient_phone || c?.phone) && <>Telp: {order.ship_recipient_phone || c?.phone}</>}
          </div>
          <div className="text-right">
            <div className="text-[10.5px] uppercase text-gray-500 font-bold mb-1.5">{docType === 'suratjalan' ? 'Info Order' : 'Termin Pembayaran'}</div>
            {docType === 'suratjalan' ? <>No. Order: <b>{order.order_no}</b></> : <><b>{order.pay_term}</b><br />{order.ppn ? 'PPN 11% berlaku' : 'Non-PPN'}</>}
          </div>
        </div>

        {docType === 'suratjalan' ? (
          <>
            <table className="w-full border-collapse mb-4">
              <thead><tr className="bg-ink text-white text-[11px] uppercase"><th className="p-2.5 text-left">SKU</th><th className="p-2.5 text-left">Deskripsi</th><th className="p-2.5 text-left">Qty</th><th className="p-2.5 text-left">Cek</th></tr></thead>
              <tbody>
                {items.map((it: any) => (
                  <tr key={it.id} className="border-b border-gray-200"><td className="p-2.5 font-mono text-xs">{it.products?.sku}</td><td className="p-2.5 text-xs">{it.products?.name}</td><td className="p-2.5 text-xs">{it.qty} {it.products?.uom}</td><td className="p-2.5 text-xs">☐</td></tr>
                ))}
              </tbody>
            </table>
            <div className="bg-cream rounded-lg p-4 text-xs leading-relaxed">
              Kurir/Ekspedisi: <b>{order.courier || '-'}</b> &nbsp; No. Resi: <b>{order.tracking_no || '-'}</b><br />
              Mohon periksa kondisi dan jumlah barang saat diterima. Kerusakan/kekurangan wajib dilaporkan maksimal 1x24 jam.
            </div>
            <div className="flex justify-between mt-12 text-xs text-center flex-wrap gap-4">
              <div className="w-40"><div className="border-t border-ink mt-16 pt-1.5 font-semibold">Disiapkan oleh</div></div>
              <div className="w-40"><div className="border-t border-ink mt-16 pt-1.5 font-semibold">Kurir/Pengirim</div></div>
              <div className="w-40"><div className="border-t border-ink mt-16 pt-1.5 font-semibold">{c?.pic || 'Penerima'}</div></div>
            </div>
          </>
        ) : (
          <>
            <table className="w-full border-collapse mb-4">
              <thead><tr className="bg-ink text-white text-[11px] uppercase"><th className="p-2.5 text-left">SKU</th><th className="p-2.5 text-left">Deskripsi</th><th className="p-2.5 text-left">Qty</th><th className="p-2.5 text-left">Harga</th><th className="p-2.5 text-left">Diskon</th><th className="p-2.5 text-left">Jumlah</th></tr></thead>
              <tbody>
                {items.map((it: any) => {
                  const gross = it.qty * it.unit_price;
                  const discAmt = it.discount_type === 'percent' ? (gross * (it.discount_value || 0)) / 100 : it.discount_value || 0;
                  const net = Math.max(0, gross - Math.min(discAmt, gross));
                  const discLabel = it.discount_value > 0 ? (it.discount_type === 'percent' ? `${it.discount_value}%` : rp(it.discount_value)) : '-';
                  return (
                    <tr key={it.id} className="border-b border-gray-200">
                      <td className="p-2.5 font-mono text-xs">{it.products?.sku}</td><td className="p-2.5 text-xs">{it.products?.name}</td>
                      <td className="p-2.5 text-xs">{it.qty} {it.products?.uom}</td><td className="p-2.5 text-xs">{rp(it.unit_price)}</td>
                      <td className="p-2.5 text-xs">{discLabel}</td><td className="p-2.5 text-xs">{rp(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="w-72 ml-auto text-sm">
              <div className="flex justify-between py-1"><span>Subtotal Bersih</span><span>{rp(order.subtotal)}</span></div>
              <div className="flex justify-between py-1"><span>Diskon Order {order.discount_type === 'percent' ? `(${order.discount_value}%)` : ''}</span><span>− {rp(order.discount)}</span></div>
              <div className="flex justify-between py-1"><span>Ongkir</span><span>{rp(order.ship_charge)}</span></div>
              <div className="flex justify-between py-1"><span>DPP</span><span>{rp(order.subtotal - order.discount + order.ship_charge)}</span></div>
              <div className="flex justify-between py-1"><span>PPN 11%</span><span>{rp(order.ppn ? (order.subtotal - order.discount + order.ship_charge) * 0.11 : 0)}</span></div>
              <div className="flex justify-between font-extrabold text-base border-t-2 border-ink mt-1 pt-2"><span>Total</span><span>{rp(order.grand_total)}</span></div>
            </div>
            {order.points_earned > 0 && (
              <div className="mt-3 text-xs bg-goldsoft text-golddeep px-3.5 py-2.5 rounded-lg font-bold">
                ★ Poin diperoleh dari transaksi ini: {order.points_earned} poin (setara {rp(order.points_earned * pointValue)})
              </div>
            )}
            <div className="mt-6 text-xs text-gray-600 bg-cream p-4 rounded-lg leading-relaxed">
              {docType === 'invoice' ? (
                <>Mohon melakukan pembayaran sesuai termin <b>{order.pay_term}</b> paling lambat <b>{order.due_date}</b> ke rekening berikut:<br />
                  {bankAccounts.length ? bankAccounts.map((b, i) => (
                    <span key={i}>{b.bank} — {b.accountNo} a.n. {b.holder} ({b.type}){i < bankAccounts.length - 1 && <br />}</span>
                  )) : '[Belum ada rekening — isi di Pengaturan]'}
                </>
              ) : (
                <>Penawaran ini berlaku 14 hari sejak tanggal diterbitkan. Harga sudah termasuk {order.ppn ? 'PPN 11%' : 'tanpa PPN'}. Konfirmasi PO dapat dikirim ke {comp.email || comp.phone || 'kontak kami'}.</>
              )}
            </div>
            <div className="flex justify-between mt-12 text-xs text-center flex-wrap gap-4">
              <div className="w-40"><div className="border-t border-ink mt-16 pt-1.5 font-semibold">{c?.pic || 'Customer'}</div></div>
              <div className="w-40"><div className="border-t border-ink mt-16 pt-1.5 font-semibold">{comp.name || 'Alamme'}</div></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
