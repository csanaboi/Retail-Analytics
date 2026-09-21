/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { FilterX, Database } from 'lucide-react';
import { Header } from './components/Header';
import { FilterControls } from './components/FilterControls';
import { KpiGrid } from './components/KpiGrid';
import { WeeklyTrendChart } from './components/WeeklyTrendChart';
import { RegionChart } from './components/RegionChart';
import { CategoryChart } from './components/CategoryChart';
import { StoreLeaderboard } from './components/StoreLeaderboard';
import { StockoutRiskChart } from './components/StockoutRiskChart';
import { BusinessInsights } from './components/BusinessInsights';
import { DataTable } from './components/DataTable';
import { DataIngestionPanel } from './components/DataIngestionPanel';
import { ErrorBoundary } from './components/ErrorBoundary';

import {
  DEFAULT_STORE_MASTER,
  generateBenchmarkWeeklySales,
} from './utils/mockData';
import {
  sanitizeWeeklySales,
  enrichWithStoreMaster,
} from './utils/sanitizer';
import {
  calculateDashboardKPIs,
  aggregateWeeklyTrend,
  aggregateSalesByRegion,
  aggregateCategoryPerformance,
  aggregateStoreMetrics,
  generateBusinessInsights,
} from './utils/analytics';
import {
  exportRecordsToCSV,
  exportTextFile,
  downloadSampleStoreMaster,
  downloadSampleWeeklySales,
} from './utils/exporter';
import {
  saveUploadedDataset,
  loadUploadedDataset,
  clearUploadedDataset,
} from './utils/storage';
import { FilterState, RawWeeklySale, StoreMaster, SanitizationLog, EnrichedSaleRecord, StorageInfo } from './types';

