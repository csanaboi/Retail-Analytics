import { EnrichedSaleRecord, DashboardKPIs, StorePerformanceMetric, BusinessInsights } from '../types';

export function calculateDashboardKPIs(records: EnrichedSaleRecord[]): DashboardKPIs {
  if (!records || records.length === 0) {
    return {
      totalNetSales: 0,
      totalGrossSales: 0,
      totalSalesTarget: 0,
      targetAchievementRate: 0,
      targetStatus: 'red',
      totalTransactions: 0,
      totalFootfall: 0,
      totalReturnsAmount: 0,
      totalDiscountAmount: 0,
      totalStockouts: 0,
      totalInventoryOnHand: 0,
      atv: 0,
      returnRate: 0,
      discountRate: 0,
      conversionRate: 0,
      recordsCount: 0,
    };
  }

  let totalNetSales = 0;
  let totalGrossSales = 0;
  let totalSalesTarget = 0;
  let totalTransactions = 0;
  let totalFootfall = 0;
  let totalReturnsAmount = 0;
  let totalDiscountAmount = 0;
  let totalStockouts = 0;
  let totalInventoryOnHand = 0;

  records.forEach((r) => {
    totalNetSales += r.net_sales || 0;
    // For gross sales, if null, approximate with net_sales + discount_amount
    const effectiveGross = r.gross_sales !== null ? r.gross_sales : (r.net_sales + r.discount_amount);
    totalGrossSales += effectiveGross;
    totalSalesTarget += r.sales_target || 0;
    totalTransactions += r.transactions || 0;
    totalFootfall += r.footfall || 0;
    totalReturnsAmount += r.returns_amount || 0;
    totalDiscountAmount += r.discount_amount || 0;
    totalStockouts += r.stockouts || 0;
    totalInventoryOnHand += r.inventory_on_hand || 0;
  });

  const targetAchievementRate = totalSalesTarget > 0 ? (totalNetSales / totalSalesTarget) * 100 : 0;

  let targetStatus: 'green' | 'yellow' | 'red' = 'red';
  if (targetAchievementRate >= 100) {
    targetStatus = 'green';
  } else if (targetAchievementRate >= 85) {
    targetStatus = 'yellow';
  } else {
    targetStatus = 'red';
  }

  const atv = totalTransactions > 0 ? totalNetSales / totalTransactions : 0;
  const returnRate = totalNetSales > 0 ? (totalReturnsAmount / totalNetSales) * 100 : 0;
  const discountRate = totalGrossSales > 0 ? (totalDiscountAmount / totalGrossSales) * 100 : 0;
  const conversionRate = totalFootfall > 0 ? (totalTransactions / totalFootfall) * 100 : 0;

  return {
    totalNetSales,
    totalGrossSales,
    totalSalesTarget,
    targetAchievementRate,
    targetStatus,
    totalTransactions,
    totalFootfall,
    totalReturnsAmount,
    totalDiscountAmount,
    totalStockouts,
    totalInventoryOnHand,
    atv,
    returnRate,
    discountRate,
    conversionRate,
    recordsCount: records.length,
  };
}

export function aggregateWeeklyTrend(records: EnrichedSaleRecord[]) {
  const map = new Map<string, { week: string; net_sales: number; sales_target: number; transactions: number; variance: number }>();

  records.forEach((r) => {
    const existing = map.get(r.week_start_date) || {
      week: r.week_start_date,
      net_sales: 0,
      sales_target: 0,
      transactions: 0,
      variance: 0,
    };
    existing.net_sales += r.net_sales;
    existing.sales_target += r.sales_target;
    existing.transactions += r.transactions;
    map.set(r.week_start_date, existing);
  });

  return Array.from(map.values())
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((item) => ({
      ...item,
      variance: item.net_sales - item.sales_target,
      achievement_pct: item.sales_target > 0 ? (item.net_sales / item.sales_target) * 100 : 0,
    }));
}

export function aggregateSalesByRegion(records: EnrichedSaleRecord[]) {
  const map = new Map<string, { region: string; net_sales: number; sales_target: number; transactions: number; returns: number }>();

  records.forEach((r) => {
    const reg = r.region || 'Unassigned';
    const existing = map.get(reg) || {
      region: reg,
      net_sales: 0,
      sales_target: 0,
      transactions: 0,
      returns: 0,
    };
    existing.net_sales += r.net_sales;
    existing.sales_target += r.sales_target;
    existing.transactions += r.transactions;
    existing.returns += r.returns_amount;
    map.set(reg, existing);
  });

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      achievement_rate: item.sales_target > 0 ? (item.net_sales / item.sales_target) * 100 : 0,
    }))
    .sort((a, b) => b.net_sales - a.net_sales);
}

