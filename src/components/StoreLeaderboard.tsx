import React, { useState } from 'react';
import { Trophy, TrendingDown, ArrowUpRight, ArrowDownRight, Award, AlertOctagon } from 'lucide-react';
import { StorePerformanceMetric } from '../types';

interface StoreLeaderboardProps {
  stores: StorePerformanceMetric[];
}

export const StoreLeaderboard: React.FC<StoreLeaderboardProps> = ({ stores }) => {
  const [activeTab, setActiveTab] = useState<'both' | 'top' | 'bottom'>('both');

  const sortedStores = [...stores].sort((a, b) => b.achievement_rate - a.achievement_rate);
  const top5 = sortedStores.slice(0, 5);
  const bottom5 = sortedStores.length > 5 ? sortedStores.slice(-5) : sortedStores;

  const getStatusBadge = (rate: number) => {
    if (rate >= 100) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        text: 'Achieved',
        barColor: 'bg-emerald-500',
      };
    }
    if (rate >= 85) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-300',
        text: 'At Risk',
        barColor: 'bg-amber-500',
      };
    }
    return {
      bg: 'bg-rose-50 text-rose-700 border-rose-300',
      text: 'Critical',
      barColor: 'bg-rose-500',
    };
  };

  const renderStoreRow = (store: StorePerformanceMetric, rank: number, isTop: boolean) => {
    const badge = getStatusBadge(store.achievement_rate);
    const progressWidth = Math.min(100, Math.max(5, store.achievement_rate));

    return (
      <div
        key={store.store_id}
        className="p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition flex flex-col gap-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isTop ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              #{rank}
            </span>
            <div>
              <div className="text-xs font-bold text-slate-900">{store.store_name}</div>
              <div className="text-[11px] text-slate-500">
                {store.region} • {store.city} ({store.store_format})
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-slate-900 flex items-center justify-end">
              {isTop ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 mr-0.5" />
              )}
              {store.achievement_rate.toFixed(1)}%
            </div>
            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${badge.bg}`}>
              {badge.text}
            </span>
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${badge.barColor}`}
              style={{ width: `${progressWidth}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Net: ${(store.net_sales / 1000).toFixed(1)}k</span>
            <span>Target: ${(store.sales_target / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <Trophy className="w-4 h-4 text-amber-500 mr-2" />
            Store Target Achievement Leaderboard
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Top 5 benchmark leaders vs. Bottom 5 requiring intervention
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('both')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              activeTab === 'both' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            All 10
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              activeTab === 'top' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            Top 5
          </button>
          <button
            onClick={() => setActiveTab('bottom')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              activeTab === 'bottom' ? 'bg-white shadow-xs text-rose-600 font-bold' : 'text-slate-600'
            }`}
          >
            Bottom 5
          </button>
        </div>
      </div>

      {stores.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-xs text-slate-400 space-y-1">
          <span className="font-semibold text-slate-700">No store data found for selected filters</span>
          <span className="text-[11px] text-slate-400">All target rankings will recalculate when filters are adjusted</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top 5 Column */}
          {(activeTab === 'both' || activeTab === 'top') && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-emerald-800 flex items-center pb-1 border-b border-emerald-100">
                <Award className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Top Performing Stores
              </div>
              <div className="space-y-2">
                {top5.map((store) => renderStoreRow(store, sortedStores.indexOf(store) + 1, true))}
              </div>
            </div>
          )}

          {/* Bottom 5 Column */}
          {(activeTab === 'both' || activeTab === 'bottom') && (
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-rose-800 flex items-center pb-1 border-b border-rose-100">
                <AlertOctagon className="w-3.5 h-3.5 mr-1 text-rose-600" />
                Bottom Performing Stores (&lt;85% Target Priority)
              </div>
              <div className="space-y-2">
                {bottom5.map((store) => renderStoreRow(store, sortedStores.indexOf(store) + 1, false))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
