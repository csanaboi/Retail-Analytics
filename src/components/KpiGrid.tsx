import React from 'react';
import { DollarSign, Target, ShoppingBag, Undo2, Percent, Users, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { DashboardKPIs } from '../types';

interface KpiGridProps {
  kpis: DashboardKPIs;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ kpis }) => {
  const formatCurrency = (val: number) => {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) return '$0';
    if (val >= 1_000_000) {
      return `$${(val / 1_000_000).toFixed(2)}M`;
    }
    if (val >= 1_000) {
      return `$${(val / 1_000).toFixed(1)}k`;
    }
    return `$${Math.round(val).toLocaleString()}`;
  };

  const safePct = (val: number) => {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) return '0.0%';
    return `${val.toFixed(1)}%`;
  };

  const safeNum = (val: number, decimals = 2) => {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) return (0).toFixed(decimals);
    return val.toFixed(decimals);
  };

  const targetVariance = kpis.totalNetSales - kpis.totalSalesTarget;

  // Status color badge logic: Green if >= 100%, Yellow if 85-99%, Red if < 85%
  const getBadgeConfig = (status: 'green' | 'yellow' | 'red') => {
    if (kpis.recordsCount === 0) {
      return {
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
        label: 'No Active Records',
      };
    }
    switch (status) {
      case 'green':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'Target Achieved (>=100%)',
        };
      case 'yellow':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-300',
          dot: 'bg-amber-500',
          label: 'At Risk (85%–99%)',
        };
      case 'red':
      default:
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-300',
          dot: 'bg-rose-500',
          label: 'Critical (<85%)',
        };
    }
  };

  const badge = getBadgeConfig(kpis.targetStatus);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* 1. Net Sales */}
      <div id="kpi-net-sales" className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Sales</span>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(kpis.totalNetSales)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Gross: {formatCurrency(kpis.totalGrossSales)}</span>
            <span className="text-slate-400">Target: {formatCurrency(kpis.totalSalesTarget)}</span>
          </div>
        </div>
      </div>

      {/* 2. Target Achievement Rate (%) */}
      <div id="kpi-target-rate" className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Attainment</span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {safePct(kpis.targetAchievementRate)}
            </div>
          </div>
          {/* Status Color Badge */}
          <div className="mt-1.5 flex items-center">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`}></span>
              {badge.label}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Gap: {targetVariance >= 0 ? `+${formatCurrency(targetVariance)}` : `-${formatCurrency(Math.abs(targetVariance))}`}
          </div>
        </div>
      </div>

      {/* 3. Average Transaction Value (ATV) */}
      <div id="kpi-atv" className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Tx Value</span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            ${safeNum(kpis.atv, 2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {kpis.totalTransactions.toLocaleString()} transactions
          </div>
        </div>
      </div>

      {/* 4. Return Rate (%) */}
      <div id="kpi-return-rate" className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Return Rate</span>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Undo2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {safePct(kpis.returnRate)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total returns: {formatCurrency(kpis.totalReturnsAmount)}
          </div>
        </div>
      </div>

      {/* 5. Discount Rate (%) */}
      <div id="kpi-discount-rate" className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount Rate</span>
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {safePct(kpis.discountRate)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total discounts: {formatCurrency(kpis.totalDiscountAmount)}
          </div>
        </div>
      </div>

      {/* 6. Conversion Rate (%) */}
      <div id="kpi-conversion-rate" className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion Rate</span>
          <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {safePct(kpis.conversionRate)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {kpis.totalTransactions.toLocaleString()} buyers / {kpis.totalFootfall.toLocaleString()} footfall
          </div>
        </div>
      </div>
    </div>
  );
};
