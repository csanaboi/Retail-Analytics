import { EnrichedSaleRecord, StoreMaster, RawWeeklySale } from '../types';
import { exportToCsvDirect, downloadWorkbookOrCsv } from './excelParser';

/**
 * Exports enriched records to a clean CSV file
 */
export function exportRecordsToCSV(records: EnrichedSaleRecord[], filename = 'retail_sales_filtered_export.csv') {
  if (!records || records.length === 0) {
    const emptyPlaceholder = [
      {
        week_start_date: 'NO_DATA',
        store_id: '',
        store_name: 'No records match selected filters',
        region: '',
        city: '',
        store_format: '',
        product_category: '',
        gross_sales: '',
        discount_amount: '',
        net_sales: '',
        sales_target: '',
        target_achievement_pct: '',
        returns_amount: '',
        return_rate_pct: '',
        transactions: '',
        footfall: '',
        atv: '',
        conversion_rate_pct: '',
        discount_rate_pct: '',
        stockouts: '',
        inventory_on_hand: '',
      },
    ];
    exportToCsvDirect(emptyPlaceholder, filename);
    return;
  }

  const exportData = records.map((r) => ({
    week_start_date: r.week_start_date,
    store_id: r.store_id,
    store_name: r.store_name,
    region: r.region,
    city: r.city,
    store_format: r.store_format,
    product_category: r.product_category,
    gross_sales: r.gross_sales !== null ? r.gross_sales : '',
    discount_amount: r.discount_amount,
    net_sales: r.net_sales,
    sales_target: r.sales_target,
    target_achievement_pct: r.target_achievement_rate.toFixed(1) + '%',
    returns_amount: r.returns_amount,
    return_rate_pct: r.return_rate.toFixed(1) + '%',
    transactions: r.transactions,
    footfall: r.footfall,
    atv: r.atv.toFixed(2),
    conversion_rate_pct: r.conversion_rate.toFixed(1) + '%',
    discount_rate_pct: r.discount_rate.toFixed(1) + '%',
    stockouts: r.stockouts,
    inventory_on_hand: r.inventory_on_hand,
  }));

  exportToCsvDirect(exportData, filename);
}

/**
 * Exports plain text / markdown file
 */
export function exportTextFile(content: string, filename = 'retail_sales_executive_insights.txt') {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates sample workbook for store_master.xlsx (or .csv fallback)
 */
export function downloadSampleStoreMaster(stores: StoreMaster[]) {
  downloadWorkbookOrCsv(stores, 'store_master.xlsx', 'StoreMaster');
}

/**
 * Generates sample workbook for retail_weekly_sales.xlsx (or .csv fallback)
 */
export function downloadSampleWeeklySales(rawSales: RawWeeklySale[]) {
  downloadWorkbookOrCsv(rawSales, 'retail_weekly_sales.xlsx', 'WeeklySales');
}
