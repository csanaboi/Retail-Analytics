import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { MapPin } from 'lucide-react';
import { ChartErrorBoundary } from './ChartErrorBoundary';

interface RegionItem {
  region: string;
  net_sales: number;
  sales_target: number;
  achievement_rate: number;
}

interface RegionChartProps {
  data: RegionItem[];
}

export const RegionChart: React.FC<RegionChartProps> = ({ data }) => {
  const formatYAxis = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
    return `$${val}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload;
      const net = item?.net_sales || 0;
      const target = item?.sales_target || 0;
      const pct = item?.achievement_rate || 0;

      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[190px]">
          <div className="font-semibold text-slate-300 pb-1.5 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-400" />
              {label} Region
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
              {pct.toFixed(1)}%
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
              <span>Variance:</span>
              <span className={net >= target ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {net >= target ? `+$${(net - target).toLocaleString()}` : `-$${(target - net).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const fallbackView = (
    <div className="space-y-3 py-2">
      {data.map((r) => (
        <div key={r.region} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-800">{r.region} Region</div>
            <div className="text-slate-500 text-[11px]">Target: ${(r.sales_target / 1000).toFixed(0)}k</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-blue-600">${(r.net_sales / 1000).toFixed(0)}k</div>
            <div className={`text-[11px] font-semibold ${r.achievement_rate >= 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {r.achievement_rate.toFixed(1)}%
            </div>
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
            <MapPin className="w-4 h-4 text-indigo-600 mr-2" />
            Sales by Region
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Regional performance breakdown and target achievement
          </p>
        </div>
      </div>

      <div className="w-full min-h-[280px]">
        {data.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-700">No regional data found for selected filters</span>
            <span className="text-[11px] text-slate-400">Values will appear when filters match active regional stores</span>
          </div>
        ) : (
          <ChartErrorBoundary fallback={fallbackView}>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="region" stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
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
                  <Bar dataKey="net_sales" name="Net Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sales_target" name="Sales Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartErrorBoundary>
        )}
      </div>
    </div>
  );
};
