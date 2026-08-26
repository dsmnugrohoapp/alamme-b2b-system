import ExportButtons from './ExportButtons';

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-wide text-golddeep font-bold">Data</div>
        <h1 className="font-serif text-2xl font-semibold">Laporan</h1>
        <p className="text-sm text-gray-500 mt-1">Download data mentah dalam format Excel (.xlsx).</p>
      </div>
      <ExportButtons />
    </div>
  );
}