export default function App() {
  // Initial benchmark bootstrap guaranteed to load immediately
  const initialRawSales = useMemo(() => generateBenchmarkWeeklySales(), []);
  const initialSanitized = useMemo(() => sanitizeWeeklySales(initialRawSales), [initialRawSales]);

  const [rawSales, setRawSales] = useState<RawWeeklySale[]>(initialRawSales);
  const [storeMaster, setStoreMaster] = useState<StoreMaster[]>(DEFAULT_STORE_MASTER);
  const [sanitizationLog, setSanitizationLog] = useState<SanitizationLog>(initialSanitized.log);
  const [isBenchmarkData, setIsBenchmarkData] = useState<boolean>(true);
  const [isIngestionOpen, setIsIngestionOpen] = useState<boolean>(false);

  // Storage persistence state
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    isPersisted: false,
    recordsCount: 0,
    updatedAt: null,
    storageType: 'none',
  });

  // Restore persisted custom dataset on load or after code refresh
  useEffect(() => {
    let isMounted = true;
    async function restorePersistedData() {
      try {
        const persisted = await loadUploadedDataset();
        if (!isMounted) return;

        if (persisted && Array.isArray(persisted.rawSales) && persisted.rawSales.length > 0) {
          setRawSales(persisted.rawSales);
          if (Array.isArray(persisted.storeMaster) && persisted.storeMaster.length > 0) {
            setStoreMaster(persisted.storeMaster);
          }
          if (persisted.sanitizationLog) {
            setSanitizationLog(persisted.sanitizationLog);
          } else {
            const { log } = sanitizeWeeklySales(persisted.rawSales);
            setSanitizationLog(log);
          }
          setIsBenchmarkData(Boolean(persisted.isBenchmark));
          setStorageInfo({
            isPersisted: true,
            recordsCount: persisted.rawSales.length,
            updatedAt: persisted.updatedAt || null,
            storageType: persisted._storageType || 'indexedDB',
            salesFileName: persisted.salesFileName || null,
            storesFileName: persisted.storesFileName || null,
          });
        }
      } catch (err) {
        console.warn('Could not restore persisted dataset from browser storage:', err);
      }
    }
    restorePersistedData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Active multi-field filter state
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    region: '',
    storeName: '',
    city: '',
    storeFormat: '',
    productCategory: '',
    searchQuery: '',
  });

  // 1. Sanitize & Enrich full dataset
  const enrichedRecords = useMemo(() => {
    try {
      const { sanitized } = sanitizeWeeklySales(rawSales);
      const { records } = enrichWithStoreMaster(sanitized, storeMaster);
      return records;
    } catch (e) {
      console.error('Error during data sanitization & enrichment:', e);
      return [];
    }
  }, [rawSales, storeMaster]);

  // 2. Extract available filter options dynamically
  const availableWeeks = useMemo(() => {
    const set = new Set<string>();
    enrichedRecords.forEach((r) => set.add(r.week_start_date));
    return Array.from(set).sort();
  }, [enrichedRecords]);

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    enrichedRecords.forEach((r) => set.add(r.region));
    return Array.from(set).sort();
  }, [enrichedRecords]);

  const availableStores = useMemo(() => {
    const set = new Set<string>();
    enrichedRecords.forEach((r) => set.add(r.store_name));
    return Array.from(set).sort();
  }, [enrichedRecords]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    enrichedRecords.forEach((r) => set.add(r.city));
    return Array.from(set).sort();
  }, [enrichedRecords]);

  const availableFormats = useMemo(() => {
    const set = new Set<string>();
    enrichedRecords.forEach((r) => set.add(r.store_format));
    return Array.from(set).sort();
  }, [enrichedRecords]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    enrichedRecords.forEach((r) => set.add(r.product_category));
    return Array.from(set).sort();
  }, [enrichedRecords]);

  // 3. Apply Multi-Field Filters
  const filteredRecords = useMemo(() => {
    return enrichedRecords.filter((r) => {
      if (filters.startDate && r.week_start_date < filters.startDate) return false;
      if (filters.endDate && r.week_start_date > filters.endDate) return false;
      if (filters.region && r.region !== filters.region) return false;
      if (filters.storeName && r.store_name !== filters.storeName) return false;
      if (filters.city && r.city !== filters.city) return false;
      if (filters.storeFormat && r.store_format !== filters.storeFormat) return false;
      if (filters.productCategory && r.product_category !== filters.productCategory) return false;

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matches =
          r.store_name.toLowerCase().includes(query) ||
          r.region.toLowerCase().includes(query) ||
          r.city.toLowerCase().includes(query) ||
          r.product_category.toLowerCase().includes(query) ||
          r.store_format.toLowerCase().includes(query) ||
          r.week_start_date.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }, [enrichedRecords, filters]);

  // 4. Analytics Computations
  const kpis = useMemo(() => calculateDashboardKPIs(filteredRecords), [filteredRecords]);
  const weeklyTrend = useMemo(() => aggregateWeeklyTrend(filteredRecords), [filteredRecords]);
  const regionSales = useMemo(() => aggregateSalesByRegion(filteredRecords), [filteredRecords]);
  const categoryPerformance = useMemo(() => aggregateCategoryPerformance(filteredRecords), [filteredRecords]);
  const storeMetrics = useMemo(() => aggregateStoreMetrics(filteredRecords), [filteredRecords]);
  const businessInsights = useMemo(() => generateBusinessInsights(filteredRecords, kpis), [filteredRecords, kpis]);

  // Filter updates
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      region: '',
      storeName: '',
      city: '',
      storeFormat: '',
      productCategory: '',
      searchQuery: '',
    });
  };

  // Custom data ingestion
  const handleDataIngested = async (
    newSales: RawWeeklySale[],
    newStores: StoreMaster[],
    log: SanitizationLog,
    fileMeta?: { salesFileName?: string | null; storesFileName?: string | null }
  ) => {
    const salesToUse = newSales.length > 0 ? newSales : rawSales;
    const storesToUse = newStores.length > 0 ? newStores : storeMaster;

    setRawSales(salesToUse);
    setStoreMaster(storesToUse);
    setSanitizationLog(log);
    setIsBenchmarkData(false);
    handleResetFilters();

    // Persist full uploaded dataset into browser storage (IndexedDB with LocalStorage fallback)
    try {
      const result = await saveUploadedDataset({
        rawSales: salesToUse,
        storeMaster: storesToUse,
        sanitizationLog: log,
        salesFileName: fileMeta?.salesFileName,
        storesFileName: fileMeta?.storesFileName,
        isBenchmark: false,
      });

      setStorageInfo({
        isPersisted: result.success,
        recordsCount: salesToUse.length,
        updatedAt: new Date().toISOString(),
        storageType: result.storageType,
        salesFileName: fileMeta?.salesFileName || null,
        storesFileName: fileMeta?.storesFileName || null,
      });
    } catch (persistErr) {
      console.error('Failed to persist uploaded dataset:', persistErr);
    }
  };

  const handleResetToBenchmark = async () => {
    const benchmark = generateBenchmarkWeeklySales();
    setRawSales(benchmark);
    setStoreMaster(DEFAULT_STORE_MASTER);
    const { log } = sanitizeWeeklySales(benchmark);
    setSanitizationLog(log);
    setIsBenchmarkData(true);
    handleResetFilters();

    // Remove custom dataset from browser storage to revert to benchmark
    try {
      await clearUploadedDataset();
      setStorageInfo({
        isPersisted: false,
        recordsCount: 0,
        updatedAt: null,
        storageType: 'none',
      });
    } catch (clearErr) {
      console.error('Failed to clear stored dataset:', clearErr);
    }
  };

  // Export handlers
  const handleExportCSV = (customRecords?: EnrichedSaleRecord[]) => {
    const dataToExport = customRecords || filteredRecords;
    exportRecordsToCSV(dataToExport, `retail_sales_filtered_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportSummaryText = () => {
    exportTextFile(businessInsights.executiveSummaryText, `retail_sales_insights_${new Date().toISOString().slice(0, 10)}.txt`);
  };

  const handleDownloadSampleWeekly = () => {
    downloadSampleWeeklySales(initialRawSales);
  };

  const handleDownloadSampleStores = () => {
    downloadSampleStoreMaster(DEFAULT_STORE_MASTER);
  };

  return (
    <ErrorBoundary fallbackTitle="Retail Sales Intelligence System">
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
        {/* Top Global Header */}
        <ErrorBoundary fallbackTitle="Header Navigation">
          <Header
            kpis={kpis}
            totalRawCount={enrichedRecords.length}
            filteredCount={filteredRecords.length}
            isBenchmarkData={isBenchmarkData}
            storageInfo={storageInfo}
            onOpenIngestion={() => setIsIngestionOpen(true)}
            onResetToBenchmark={handleResetToBenchmark}
            onExportCSV={handleExportCSV}
            onExportInsights={handleExportSummaryText}
            onDownloadSampleWeekly={handleDownloadSampleWeekly}
            onDownloadSampleStores={handleDownloadSampleStores}
          />
        </ErrorBoundary>

        {/* Main Executive Workspace */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
          {/* Storage Persistence Banner for Restored Custom Datasets */}
          {storageInfo.isPersisted && !isBenchmarkData && (
            <div
              id="banner-persisted-dataset"
              className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-700/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-600/90 text-white rounded-lg shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">Retained Dataset Active</span>
                    <span className="text-[11px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {storageInfo.storageType === 'indexedDB' ? 'IndexedDB' : 'LocalStorage'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {rawSales.length.toLocaleString()} records safely loaded from your browser storage{storageInfo.salesFileName ? ` (${storageInfo.salesFileName})` : ''}. Refreshing the preview or editing code retains your full dataset.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => setIsIngestionOpen(true)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
                >
                  Upload Files
                </button>
                <button
                  onClick={handleResetToBenchmark}
                  className="px-2.5 py-1 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 rounded-lg transition"
                >
                  Clear &amp; Reset
                </button>
              </div>
            </div>
          )}

          {/* 1. Multi-Field Filter Controls */}
          <ErrorBoundary fallbackTitle="Filter Controls">
            <FilterControls
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              availableWeeks={availableWeeks}
              availableRegions={availableRegions}
              availableStores={availableStores}
              availableCities={availableCities}
              availableFormats={availableFormats}
              availableCategories={availableCategories}
              totalRecordsCount={enrichedRecords.length}
              filteredRecordsCount={filteredRecords.length}
            />
          </ErrorBoundary>

          {/* Extreme Filter Empty State Notice */}
          {filteredRecords.length === 0 && (
            <div
              id="no-data-banner"
              className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-start sm:items-center space-x-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                  <FilterX className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">No Data Found for Selected Filters</h4>
                  <p className="text-xs text-amber-800/90 mt-0.5">
                    No sales records match the combined filter criteria. All metrics, charts, and summaries have adjusted gracefully without calculation errors.
                  </p>
                </div>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg transition shrink-0 shadow-2xs"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* 2. Primary KPI Cards Grid */}
          <ErrorBoundary fallbackTitle="Key Performance Indicators (KPIs)">
            <KpiGrid kpis={kpis} />
          </ErrorBoundary>

          {/* 3. Visual Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Weekly Trend (Net Sales vs Sales Target) */}
            <ErrorBoundary fallbackTitle="Weekly Trend Chart">
              <WeeklyTrendChart data={weeklyTrend} />
            </ErrorBoundary>

            {/* Chart 2: Sales by Region */}
            <ErrorBoundary fallbackTitle="Regional Sales Chart">
              <RegionChart data={regionSales} />
            </ErrorBoundary>

            {/* Chart 3: Category Performance */}
            <ErrorBoundary fallbackTitle="Category Performance Chart">
              <CategoryChart data={categoryPerformance} />
            </ErrorBoundary>

            {/* Chart 4: Stockout Risk vs Inventory On Hand */}
            <ErrorBoundary fallbackTitle="Stockout Risk Matrix">
              <StockoutRiskChart stores={storeMetrics} />
            </ErrorBoundary>
          </div>

          {/* Chart 5 / Section: Store Leaderboard (Top 5 & Bottom 5 Target Achievement) */}
          <ErrorBoundary fallbackTitle="Store Leaderboard">
            <StoreLeaderboard stores={storeMetrics} />
          </ErrorBoundary>

          {/* 4. Automated Business Intelligence Summary & Export */}
          <ErrorBoundary fallbackTitle="Business Intelligence Brief">
            <BusinessInsights
              insights={businessInsights}
              onExportCSV={handleExportCSV}
              onExportSummaryText={handleExportSummaryText}
            />
          </ErrorBoundary>

          {/* 5. Detailed Sanitized Records Explorer */}
          <ErrorBoundary fallbackTitle="Sanitized Data Explorer">
            <DataTable
              records={filteredRecords}
              onExportCSV={handleExportCSV}
              onResetFilters={handleResetFilters}
            />
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Retail Sales Intelligence Dashboard • Multi-Store Performance Engine</span>
            <span className="text-slate-400">
              Sanitization Protocol Active • Real-time YYYY-MM-DD standard &amp; dynamic net sales calculation
            </span>
          </div>
        </footer>

        {/* Data Ingestion & Sanitization Modal */}
        <DataIngestionPanel
          isOpen={isIngestionOpen}
          onClose={() => setIsIngestionOpen(false)}
          onDataIngested={handleDataIngested}
          onResetBenchmark={handleResetToBenchmark}
          currentLog={sanitizationLog}
          totalStoresCount={storeMaster.length}
          totalSalesCount={rawSales.length}
          storageInfo={storageInfo}
          onDownloadSampleWeekly={handleDownloadSampleWeekly}
          onDownloadSampleStores={handleDownloadSampleStores}
        />
      </div>
    </ErrorBoundary>
  );
}
