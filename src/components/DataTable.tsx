import React, { useState } from 'react';
import { Table, ChevronDown, ChevronUp, ChevronsUpDown, Download, Search, SearchX, Calculator } from 'lucide-react';
import { EnrichedSaleRecord } from '../types';

interface DataTableProps {
  records: EnrichedSaleRecord[];
  onExportCSV: (customRecords?: EnrichedSaleRecord[]) => void;
  onResetFilters?: () => void;
}

type SortField = keyof EnrichedSaleRecord;
type SortOrder = 'asc' | 'desc';

export const DataTable: React.FC<DataTableProps> = ({ records, onExportCSV, onResetFilters }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>('week_start_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Local search filter
  const filtered = records.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.store_name.toLowerCase().includes(term) ||
      r.region.toLowerCase().includes(term) ||
      r.city.toLowerCase().includes(term) ||
      r.product_category.toLowerCase().includes(term) ||
      r.week_start_date.toLowerCase().includes(term)
    );
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];

    if (valA === null || valA === undefined) return sortOrder === 'asc' ? -1 : 1;
    if (valB === null || valB === undefined) return sortOrder === 'asc' ? 1 : -1;

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-3 h-3 text-slate-400 inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-blue-600 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-600 inline ml-1" />
    );
  };

  const handleDownloadActiveView = () => {
    // Export the exact active table view (reflecting filters and search)
    onExportCSV(sorted);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sanitized Sales Record Explorer</h3>
            <p className="text-xs text-slate-500">
              Showing {sorted.length} active records with verified dates & dynamic net calculations
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          <button
            id="btn-download-filtered-csv"
            onClick={handleDownloadActiveView}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center space-x-1.5 shadow-xs"
            title="Download exact active table view as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Filtered Data (CSV)</span>
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th
                onClick={() => handleSort('week_start_date')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 transition"
              >
                Week (YYYY-MM-DD) {renderSortIcon('week_start_date')}
              </th>
              <th
                onClick={() => handleSort('store_name')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 transition"
              >
                Store {renderSortIcon('store_name')}
              </th>
              <th
                onClick={() => handleSort('product_category')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 transition"
              >
                Category {renderSortIcon('product_category')}
              </th>
              <th
                onClick={() => handleSort('gross_sales')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition"
              >
                Gross Sales {renderSortIcon('gross_sales')}
              </th>
              <th
                onClick={() => handleSort('discount_amount')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition"
              >
                Discounts {renderSortIcon('discount_amount')}
              </th>
              <th
                onClick={() => handleSort('net_sales')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition"
              >
                Net Sales {renderSortIcon('net_sales')}
              </th>
              <th
                onClick={() => handleSort('sales_target')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition"
              >
                Target {renderSortIcon('sales_target')}
              </th>
              <th
                onClick={() => handleSort('target_achievement_rate')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition"
              >
                Achievement {renderSortIcon('target_achievement_rate')}
              </th>
              <th
                onClick={() => handleSort('transactions')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition"
              >
                Tx / Footfall {renderSortIcon('transactions')}
              </th>
              <th
                onClick={() => handleSort('stockouts')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition"
              >
                Stockouts / Inv {renderSortIcon('stockouts')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 py-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <SearchX className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">No Data Found for Selected Filters</span>
                    <span className="text-xs text-slate-500 max-w-sm">
                      No sales records match the active filter or search criteria. Try clearing search filters or resetting all filters.
                    </span>
                    {onResetFilters && (
                      <button
                        onClick={onResetFilters}
                        className="mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((r) => {
                const achievementStatus =
                  r.target_achievement_rate >= 100
                    ? 'text-emerald-700 bg-emerald-50'
                    : r.target_achievement_rate >= 85
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-rose-700 bg-rose-50';

                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {r.week_start_date}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{r.store_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.region} • {r.city} ({r.store_format})
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{r.product_category}</td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      {r.gross_sales !== null ? (
                        `$${r.gross_sales.toLocaleString()}`
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">null (N/A)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      ${r.discount_amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      <div className="flex items-center justify-end space-x-1">
                        {r.isNetSalesCalculated && (
                          <span
                            title="Dynamically calculated as (gross_sales - discount_amount)"
                            className="inline-flex items-center text-[10px] text-blue-600 bg-blue-50 px-1 rounded"
                          >
                            <Calculator className="w-2.5 h-2.5 mr-0.5" /> calc
                          </span>
                        )}
                        <span>${r.net_sales.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      ${r.sales_target.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${achievementStatus}`}>
                        {r.target_achievement_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-semibold text-slate-800">{r.transactions.toLocaleString()}</span>
                      <span className="text-slate-400 text-[11px]"> / {r.footfall.toLocaleString()}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={r.stockouts > 5 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                        {r.stockouts}
                      </span>
                      <span className="text-slate-400 text-[11px]"> / {r.inventory_on_hand.toLocaleString()}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div>
          Showing {(currentPage - 1) * pageSize + (sorted.length > 0 ? 1 : 0)} to{' '}
          {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} records
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Prev
            </button>
            <span className="px-2 font-medium text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
