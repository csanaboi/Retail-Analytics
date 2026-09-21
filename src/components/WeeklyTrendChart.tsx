import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { ChartErrorBoundary } from './ChartErrorBoundary';

interface WeeklyTrendItem {
  week: string;
  net_sales: number;
  sales_target: number;
  variance: number;
  achievement_pct: number;
}

interface WeeklyTrendChartProps {
  data: WeeklyTrendItem[];
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ data }) => {
  const formatYAxis = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
    return `$${val}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const net = payload.find((p: any) => p.dataKey === 'net_sales')?.value || 0;
      const target = payload.find((p: any) => p.dataKey === 'sales_target')?.value || 0;
      const pct = target > 0 ? (net / target) * 100 : 0;
      const variance = net - target;

      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[200px]">
          <div className="font-semibold text-slate-300 pb-1.5 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-blue-400" />
              Week: {label}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                pct >= 100
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : pct >= 85
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-rose-950 text-rose-300 border border-rose-700'
              }`}
            >
              {pct.toFixed(1)}% Attainment
            </span>
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-blue-400">
              <span>Net Sales:</span>
              <span className="font-bold text-white">${net.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Sales Target:</span>
              <span className="font-semibold text-slate-200">${target.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400">Target Variance:</span>
              <span className={`font-semibold ${variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {variance >= 0 ? `+$${variance.toLocaleString()}` : `-$${Math.abs(variance).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Fallback HTML view if charts fail or in headless testing
  const fallbackView = (
    <div className="space-y-2 py-2">
      <div className="text-xs text-slate-500 mb-2">Weekly Performance Attainment:</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {data.slice(-8).map((d) => (
          <div key={d.week} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
            <div className="font-semibold text-slate-700">{d.week}</div>
            <div className="text-blue-600 font-bold mt-1">${(d.net_sales / 1000).toFixed(0)}k</div>
            <div className="text-[10px] text-slate-500">Target: ${(d.sales_target / 1000).toFixed(0)}k</div>
            <div className={`text-[10px] font-bold mt-0.5 ${d.achievement_pct >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {d.achievement_pct.toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
            Weekly Trend: Net Sales vs. Sales Target
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical trajectory and achievement performance across weeks
          </p>
        </div>
      </div>

      <div className="w-full min-h-[280px]">
        {data.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-xs text-slate-400">
            No sales data available for active filters
          </div>
        ) : (
          <ChartErrorBoundary fallback={fallbackView}>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netSalesArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="week"
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={formatYAxis}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="net_sales"
                    name="Net Sales"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#netSalesArea)"
                    activeDot={{ r: 6, fill: '#1d4ed8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales_target"
                    name="Sales Target"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: '#64748b' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartErrorBoundary>
        )}
      </div>
    </div>
  );
};
