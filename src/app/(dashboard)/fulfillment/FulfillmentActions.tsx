'use client';
import { useState } from 'react';
import { startPrepare, confirmShip, confirmDeliver, submitReturn } from '@/lib/actions/fulfillment';
import { todayStr } from '@/lib/utils';

export default function FulfillmentActions({ order }: { order: any }) {
  const [shipOpen, setShipOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [courier, setCourier] = useState(order.courier || '');
  const [tracking, setTracking] = useState(order.tracking_no || '');
  const [notes, setNotes] = useState('');
  const [receivedBy, setReceivedBy] = useState(order.customers?.name || '');
  const [deliveredDate, setDeliveredDate] = useState(todayStr());
  const [returnReason, setReturnReason] = useState('');
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});

  const status = order.fulfillment_status;

  if (status === 'Perlu Disiapkan') {
    return <form action={startPrepare.bind(null, order.id)}><button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }}>Mulai Siapkan</button></form>;
  }

  if (status === 'Disiapkan') {
    return (
      <>
        <button onClick={() => setShipOpen(true)} className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }}>Kirim</button>
        {shipOpen && (
          <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShipOpen(false)}>
            <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif text-lg font-semibold mb-4">Konfirmasi Pengiriman</h3>
              <div className="field mb-3"><label>Kurir/Ekspedisi</label><input value={courier} onChange={(e) => setCourier(e.target.value)} /></div>
              <div className="field mb-3"><label>No. Resi</label><input value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
              <div className="field mb-4"><label>Catatan</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <div className="text-right">
                <button className="btn btn-primary" onClick={async () => { await confirmShip(order.id, courier, tracking, notes); setShipOpen(false); }}>Konfirmasi &amp; Buat Surat Jalan</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (status === 'Dikirim') {
    return (
      <>
        <button onClick={() => setDeliverOpen(true)} className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }}>Tandai Diterima</button>{' '}
        <button onClick={() => setReturnOpen(true)} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Retur</button>
        {deliverOpen && (
          <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setDeliverOpen(false)}>
            <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif text-lg font-semibold mb-4">Konfirmasi Diterima</h3>
              <div className="field mb-3"><label>Diterima oleh</label><input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} /></div>
              <div className="field mb-3"><label>Tanggal Diterima</label><input type="date" value={deliveredDate} onChange={(e) => setDeliveredDate(e.target.value)} /></div>
              <div className="field mb-4"><label>Catatan</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <div className="text-right">
                <button className="btn btn-primary" onClick={async () => { await confirmDeliver(order.id, receivedBy, deliveredDate, notes); setDeliverOpen(false); }}>Konfirmasi Diterima</button>
              </div>
            </div>
          </div>
        )}
        {returnOpen && (
          <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setReturnOpen(false)}>
            <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-serif text-lg font-semibold mb-4">Ajukan Retur</h3>
              <div className="field mb-3"><label>Alasan Retur</label><textarea rows={2} value={returnReason} onChange={(e) => setReturnReason(e.target.value)} /></div>
              {(order.order_items || []).map((it: any) => (
                <div key={it.product_id} className="field mb-2">
                  <label>{it.products?.name} (order: {it.qty} {it.products?.uom})</label>
                  <input type="number" min={0} max={it.qty} value={returnQtys[it.product_id] || 0} onChange={(e) => setReturnQtys({ ...returnQtys, [it.product_id]: parseFloat(e.target.value) || 0 })} />
                </div>
              ))}
              <div className="text-right mt-2">
                <button className="btn btn-primary" onClick={async () => {
                  const items = Object.entries(returnQtys).filter(([, qty]) => qty > 0).map(([productId, qty]) => ({ productId, qty }));
                  if (items.length === 0) { alert('Isi minimal 1 qty retur.'); return; }
                  await submitReturn(order.id, returnReason, items);
                  setReturnOpen(false);
                }}>Ajukan Retur</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return <span className="text-xs text-gray-400">Selesai</span>;
}
