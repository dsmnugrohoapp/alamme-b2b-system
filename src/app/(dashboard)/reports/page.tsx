import ExportButtons from './ExportButtons';

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Analytics</div>
        <h1 className="font-serif text-2xl font-semibold">Laporan</h1>
        <p className="text-sm text-gray-500 mt-1">Export Excel untuk Order &amp; PNL, Customer, Poin, Fulfillment &amp; Retur, dan Leads.</p>
      </div>
      <div className="card max-w-xl">
        <ExportButtons />
      </div>
    </div>
  );
}
