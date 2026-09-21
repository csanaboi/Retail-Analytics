import React from 'react';
import { Download, RefreshCw, UploadCloud, FileSpreadsheet, ShieldAlert, Sparkles, CheckCircle2, Database } from 'lucide-react';
import { DashboardKPIs, StorageInfo } from '../types';

interface HeaderProps {
  kpis: DashboardKPIs;
  totalRawCount: number;
  filteredCount: number;
  isBenchmarkData: boolean;
  storageInfo?: StorageInfo;
  onOpenIngestion: () => void;
  onResetToBenchmark: () => void;
  onExportCSV: () => void;
  onExportInsights: () => void;
  onDownloadSampleWeekly: () => void;
  onDownloadSampleStores: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  kpis,
  totalRawCount,
  filteredCount,
  isBenchmarkData,
  storageInfo,
  onOpenIngestion,
  onResetToBenchmark,
  onExportCSV,
  onExportInsights,
  onDownloadSampleWeekly,
  onDownloadSampleStores,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand & Meta */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner text-white font-bold text-xl">
              <span className="tracking-tighter">RS</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Retail Sales Intelligence</h1>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    isBenchmarkData
                      ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {isBenchmarkData ? 'Benchmark Data' : 'Custom Ingested'}
                </span>

                {/* Browser Storage Persistence Status Badge */}
                {storageInfo?.isPersisted && !isBenchmarkData && (
                  <span
                    id="badge-storage-persisted"
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-indigo-950/90 text-indigo-200 border-indigo-700/80 shadow-2xs"
                    title={`Retained across refreshes & code iterations in browser ${storageInfo.storageType === 'indexedDB' ? 'IndexedDB' : 'LocalStorage'}`}
                  >
                    <Database className="w-3 h-3 mr-1 text-indigo-400" />
                    <span>Saved in {storageInfo.storageType === 'indexedDB' ? 'IndexedDB' : 'Storage'} ({storageInfo.recordsCount.toLocaleString()} rows)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Live executive analytics across {filteredCount.toLocaleString()} matching records (of {totalRawCount.toLocaleString()} total)
              </p>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download Templates Dropdown / Buttons */}
            <div className="flex items-center space-x-1 bg-slate-800/80 rounded-lg p-1 border border-slate-700/80">
              <button
                id="btn-sample-weekly"
                onClick={onDownloadSampleWeekly}
                title="Download sample retail_weekly_sales.xlsx"
                className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition flex items-center space-x-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sales Sample</span>
              </button>
              <span className="text-slate-600 text-xs">|</span>
              <button
                id="btn-sample-stores"
                onClick={onDownloadSampleStores}
                title="Download sample store_master.xlsx"
                className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition flex items-center space-x-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                <span>Stores Sample</span>
              </button>
            </div>

            {/* Ingestion Center Trigger */}
            <button
              id="btn-open-ingestion"
              onClick={onOpenIngestion}
              className="px-3 py-1.5 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition flex items-center space-x-1.5 shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-blue-400" />
              <span>Upload / Ingestion</span>
            </button>

            {/* Reset to Benchmark */}
            <button
              id="btn-reset-benchmark"
              onClick={onResetToBenchmark}
              title="Reset to benchmark dataset"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Benchmark</span>
            </button>

            {/* Export Dropdown Group */}
            <div className="flex items-center space-x-1.5">
              <button
                id="btn-export-csv"
                onClick={onExportCSV}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition flex items-center space-x-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                id="btn-export-insights"
                onClick={onExportInsights}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-700/80 rounded-lg transition flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Export Insights</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