export function aggregateCategoryPerformance(records: EnrichedSaleRecord[]) {
  const map = new Map<string, {
    category: string;
    net_sales: number;
    gross_sales: number;
    discount_amount: number;
    returns_amount: number;
    transactions: number;
    footfall: number;
    stockouts: number;
  }>();

  records.forEach((r) => {
    const cat = r.product_category || 'Other';
    const existing = map.get(cat) || {
      category: cat,
      net_sales: 0,
      gross_sales: 0,
      discount_amount: 0,
      returns_amount: 0,
      transactions: 0,
      footfall: 0,
      stockouts: 0,
    };
    existing.net_sales += r.net_sales;
    existing.gross_sales += r.gross_sales !== null ? r.gross_sales : (r.net_sales + r.discount_amount);
    existing.discount_amount += r.discount_amount;
    existing.returns_amount += r.returns_amount;
    existing.transactions += r.transactions;
    existing.footfall += r.footfall;
    existing.stockouts += r.stockouts;
    map.set(cat, existing);
  });

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      return_rate: item.net_sales > 0 ? (item.returns_amount / item.net_sales) * 100 : 0,
      discount_rate: item.gross_sales > 0 ? (item.discount_amount / item.gross_sales) * 100 : 0,
      conversion_rate: item.footfall > 0 ? (item.transactions / item.footfall) * 100 : 0,
    }))
    .sort((a, b) => b.net_sales - a.net_sales);
}

export function aggregateStoreMetrics(records: EnrichedSaleRecord[]): StorePerformanceMetric[] {
  const map = new Map<string, StorePerformanceMetric>();

  records.forEach((r) => {
    const existing = map.get(r.store_id) || {
      store_id: r.store_id,
      store_name: r.store_name,
      region: r.region,
      city: r.city,
      store_format: r.store_format,
      net_sales: 0,
      sales_target: 0,
      achievement_rate: 0,
      transactions: 0,
      stockouts: 0,
      inventory_on_hand: 0,
    };
    existing.net_sales += r.net_sales;
    existing.sales_target += r.sales_target;
    existing.transactions += r.transactions;
    existing.stockouts += r.stockouts;
    existing.inventory_on_hand += r.inventory_on_hand;
    map.set(r.store_id, existing);
  });

  return Array.from(map.values()).map((s) => ({
    ...s,
    achievement_rate: s.sales_target > 0 ? (s.net_sales / s.sales_target) * 100 : 0,
  }));
}

