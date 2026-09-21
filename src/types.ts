export interface StoreMaster {
  store_id: string;
  store_name: string;
  region: string;
  city: string;
  store_format: string; // Flagship, Mall, High Street, Outlet, etc.
}

export interface RawWeeklySale {
  store_id?: string | number;
  store_name?: string;
  week_start_date?: string | number | Date;
  product_category?: string;
  gross_sales?: string | number | null;
  discount_amount?: string | number | null;
  net_sales?: string | number | null;
  sales_target?: string | number | null;
  returns_amount?: string | number | null;
  transactions?: string | number | null;
  footfall?: string | number | null;
  stockouts?: string | number | null;
  inventory_on_hand?: string | number | null;
  [key: string]: unknown;
}

export interface SanitizedWeeklySale {
  store_id: string;
  week_start_date: string; // YYYY-MM-DD
  product_category: string;
  gross_sales: number | null;
  discount_amount: number;
  net_sales: number;
  sales_target: number;
  returns_amount: number;
  transactions: number;
  footfall: number;
  stockouts: number;
  inventory_on_hand: number;
  isNetSalesCalculated?: boolean;
}

export interface EnrichedSaleRecord extends SanitizedWeeklySale {
  id: string;
  store_name: string;
  region: string;
  city: string;
  store_format: string;
  target_achievement_rate: number; // (net_sales / sales_target) * 100
  atv: number; // net_sales / transactions
  return_rate: number; // (returns_amount / net_sales) * 100
  discount_rate: number; // (discount_amount / gross_sales) * 100
  conversion_rate: number; // (transactions / footfall) * 100
}

export interface FilterState {
  startDate: string;
  endDate: string;
  region: string;
  storeName: string;
  city: string;
  storeFormat: string;
  productCategory: string;
  searchQuery: string;
}

export interface DashboardKPIs {
  totalNetSales: number;
  totalGrossSales: number;
  totalSalesTarget: number;
  targetAchievementRate: number; // %
  targetStatus: 'green' | 'yellow' | 'red'; // >=100% green, 85-99% yellow, <85% red
  totalTransactions: number;
  totalFootfall: number;
  totalReturnsAmount: number;
  totalDiscountAmount: number;
  totalStockouts: number;
  totalInventoryOnHand: number;
  atv: number; // Average Transaction Value
  returnRate: number; // %
  discountRate: number; // %
  conversionRate: number; // %
  recordsCount: number;
}

export interface StorePerformanceMetric {
  store_id: string;
  store_name: string;
  region: string;
  city: string;
  store_format: string;
  net_sales: number;
  sales_target: number;
  achievement_rate: number;
  transactions: number;
  stockouts: number;
  inventory_on_hand: number;
}

export interface BusinessInsights {
  bestRegion: { name: string; netSales: number; achievement: number };
  worstRegion: { name: string; netSales: number; achievement: number };
  storesMissingTarget: Array<{
    store_name: string;
    region: string;
    achievement_rate: number;
    net_sales: number;
    sales_target: number;
  }>;
  categoriesHighestReturn: Array<{
    category: string;
    returnRate: number;
    returnsAmount: number;
    netSales: number;
  }>;
  topStockoutRisks: Array<{
    store_name: string;
    category: string;
    stockouts: number;
    inventory: number;
  }>;
  executiveSummaryText: string;
}

export interface SanitizationLog {
  totalRowsProcessed: number;
  datesSanitized: number;
  grossSalesNullified: number;
  netSalesCalculated: number;
  numericCoercions: number;
  unmatchedStores: number;
}

export interface PersistedDataset {
  id: string;
  rawSales: RawWeeklySale[];
  storeMaster: StoreMaster[];
  sanitizationLog?: SanitizationLog;
  salesFileName?: string | null;
  storesFileName?: string | null;
  updatedAt: string;
  recordsCount: number;
  isBenchmark: boolean;
  _storageType?: 'indexedDB' | 'localStorage';
}

export interface StorageInfo {
  isPersisted: boolean;
  recordsCount: number;
  updatedAt: string | null;
  storageType: 'indexedDB' | 'localStorage' | 'none';
  salesFileName?: string | null;
  storesFileName?: string | null;
}
