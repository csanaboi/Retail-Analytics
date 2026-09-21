import React from 'react';
import { RotateCcw, Filter, Search, Calendar, MapPin, Building2, Store, Tag } from 'lucide-react';
import { FilterState } from '../types';

interface FilterControlsProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableWeeks: string[];
  availableRegions: string[];
  availableStores: string[];
  availableCities: string[];
  availableFormats: string[];
  availableCategories: string[];
  totalRecordsCount: number;
  filteredRecordsCount: number;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableWeeks,
  availableRegions,
  availableStores,
  availableCities,
  availableFormats,
  availableCategories,
  totalRecordsCount,
  filteredRecordsCount,
}) => {
  // Count how many filters are currently active (non-default)
  const activeFilterCount = [
    filters.startDate,
    filters.endDate,
    filters.region,
    filters.storeName,
    filters.city,
    filters.storeFormat,
    filters.productCategory,
    filters.searchQuery,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 transition-all">
      {/* Top row: Label & quick stats & Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800">Filter Controls</span>
            <span className="text-xs text-slate-500 ml-2">
              Showing <span className="font-semibold text-slate-900">{filteredRecordsCount}</span> of {totalRecordsCount} records
            </span>
          </div>
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {activeFilterCount} active
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="filter-search-input"
              type="text"
              placeholder="Search store, city, cat..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800 transition"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Reset Filters button */}
          <button
            id="btn-reset-filters"
            onClick={onResetFilters}
            disabled={activeFilterCount === 0}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 border ${
              activeFilterCount > 0
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Filter Dropdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. Week / Date Range Start */}
        <div className="space-y-1">
          <label htmlFor="filter-week-start" className="text-[11px] font-semibold text-slate-600 flex items-center">
            <Calendar className="w-3 h-3 text-slate-400 mr-1" />
            From Week
          </label>
          <select
            id="filter-week-start"
            value={filters.startDate}
            onChange={(e) => onFilterChange({ startDate: e.target.value })}
            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
          >
            <option value="">All Weeks (Start)</option>
            {availableWeeks.map((week) => (
              <option key={`start-${week}`} value={week}>
                {week}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Week / Date Range End */}
        <div className="space-y-1">
          <label htmlFor="filter-week-end" className="text-[11px] font-semibold text-slate-600 flex items-center">
            <Calendar className="w-3 h-3 text-slate-400 mr-1" />
            To Week
          </label>
          <select
            id="filter-week-end"
            value={filters.endDate}
            onChange={(e) => onFilterChange({ endDate: e.target.value })}
            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
          >
            <option value="">All Weeks (End)</option>
            {availableWeeks.map((week) => (
              <option key={`end-${week}`} value={week}>
                {week}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Region */}
        <div className="space-y-1">
          <label htmlFor="filter-region" className="text-[11px] font-semibold text-slate-600 flex items-center">
            <MapPin className="w-3 h-3 text-slate-400 mr-1" />
            Region
          </label>
          <select
            id="filter-region"
            value={filters.region}
            onChange={(e) => onFilterChange({ region: e.target.value })}
            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
          >
            <option value="">All Regions</option>
            {availableRegions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Store Name */}
        <div className="space-y-1">
          <label htmlFor="filter-store-name" className="text-[11px] font-semibold text-slate-600 flex items-center">
            <Store className="w-3 h-3 text-slate-400 mr-1" />
            Store Name
          </label>
          <select
            id="filter-store-name"
            value={filters.storeName}
            onChange={(e) => onFilterChange({ storeName: e.target.value })}
            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
          >
            <option value="">All Stores</option>
            {availableStores.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* 5. City */}
        <div className="space-y-1">
          <label htmlFor="filter-city" className="text-[11px] font-semibold text-slate-600 flex items-center">
            <Building2 className="w-3 h-3 text-slate-400 mr-1" />
            City / Format
          </label>
          <select
            id="filter-city"
            value={filters.city}
            onChange={(e) => onFilterChange({ city: e.target.value })}
            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
          >
            <option value="">All Cities</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Product Category */}
        <div className="space-y-1">
          <label htmlFor="filter-category" className="text-[11px] font-semibold text-slate-600 flex items-center">
            <Tag className="w-3 h-3 text-slate-400 mr-1" />
            Product Category
          </label>
          <select
            id="filter-category"
            value={filters.productCategory}
            onChange={(e) => onFilterChange({ productCategory: e.target.value })}
            className="w-full text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
          >
            <option value="">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
