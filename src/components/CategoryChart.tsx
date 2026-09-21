import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { Tag, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { ChartErrorBoundary } from './ChartErrorBoundary';

interface CategoryItem {
  category: string;
  net_sales: number;
  gross_sales: number;
  discount_amount: number;
  returns_amount: number;
  return_rate: number;
  discount_rate: number;
  conversion_rate: number;
}

interface CategoryChartProps {
  data: CategoryItem[];
}

const COLORS = ['#2563eb', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar');

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
    return `$${val}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: CategoryItem = payload[0]?.payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[210px]">
          <div className="font-semibold text-slate-200 pb-1.5 border-b border-slate-800 flex items-center justify-between">
            <span>{item.category}</span>
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex justify-between items-center text-blue-400">
              <span>Net Sales:</span>
              <span className="font-bold text-white">${item.net_sales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-amber-300">
              <span>Return Rate:</span>
              <span className="font-semibold">{item.return_rate.toFixed(1)}% (${item.returns_amount.toLocaleString()})</span>
            </div>
            <div className="flex justify-between items-center text-purple-300">
              <span>Discount Depth:</span>
              <span className="font-semibold">{item.discount_rate.toFixed(1)}% (${item.discount_amount.toLocaleString()})</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const fallbackView = (
    <div className="space-y-2 py-2">
      {data.map((item, idx) => (
        <div key={item.category} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
            <span className="font-medium text-slate-800">{item.category}</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-900">${item.net_sales.toLocaleString()}</span>
            <span className="text-slate-400 text-[11px] ml-2">({item.return_rate.toFixed(1)}% ret)</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <Tag className="w-4 h-4 text-emerald-600 mr-2" />
            Category Performance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Revenue contribution, returns exposure, and discounts
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('bar')}
            className={`px-2 py-1 rounded-md flex items-center space-x-1 font-medium transition ${
              viewMode === 'bar' ? 'bg-white shadow-xs text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ranked</span>
          </button>
          <button
            onClick={() => setViewMode('pie')}
            className={`px-2 py-1 rounded-md flex items-center space-x-1 font-medium transition ${
              viewMode === 'pie' ? 'bg-white shadow-xs text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      <div className="w-full min-h-[280px]">
        {data.length === 0 || !data.some((d) => d.net_sales > 0) ? (
          <div className="h-72 flex flex-col items-center justify-center text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-700">No category sales recorded for selected filters</span>
            <span className="text-[11px] text-slate-400">Values will appear when filters include active category revenue</span>
          </div>
        ) : (
          <ChartErrorBoundary fallback={fallbackView}>
            <div className="w-full h-72">
              {viewMode === 'bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={formatCurrency}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      stroke="#64748b"
                      tick={{ fontSize: 11, fill: '#334155' }}
                      width={130}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="net_sales" name="Net Sales" radius={[0, 4, 4, 0]}>
                      {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                    />
                    <Pie
                      data={data}
                      dataKey="net_sales"
                      nameKey="category"
                      cx="50%"
                      cy="46%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {data.map((_, index) => (
                        <Cell key={`slice-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartErrorBoundary>
        )}
      </div>
    </div>
  );
};
