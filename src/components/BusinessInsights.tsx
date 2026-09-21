import React, { useState } from 'react';
import { Sparkles, Copy, Download, Check, AlertTriangle, TrendingUp, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { BusinessInsights as BusinessInsightsType } from '../types';

interface BusinessInsightsProps {
  insights: BusinessInsightsType;
  onExportCSV: () => void;
  onExportSummaryText: () => void;
}

export const BusinessInsights: React.FC<BusinessInsightsProps> = ({
  insights,
  onExportCSV,
  onExportSummaryText,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyInsights = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(insights.executiveSummaryText);
      } else {
        // Fallback for restricted iframe environments
        const textArea = document.createElement('textarea');
        textArea.value = insights.executiveSummaryText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  return (
    <section id="executive-summary-section" className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 transition-all">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Executive Summary</h3>
            <p className="text-xs text-slate-500">Automated performance intelligence synthesized from active filter criteria</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Insights Button */}
          <button
            id="btn-copy-insights"
            onClick={handleCopyInsights}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition flex items-center space-x-1.5 shadow-2xs"
            title="Copy synthesized executive insights to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied Insights!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copy Insights</span>
              </>
            )}
          </button>

          {/* Download Text Brief */}
          <button
            id="btn-download-summary"
            onClick={onExportSummaryText}
            className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition flex items-center space-x-1.5"
            title="Download executive brief as text file"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download Brief (.txt)</span>
          </button>

          {/* Download Filtered Data CSV */}
          <button
            id="btn-download-filtered-data-csv"
            onClick={onExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center space-x-1.5 shadow-xs"
            title="Download active filtered dataset as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Filtered Data (CSV)</span>
          </button>
        </div>
      </div>

      {/* Structured Key Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4">
        {/* Highlight 1: Top & Bottom Performing Regions */}
        <div id="insight-regions" className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>a. Regional Disparity</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Top Region:</span>
              <span className="font-bold text-slate-900">
                {insights.bestRegion.name} ({insights.bestRegion.achievement.toFixed(1)}% target)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Bottom Region:</span>
              <span className="font-bold text-rose-600">
                {insights.worstRegion.name} ({insights.worstRegion.achievement.toFixed(1)}% target)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 flex justify-between">
              <span>Top Net Sales: ${(insights.bestRegion.netSales / 1000).toFixed(1)}k</span>
              <span className="font-semibold text-slate-700">
                Spread: {Math.max(0, insights.bestRegion.achievement - insights.worstRegion.achievement).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Highlight 2: Stores Missing Sales Target (<85%) */}
        <div id="insight-stores-target" className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-200/80 flex flex-col justify-between">
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center justify-between">
            <span>b. Stores Missing Target (&lt;85%)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-rose-700">
              {insights.storesMissingTarget.length} Stores Flagged
            </div>
            <div className="text-xs text-rose-800/80 mt-1 line-clamp-2">
              {insights.storesMissingTarget.length > 0
                ? insights.storesMissingTarget.map((s) => `${s.store_name} (${s.achievement_rate.toFixed(1)}%)`).join(', ')
                : 'All active stores meeting or exceeding 85% target threshold.'}
            </div>
            <div className="text-[11px] text-rose-600/90 font-medium mt-2 pt-1 border-t border-rose-200/60">
              {insights.storesMissingTarget.length > 0
                ? 'Immediate promotional & inventory review recommended'
                : 'Performance benchmark achieved'}
            </div>
          </div>
        </div>

        {/* Highlight 3: Categories with Highest Return Rates */}
        <div id="insight-returns" className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80 flex flex-col justify-between">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>c. Highest Return Exposure</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-base font-bold text-slate-900">
              {insights.categoriesHighestReturn[0]?.category || 'None'}
            </div>
            <div className="text-xs text-amber-800 font-medium mt-1">
              {insights.categoriesHighestReturn[0]
                ? `${insights.categoriesHighestReturn[0].returnRate.toFixed(1)}% return rate ($${(
                    insights.categoriesHighestReturn[0].returnsAmount / 1000
                  ).toFixed(1)}k returned)`
                : 'No returns recorded'}
            </div>
            <div className="text-[11px] text-slate-500 mt-2 pt-1 border-t border-amber-200/60 flex justify-between">
              <span>Category Net Sales:</span>
              <span className="font-semibold text-slate-800">
                ${((insights.categoriesHighestReturn[0]?.netSales || 0) / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Executive Summary Text Box with quick copy action */}
      <div className="relative mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="executive-summary-content" className="text-xs font-semibold text-slate-700 flex items-center">
            <FileText className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Automated Executive Brief
          </label>
          <button
            onClick={handleCopyInsights}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-1"
          >
            {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
        </div>
        <textarea
          id="executive-summary-content"
          readOnly
          value={insights.executiveSummaryText}
          rows={8}
          className="w-full font-mono text-xs text-slate-700 bg-slate-900/5 p-3.5 rounded-xl border border-slate-200 focus:outline-hidden resize-none leading-relaxed select-all"
        />
      </div>
    </section>
  );
};
