import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileSpreadsheet, X, HelpCircle, ArrowRight, RefreshCw, FileText, Database, Trash2 } from 'lucide-react';
import { RawWeeklySale, StoreMaster, SanitizationLog, StorageInfo } from '../types';
import { parseExcelOrCsvFile } from '../utils/excelParser';

interface DataIngestionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDataIngested: (
    salesRaw: RawWeeklySale[],
    storeMaster: StoreMaster[],
    log: SanitizationLog,
    fileMeta?: { salesFileName?: string | null; storesFileName?: string | null }
  ) => void;
  onResetBenchmark: () => void;
  currentLog: SanitizationLog;
  totalStoresCount: number;
  totalSalesCount: number;
  storageInfo?: StorageInfo;
  onDownloadSampleWeekly: () => void;
  onDownloadSampleStores: () => void;
}

export const DataIngestionPanel: React.FC<DataIngestionPanelProps> = ({
  isOpen,
  onClose,
  onDataIngested,
  onResetBenchmark,
  currentLog,
  totalStoresCount,
  totalSalesCount,
  storageInfo,
  onDownloadSampleWeekly,
  onDownloadSampleStores,
}) => {
  const [salesFileName, setSalesFileName] = useState<string | null>(null);
  const [storesFileName, setStoresFileName] = useState<string | null>(null);
  const [stagedSales, setStagedSales] = useState<RawWeeklySale[] | null>(null);
  const [stagedStores, setStagedStores] = useState<StoreMaster[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragOverWeekly, setDragOverWeekly] = useState(false);
  const [dragOverStores, setDragOverStores] = useState(false);

  const weeklyInputRef = useRef<HTMLInputElement>(null);
  const storesInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleWeeklyFileChange = async (file: File) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const rows = await parseExcelOrCsvFile(file);
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Weekly sales file appears to be empty or in an invalid format.');
      }
      setStagedSales(rows as RawWeeklySale[]);
      setSalesFileName(file.name);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to parse weekly sales file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStoresFileChange = async (file: File) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const rows = await parseExcelOrCsvFile(file);
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Store master file appears to be empty or in an invalid format.');
      }
      // Normalize column names if needed
      const normalizedStores: StoreMaster[] = rows.map((r: any) => ({
        store_id: String(r.store_id || r.Store_ID || r.id || r.StoreID || '').trim(),
        store_name: String(r.store_name || r.Store_Name || r.name || r.StoreName || 'Unnamed Store').trim(),
        region: String(r.region || r.Region || 'Unassigned').trim(),
        city: String(r.city || r.City || 'Metro').trim(),
        store_format: String(r.store_format || r.Store_Format || r.Format || 'Standard').trim(),
      }));

      setStagedStores(normalizedStores);
      setStoresFileName(file.name);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to parse store master file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyData = () => {
    if (!stagedSales && !stagedStores) {
      setErrorMessage('Please upload at least one file or use benchmark data.');
      return;
    }
    // We import the sanitizer dynamically here or through props
    import('../utils/sanitizer').then(({ sanitizeWeeklySales }) => {
      const salesToProcess = stagedSales || [];
      const { log } = sanitizeWeeklySales(salesToProcess);
      onDataIngested(salesToProcess, stagedStores || [], log, {
        salesFileName,
        storesFileName,
      });
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Data Ingestion & Sanitization Engine</h2>
              <p className="text-xs text-slate-300">Upload retail weekly sales and store master files (.xlsx, .xls, .csv)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Persistence Announcement Banner */}
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-950">
            <div className="flex items-start space-x-2.5">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-indigo-900">Automatic Browser Persistence:</span>
                <p className="text-indigo-800/90 text-[11px] mt-0.5">
                  Uploaded files (including full 1,920 records) are persisted into browser storage (IndexedDB). Refreshing the page, closing the tab, or editing code retains all uploaded data automatically.
                </p>
              </div>
            </div>
            {storageInfo?.isPersisted && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-indigo-300 text-indigo-800 rounded-lg font-medium text-[11px] shrink-0 shadow-2xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{storageInfo.recordsCount.toLocaleString()} rows in {storageInfo.storageType === 'indexedDB' ? 'IndexedDB' : 'Storage'}</span>
              </span>
            )}
          </div>

          {/* Rules info banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center">
              <HelpCircle className="w-4 h-4 text-blue-600 mr-1.5" />
              Automated Data Sanitization Protocol Active:
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 pl-5 list-disc text-slate-600">
              <li>Standardizes dates into <span className="font-mono text-slate-800 font-semibold">YYYY-MM-DD</span> (handles DD-MM-YYYY, Excel serials).</li>
              <li>Coerces numeric strings, currency symbols ($), and commas into clean numbers.</li>
              <li>Non-numeric gross sales (<span className="font-mono text-rose-700">"not_available"</span>) converted to null.</li>
              <li>Missing net sales dynamically computed as <span className="font-mono text-slate-800">(gross_sales - discount_amount)</span>.</li>
            </ul>
          </div>

          {/* Current Ingestion Audit Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-center">
            <div>
              <div className="text-xs text-slate-500 font-medium">Rows Loaded</div>
              <div className="text-lg font-bold text-slate-800">{totalSalesCount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Dates Standardized</div>
              <div className="text-lg font-bold text-blue-700">{currentLog.datesSanitized.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Net Sales Computed</div>
              <div className="text-lg font-bold text-emerald-700">{currentLog.netSalesCalculated.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Stores Mapped</div>
              <div className="text-lg font-bold text-indigo-700">{totalStoresCount}</div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Dropzones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File 1: retail_weekly_sales.xlsx */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverWeekly(true);
              }}
              onDragLeave={() => setDragOverWeekly(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverWeekly(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleWeeklyFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center transition-colors cursor-pointer ${
                dragOverWeekly
                  ? 'border-blue-500 bg-blue-50/50'
                  : stagedSales
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
              onClick={() => weeklyInputRef.current?.click()}
            >
              <input
                ref={weeklyInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleWeeklyFileChange(e.target.files[0]);
                  }
                }}
              />
              <FileSpreadsheet className={`w-9 h-9 mb-2 ${stagedSales ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="font-semibold text-sm text-slate-800">1. retail_weekly_sales.xlsx</div>
              <p className="text-xs text-slate-500 mt-0.5">Weekly transactions, sales, returns, footfall</p>

              {stagedSales ? (
                <div className="mt-3 flex items-center text-xs text-emerald-700 font-medium bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  {salesFileName} ({stagedSales.length} rows)
                </div>
              ) : (
                <div className="mt-3 text-xs text-blue-600 font-medium hover:underline">
                  Click to browse or drag file here
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadSampleWeekly();
                }}
                className="mt-2 text-[11px] text-slate-500 hover:text-blue-600 underline flex items-center"
              >
                Download sample retail_weekly_sales.xlsx
              </button>
            </div>

            {/* File 2: store_master.xlsx */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStores(true);
              }}
              onDragLeave={() => setDragOverStores(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStores(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleStoresFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center transition-colors cursor-pointer ${
                dragOverStores
                  ? 'border-blue-500 bg-blue-50/50'
                  : stagedStores
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
              onClick={() => storesInputRef.current?.click()}
            >
              <input
                ref={storesInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleStoresFileChange(e.target.files[0]);
                  }
                }}
              />
              <FileText className={`w-9 h-9 mb-2 ${stagedStores ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div className="font-semibold text-sm text-slate-800">2. store_master.xlsx</div>
              <p className="text-xs text-slate-500 mt-0.5">Store ID, store name, region, city, format</p>

              {stagedStores ? (
                <div className="mt-3 flex items-center text-xs text-emerald-700 font-medium bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  {storesFileName} ({stagedStores.length} stores)
                </div>
              ) : (
                <div className="mt-3 text-xs text-blue-600 font-medium hover:underline">
                  Click to browse or drag file here
                </div>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadSampleStores();
                }}
                className="mt-2 text-[11px] text-slate-500 hover:text-blue-600 underline flex items-center"
              >
                Download sample store_master.xlsx
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onResetBenchmark();
              onClose();
            }}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restore Default Benchmark Data</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing || (!stagedSales && !stagedStores)}
              onClick={handleApplyData}
              className={`px-4 py-2 text-xs font-semibold rounded-lg text-white transition flex items-center space-x-1.5 shadow-sm ${
                stagedSales || stagedStores
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              <span>{isProcessing ? 'Sanitizing & Ingesting...' : 'Sanitize & Ingest Datasets'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
