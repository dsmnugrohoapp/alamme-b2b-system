'use client';
import { useState } from 'react';
import { startPrepare, confirmShip, confirmDeliver, submitReturn } from '@/lib/actions/fulfillment';
import { todayStr } from '@/lib/utils';

export default function FulfillmentActions({ order, items }: { order: any; items: any[] }) {
  const [modal, setModal] = useState<'' | 'ship' | 'deliver' | 'return'>('');
  const status = order.fulfillment_status || 'Perlu Disiapkan';

  return (
    <>
      <div className="flex gap-1.5 flex-wrap">
        {status === 'Perlu Disiapkan' && (
          <button onClick={async () => { await startPrepare(order.id); }} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Mulai Persiapan</button>
        )}
        {status === 'Disiapkan' && <button onClick={() => setModal('ship')} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Kirim Barang</button>}
        {status === 'Dikirim' && <button onClick={() => setModal('deliver')} className="btn" style={{ padding: '5px 10px', fontSize: 12 }}>Tandai Diterima</button>}
        {['Dikirim', 'Diterima'].includes(status) && <button onClick={() => setModal('return')} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}>Catat Retur</button>}
      </div>

      {modal === 'ship' && <ShipModal orderId={order.id} onClose={() => setModal('')} />}
      {modal === 'deliver' && <DeliverModal orderId={order.id} onClose={() => setModal('')} />}
      {modal === 'return' && <ReturnModal orderId={order.id} items={items} onClose={() => setModal('')} />}
    </>
  );
}

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-serif text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ShipModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [courier, setCourier] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');
  async function submit() {
    const sjNo = await confirmShip(orderId, courier, tracking, notes);
    onClose();
    alert('Barang dikirim. Surat Jalan otomatis dibuat: ' + sjNo);
  }
  return (
    <ModalShell title="Kirim Barang" onClose={onClose}>
      <div className="field mb-3"><label>Kurir / Ekspedisi</label><input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="JNE / Internal / Gojek" /></div>
      <div className="field mb-3"><label>No. Resi (opsional)</label><input value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
      <div className="field mb-3"><label>Catatan</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <p className="text-xs text-gray-500 mb-3">Surat Jalan akan otomatis dibuat begitu barang dikirim.</p>
      <div className="text-right"><button onClick={submit} className="btn btn-primary">Konfirmasi Kirim</button></div>
    </ModalShell>
  );
}

function DeliverModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [receivedBy, setReceivedBy] = useState('');
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState('');
  async function submit() {
    await confirmDeliver(orderId, receivedBy, date, notes);
    onClose();
  }
  return (
    <ModalShell title="Konfirmasi Diterima" onClose={onClose}>
      <div className="field mb-3"><label>Diterima Oleh</label><input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} /></div>
      <div className="field mb-3"><label>Tanggal Diterima</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div className="field mb-3"><label>Catatan Kondisi Barang</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Barang diterima dalam kondisi baik" /></div>
      <div className="text-right"><button onClick={submit} className="btn btn-primary">Konfirmasi Diterima</button></div>
    </ModalShell>
  );
}

function ReturnModal({ orderId, items, onClose }: { orderId: string; items: any[]; onClose: () => void }) {
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  async function submit() {
    const returnItems = Object.entries(qtys).filter(([, qty]) => qty > 0).map(([productId, qty]) => ({ productId, qty }));
    if (returnItems.length === 0) { alert('Isi jumlah retur minimal 1 item.'); return; }
    await submitReturn(orderId, reason, returnItems);
    onClose();
  }
  return (
    <ModalShell title="Catat Retur" onClose={onClose}>
      <div className="space-y-2 mb-3">
        {items.map((it: any) => (
          <div key={it.product_id} className="field mb-0">
            <label>{it.products?.name} (dipesan: {it.qty})</label>
            <input type="number" step="0.01" min={0} max={it.qty} defaultValue={0} onChange={(e) => setQtys({ ...qtys, [it.product_id]: parseFloat(e.target.value) || 0 })} />
          </div>
        ))}
      </div>
      <div className="field mb-3"><label>Alasan Retur</label><textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Barang rusak / salah kirim / dll" /></div>
      <div className="text-right"><button onClick={submit} className="btn btn-primary">Simpan Retur</button></div>
    </ModalShell>
  );
}
