import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { ShieldAlert, BarChart2, ScatterChart as ScatterIcon, AlertTriangle } from 'lucide-react';
import { StorePerformanceMetric } from '../types';
import { ChartErrorBoundary } from './ChartErrorBoundary';

interface StockoutRiskChartProps {
  stores: StorePerformanceMetric[];
}

export const StockoutRiskChart: React.FC<StockoutRiskChartProps> = ({ stores }) => {
  const [chartType, setChartType] = useState<'scatter' | 'bar'>('scatter');

  // Prepare data with risk score
  const data = stores.map((s) => {
    const riskRatio = s.inventory_on_hand > 0 ? (s.stockouts / (s.inventory_on_hand / 100)) : 0;
    const isHighRisk = s.stockouts >= 15 || (s.stockouts >= 8 && s.inventory_on_hand < 5000);
    return {
      store_id: s.store_id,
      store_name: s.store_name,
      region: s.region,
      city: s.city,
      stockouts: s.stockouts,
      inventory_on_hand: s.inventory_on_hand,
      riskRatio,
      isHighRisk,
    };
  });

  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[200px]">
          <div className="font-bold text-slate-200 pb-1 border-b border-slate-800 flex items-center justify-between">
            <span>{d.store_name}</span>
            {d.isHighRisk && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-700 font-semibold">
                High Risk
              </span>
            )}
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-slate-400">
              Region: <span className="text-white font-medium">{d.region} ({d.city})</span>
            </div>
            <div className="flex justify-between items-center text-rose-400">
              <span>Stockouts Logged:</span>
              <span className="font-bold">{d.stockouts}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Inventory On Hand:</span>
              <span>{d.inventory_on_hand.toLocaleString()} units</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const sortedByStockouts = [...stores].sort((a, b) => b.stockouts - a.stockouts);

  const fallbackView = (
    <div className="space-y-2 py-2">
      <div className="text-xs font-semibold text-slate-600 mb-1">Top Stockout Risk Stores:</div>
      {sortedByStockouts.slice(0, 5).map((s) => (
        <div key={s.store_id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-slate-800">{s.store_name}</div>
            <div className="text-[11px] text-slate-500">{s.region} • {s.city}</div>
          </div>
          <div className="text-right">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              {s.stockouts} stockouts
            </span>
            <div className="text-[10px] text-slate-400 mt-0.5">{s.inventory_on_hand.toLocaleString()} in stock</div>
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
            <ShieldAlert className="w-4 h-4 text-rose-600 mr-2" />
            Stockout Risk vs. Inventory on Hand
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify understocked stores prone to lost sales volume
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setChartType('scatter')}
            className={`px-2 py-1 rounded-md flex items-center space-x-1 font-medium transition ${
              chartType === 'scatter' ? 'bg-white shadow-xs text-rose-600 font-semibold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ScatterIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Matrix</span>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-2 py-1 rounded-md flex items-center space-x-1 font-medium transition ${
              chartType === 'bar' ? 'bg-white shadow-xs text-rose-600 font-semibold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ranked</span>
          </button>
        </div>
      </div>

      <div className="w-full min-h-[280px]">
        {stores.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-700">No stockout or inventory data found for selected filters</span>
            <span className="text-[11px] text-slate-400">Inventory levels will display when filters match stores with active inventory</span>
          </div>
        ) : (
          <ChartErrorBoundary fallback={fallbackView}>
            <div className="w-full h-72">
              {chartType === 'scatter' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      dataKey="inventory_on_hand"
                      name="Inventory on Hand"
                      stroke="#64748b"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      label={{ value: 'Inventory on Hand (Units)', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      type="number"
                      dataKey="stockouts"
                      name="Stockouts"
                      stroke="#64748b"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      label={{ value: 'Stockout Count', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Stores" data={data} fill="#ef4444">
                      {data.map((entry, index) => (
                        <Cell
                          key={`scatter-cell-${index}`}
                          fill={entry.isHighRisk ? '#e11d48' : entry.stockouts > 8 ? '#f59e0b' : '#3b82f6'}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedByStockouts.slice(0, 8)} margin={{ top: 10, right: 15, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="store_name"
                      stroke="#64748b"
                      tick={{ fontSize: 9, fill: '#64748b' }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomScatterTooltip />} />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} />
                    <Bar dataKey="stockouts" name="Stockout Incidents" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartErrorBoundary>
        )}
      </div>
    </div>
  );
};