export function generateBusinessInsights(records: EnrichedSaleRecord[], kpis: DashboardKPIs): BusinessInsights {
  if (!records || records.length === 0) {
    const emptySummary = [
      `RETAIL SALES EXECUTIVE INTELLIGENCE SUMMARY`,
      `Generated on: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
      `--------------------------------------------------`,
      `STATUS: No data found for selected filters.`,
      ``,
      `A. TOP & BOTTOM PERFORMING REGIONS`,
      `• Top Performing Region: None (0 active records match current filters).`,
      `• Bottom Performing Region: None (0 active records match current filters).`,
      ``,
      `B. STORES MISSING SALES TARGET (<85%)`,
      `• Stores Underperforming (<85% Target): 0 stores flagged.`,
      `• Action Required: None. All active filter combinations returned 0 records.`,
      ``,
      `C. CATEGORIES WITH HIGHEST RETURN RATES`,
      `• Highest Return Rate Category: None (0 returns recorded).`,
      `• Aggregate Return Exposure: $0.0k (0.0% of net sales).`,
      ``,
      `RECOMMENDATION: Reset or adjust filter parameters to view active retail intelligence.`,
    ].join('\n');

    return {
      bestRegion: { name: 'None', netSales: 0, achievement: 0 },
      worstRegion: { name: 'None', netSales: 0, achievement: 0 },
      storesMissingTarget: [],
      categoriesHighestReturn: [],
      topStockoutRisks: [],
      executiveSummaryText: emptySummary,
    };
  }

  const regionData = aggregateSalesByRegion(records);
  const storeMetrics = aggregateStoreMetrics(records);
  const categoryData = aggregateCategoryPerformance(records);

  const bestRegion = regionData.length > 0
    ? { name: regionData[0].region, netSales: regionData[0].net_sales, achievement: regionData[0].achievement_rate }
    : { name: 'None', netSales: 0, achievement: 0 };

  const worstRegion = regionData.length > 0
    ? {
        name: regionData[regionData.length - 1].region,
        netSales: regionData[regionData.length - 1].net_sales,
        achievement: regionData[regionData.length - 1].achievement_rate,
      }
    : { name: 'None', netSales: 0, achievement: 0 };

  // Stores missing sales target (< 85%)
  const storesMissingTarget = storeMetrics
    .filter((s) => s.achievement_rate < 85)
    .sort((a, b) => a.achievement_rate - b.achievement_rate)
    .map((s) => ({
      store_name: s.store_name,
      region: s.region,
      achievement_rate: s.achievement_rate,
      net_sales: s.net_sales,
      sales_target: s.sales_target,
    }));

  // Categories with highest return rate
  const categoriesHighestReturn = [...categoryData]
    .sort((a, b) => b.return_rate - a.return_rate)
    .map((c) => ({
      category: c.category,
      returnRate: c.return_rate,
      returnsAmount: c.returns_amount,
      netSales: c.net_sales,
    }));

  // Top stockout risks
  const topStockoutRisks = [...records]
    .sort((a, b) => b.stockouts - a.stockouts)
    .slice(0, 5)
    .map((r) => ({
      store_name: r.store_name,
      category: r.product_category,
      stockouts: r.stockouts,
      inventory: r.inventory_on_hand,
    }));

  // Construct readable executive summary
  const targetGap = kpis.totalNetSales - kpis.totalSalesTarget;
  const targetGapStr = targetGap >= 0
    ? `+$${(targetGap / 1000).toFixed(1)}k surplus`
    : `-$${(Math.abs(targetGap) / 1000).toFixed(1)}k deficit`;

  const missingCount = storesMissingTarget.length;
  const underperformingStoresList = missingCount > 0
    ? storesMissingTarget.map((s) => `${s.store_name} (${s.region}, ${s.achievement_rate.toFixed(1)}% target)`).join(', ')
    : 'None (100% of active stores meeting or exceeding 85% benchmark)';

  const highestReturnCategory = categoriesHighestReturn[0]
    ? `${categoriesHighestReturn[0].category} (${categoriesHighestReturn[0].returnRate.toFixed(1)}% return rate with $${(categoriesHighestReturn[0].returnsAmount / 1000).toFixed(1)}k returned)`
    : 'None';

  const categoryReturnBreakdown = categoriesHighestReturn.slice(0, 3)
    .map((c) => `${c.category}: ${c.returnRate.toFixed(1)}% ($${(c.returnsAmount / 1000).toFixed(1)}k)`)
    .join(' | ');

  const executiveSummaryText = [
    `RETAIL SALES EXECUTIVE INTELLIGENCE SUMMARY`,
    `Generated on: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    `--------------------------------------------------`,
    `A. TOP & BOTTOM PERFORMING REGIONS`,
    `• Top Performing Region: ${bestRegion.name} with $${(bestRegion.netSales / 1000).toFixed(1)}k in Net Sales (${bestRegion.achievement.toFixed(1)}% target attainment).`,
    `• Bottom Performing Region: ${worstRegion.name} with $${(worstRegion.netSales / 1000).toFixed(1)}k in Net Sales (${worstRegion.achievement.toFixed(1)}% target attainment).`,
    `• Regional Spread: ${(bestRegion.achievement - worstRegion.achievement).toFixed(1)}% attainment disparity between highest and lowest regional markets.`,
    ``,
    `B. STORES MISSING SALES TARGET (<85%)`,
    `• Total Flagged Stores: ${missingCount} of ${storeMetrics.length} reporting stores currently underperforming.`,
    `• Underperforming Stores (<85% Target): ${underperformingStoresList}.`,
    `• Target Remediation: Reallocate promotional budget and review stock levels for critical stores.`,
    ``,
    `C. CATEGORIES WITH HIGHEST RETURN RATES`,
    `• Highest Return Rate Category: ${highestReturnCategory}.`,
    `• Top Return Rate Breakdown: ${categoryReturnBreakdown || 'None'}.`,
    `• Aggregate Return Exposure: $${(kpis.totalReturnsAmount / 1000).toFixed(1)}k (${kpis.returnRate.toFixed(1)}% of total net sales).`,
    ``,
    `D. FINANCIAL & OPERATIONAL OVERVIEW`,
    `• Total Net Sales: $${(kpis.totalNetSales / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k vs Target $${(kpis.totalSalesTarget / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k (${kpis.targetAchievementRate.toFixed(1)}% Achievement - ${kpis.targetStatus.toUpperCase()} status).`,
    `• Net Target Gap: ${targetGapStr}.`,
    `• Average Transaction Value (ATV): $${kpis.atv.toFixed(2)} across ${kpis.totalTransactions.toLocaleString()} transactions.`,
    `• Discount Rate: ${kpis.discountRate.toFixed(1)}% ($${(kpis.totalDiscountAmount / 1000).toFixed(1)}k total discounts).`,
    `• Footfall Conversion Rate: ${kpis.conversionRate.toFixed(1)}% (${kpis.totalTransactions.toLocaleString()} buyers / ${kpis.totalFootfall.toLocaleString()} visitors).`,
    `• Stockout Incidents: ${kpis.totalStockouts.toLocaleString()} stockouts across ${kpis.totalInventoryOnHand.toLocaleString()} inventory units on hand.`,
  ].join('\n');

  return {
    bestRegion,
    worstRegion,
    storesMissingTarget,
    categoriesHighestReturn,
    topStockoutRisks,
    executiveSummaryText,
  };
}
