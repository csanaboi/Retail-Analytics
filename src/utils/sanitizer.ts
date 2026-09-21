import { RawWeeklySale, SanitizedWeeklySale, StoreMaster, EnrichedSaleRecord, SanitizationLog } from '../types';

/**
 * Robust date parser converting various representations into standard YYYY-MM-DD:
 * - Excel serial date numbers (e.g. 45678, '46041')
 * - DD-MM-YYYY (e.g. '19-01-2026', '19/01/2026', '19.01.2026')
 * - YYYY-MM-DD (e.g. '2026-01-19', '2026/01/19')
 * - MM/DD/YYYY and MM-DD-YYYY (e.g. '01/19/2026', '01-19-2026')
 * - ISO string timestamps (e.g. '2026-01-19T00:00:00Z', '2026-01-19T14:30:00.000Z')
 * - Timestamps with spaces (e.g. '2026-01-19 00:00:00', '19-01-2026 12:00:00')
 * - Textual month dates (e.g. '19-Jan-2026', 'Jan 19, 2026', '19 January 2026')
 * - 2-digit years (e.g. '19-01-26', '01/19/26')
 * - Native Date objects
 */
export function parseWeekStartDate(raw: unknown): { dateStr: string; wasSanitized: boolean } {
  if (raw === null || raw === undefined || raw === '') {
    return { dateStr: '2026-01-05', wasSanitized: true };
  }

  // Handle native Date object without timezone drift
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, '0');
    const d = String(raw.getUTCDate()).padStart(2, '0');
    return { dateStr: `${y}-${m}-${d}`, wasSanitized: true };
  }

  // Handle Excel Serial Number (e.g. 40000 - 60000)
  if (
    typeof raw === 'number' ||
    (!isNaN(Number(raw)) && !String(raw).includes('-') && !String(raw).includes('/') && !String(raw).includes('.'))
  ) {
    const num = Number(raw);
    if (num > 30000 && num < 70000) {
      // Excel serial date formula: 25569 days between 1900-01-01 and 1970-01-01
      const utcMs = Math.round((num - 25569) * 86400 * 1000);
      const date = new Date(utcMs);
      if (!isNaN(date.getTime())) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return { dateStr: `${y}-${m}-${d}`, wasSanitized: true };
      }
    }
  }

  const str = String(raw).trim();

  // 1. Check ISO or YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD (with optional timestamp)
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    const isStandard = str === `${y}-${m}-${d}`;
    return { dateStr: `${y}-${m}-${d}`, wasSanitized: !isStandard };
  }

  // 2. Check DD-MM-YYYY or MM-DD-YYYY with 4-digit year (e.g. '19-01-2026', '19/01/2026')
  const fourDigitYearMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (fourDigitYearMatch) {
    const part1 = parseInt(fourDigitYearMatch[1], 10);
    const part2 = parseInt(fourDigitYearMatch[2], 10);
    const year = fourDigitYearMatch[3];

    // If part1 > 12, part1 MUST be Day -> DD-MM-YYYY
    if (part1 > 12) {
      const d = String(part1).padStart(2, '0');
      const m = String(part2).padStart(2, '0');
      return { dateStr: `${year}-${m}-${d}`, wasSanitized: true };
    }

    // If part2 > 12, part2 MUST be Day -> MM-DD-YYYY
    if (part2 > 12) {
      const m = String(part1).padStart(2, '0');
      const d = String(part2).padStart(2, '0');
      return { dateStr: `${year}-${m}-${d}`, wasSanitized: true };
    }

    // Default for retail reporting: DD-MM-YYYY standard
    const d = String(part1).padStart(2, '0');
    const m = String(part2).padStart(2, '0');
    return { dateStr: `${year}-${m}-${d}`, wasSanitized: true };
  }

  // 3. Check 2-digit year format (e.g. '19-01-26' or '01/19/26')
  const twoDigitYearMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (twoDigitYearMatch) {
    const part1 = parseInt(twoDigitYearMatch[1], 10);
    const part2 = parseInt(twoDigitYearMatch[2], 10);
    const yr = parseInt(twoDigitYearMatch[3], 10);
    const fullYear = yr < 70 ? 2000 + yr : 1900 + yr;

    if (part1 > 12) {
      const d = String(part1).padStart(2, '0');
      const m = String(part2).padStart(2, '0');
      return { dateStr: `${fullYear}-${m}-${d}`, wasSanitized: true };
    }
    const d = String(part1).padStart(2, '0');
    const m = String(part2).padStart(2, '0');
    return { dateStr: `${fullYear}-${m}-${d}`, wasSanitized: true };
  }

  // 4. Fallback to Date parser (for textual dates like '19 Jan 2026', 'January 19, 2026')
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const d = String(parsed.getUTCDate()).padStart(2, '0');
    return { dateStr: `${y}-${m}-${d}`, wasSanitized: true };
  }

  return { dateStr: '2026-01-05', wasSanitized: true };
}

/**
 * Coerces numeric value from strings with currency symbols, commas, spaces.
 * Safely handles non-numeric values like 'not_available', 'N/A', null, '-', etc.
 * Returns null if non-numeric.
 */
export function coerceNumeric(val: unknown): { num: number | null; wasCoerced: boolean } {
  if (val === null || val === undefined || val === '') {
    return { num: null, wasCoerced: false };
  }

  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return { num: null, wasCoerced: true };
    return { num: val, wasCoerced: false };
  }

  const str = String(val).trim();
  const lower = str.toLowerCase();

  // Expanded check for known non-numeric edge cases and anomaly strings
  if (
    lower === 'not_available' ||
    lower === 'not available' ||
    lower === 'not-available' ||
    lower === 'na' ||
    lower === 'n/a' ||
    lower === '#n/a' ||
    lower === '#value!' ||
    lower === '#ref!' ||
    lower === 'null' ||
    lower === 'none' ||
    lower === 'nil' ||
    lower === 'undefined' ||
    lower === '-' ||
    lower === '--' ||
    lower === '---' ||
    lower === 'missing' ||
    lower === 'unknown' ||
    lower === 'pending' ||
    lower === 'tbd'
  ) {
    return { num: null, wasCoerced: true };
  }

  // Strip currency symbols ($, €, £, ₹), percentage signs, commas, and whitespace
  const cleanStr = str.replace(/[$,€£₹%\s]/g, '');
  const parsed = parseFloat(cleanStr);

  if (isNaN(parsed) || !isFinite(parsed)) {
    return { num: null, wasCoerced: true };
  }

  return { num: parsed, wasCoerced: cleanStr !== str || typeof val !== 'number' };
}

/**
 * Sanitizes raw weekly sales dataset according to exact specifications:
 * a. Parse 'week_start_date' into standard YYYY-MM-DD strings.
 * b. Coerce numeric columns to numeric floats/ints.
 * c. If 'gross_sales' is non-numeric (e.g. 'not_available'), convert to null.
 * d. If 'net_sales' is null/missing, calculate dynamically as (gross_sales - discount_amount).
 */
export function sanitizeWeeklySales(
  rawRows: RawWeeklySale[]
): { sanitized: SanitizedWeeklySale[]; log: SanitizationLog } {
  let datesSanitized = 0;
  let grossSalesNullified = 0;
  let netSalesCalculated = 0;
  let numericCoercions = 0;

  const sanitized: SanitizedWeeklySale[] = rawRows.map((row) => {
    // 1. Date Sanitization
    const { dateStr, wasSanitized: dateSanitized } = parseWeekStartDate(row.week_start_date);
    if (dateSanitized) datesSanitized++;

    // 2. Gross Sales handling
    const rawGross = row.gross_sales;
    const { num: grossNum, wasCoerced: grossCoerced } = coerceNumeric(rawGross);
    if (grossCoerced) numericCoercions++;

    let finalGross: number | null = grossNum;
    if (grossNum === null) {
      grossSalesNullified++;
      finalGross = null;
    }

    // 3. Discount Amount
    const { num: discountNum, wasCoerced: discCoerced } = coerceNumeric(row.discount_amount);
    if (discCoerced) numericCoercions++;
    const finalDiscount = discountNum !== null ? Math.max(0, discountNum) : 0;

    // 4. Net Sales handling (Rule d)
    const { num: netNum, wasCoerced: netCoerced } = coerceNumeric(row.net_sales);
    if (netCoerced) numericCoercions++;

    let finalNet: number;
    let isCalculated = false;

    if (netNum === null || isNaN(netNum)) {
      // Missing or non-numeric: calculate dynamically as (gross_sales - discount_amount)
      if (finalGross !== null) {
        finalNet = Math.max(0, finalGross - finalDiscount);
      } else {
        finalNet = 0;
      }
      netSalesCalculated++;
      isCalculated = true;
    } else {
      finalNet = netNum;
    }

    // 5. Sales Target
    const { num: targetNum, wasCoerced: targetCoerced } = coerceNumeric(row.sales_target);
    if (targetCoerced) numericCoercions++;
    const finalTarget = targetNum !== null ? Math.max(0, targetNum) : (finalNet > 0 ? Math.round(finalNet * 1.05) : 0);

    // 6. Returns Amount
    const { num: retNum, wasCoerced: retCoerced } = coerceNumeric(row.returns_amount);
    if (retCoerced) numericCoercions++;
    const finalReturns = retNum !== null ? Math.max(0, retNum) : 0;

    // 7. Transactions
    const { num: txNum, wasCoerced: txCoerced } = coerceNumeric(row.transactions);
    if (txCoerced) numericCoercions++;
    const finalTx = txNum !== null ? Math.max(0, Math.round(txNum)) : (finalNet > 0 ? Math.max(1, Math.round(finalNet / 55)) : 0);

    // 8. Footfall
    const { num: ffNum, wasCoerced: ffCoerced } = coerceNumeric(row.footfall);
    if (ffCoerced) numericCoercions++;
    const finalFootfall = ffNum !== null ? Math.max(0, Math.round(ffNum)) : (finalTx > 0 ? Math.max(finalTx, Math.round(finalTx * 3.5)) : 0);

    // 9. Stockouts
    const { num: stockoutsNum, wasCoerced: stockoutsCoerced } = coerceNumeric(row.stockouts);
    if (stockoutsCoerced) numericCoercions++;
    const finalStockouts = stockoutsNum !== null ? Math.max(0, Math.round(stockoutsNum)) : 0;

    // 10. Inventory On Hand
    const { num: invNum, wasCoerced: invCoerced } = coerceNumeric(row.inventory_on_hand);
    if (invCoerced) numericCoercions++;
    const finalInventory = invNum !== null ? Math.max(0, Math.round(invNum)) : 0;

    // Store ID
    const storeIdStr = String(row.store_id || row.store_name || 'STR-001').trim();
    const categoryStr = String(row.product_category || 'General Merchandise').trim();

    return {
      store_id: storeIdStr,
      week_start_date: dateStr,
      product_category: categoryStr,
      gross_sales: finalGross,
      discount_amount: finalDiscount,
      net_sales: finalNet,
      sales_target: finalTarget,
      returns_amount: finalReturns,
      transactions: finalTx,
      footfall: finalFootfall,
      stockouts: finalStockouts,
      inventory_on_hand: finalInventory,
      isNetSalesCalculated: isCalculated,
    };
  });

  return {
    sanitized,
    log: {
      totalRowsProcessed: rawRows.length,
      datesSanitized,
      grossSalesNullified,
      netSalesCalculated,
      numericCoercions,
      unmatchedStores: 0,
    },
  };
}

/**
 * Enriches weekly sales with Store Master metadata (region, city, store format, store_name)
 */
export function enrichWithStoreMaster(
  sales: SanitizedWeeklySale[],
  storeMaster: StoreMaster[]
): { records: EnrichedSaleRecord[]; unmatchedCount: number } {
  const storeMap = new Map<string, StoreMaster>();

  // Map by store_id and normalized store_name
  storeMaster.forEach((store) => {
    storeMap.set(store.store_id.toLowerCase(), store);
    storeMap.set(store.store_name.toLowerCase(), store);
  });

  let unmatchedCount = 0;

  const records: EnrichedSaleRecord[] = sales.map((sale, idx) => {
    const key = sale.store_id.toLowerCase();
    const matched = storeMap.get(key);

    if (!matched) {
      unmatchedCount++;
    }

    const store_name = matched ? matched.store_name : (sale.store_id.startsWith('STR') ? `Store ${sale.store_id}` : sale.store_id);
    const region = matched ? matched.region : 'Unassigned';
    const city = matched ? matched.city : 'Metro Area';
    const store_format = matched ? matched.store_format : 'Standard Retail';

    const target_achievement_rate = sale.sales_target > 0 ? (sale.net_sales / sale.sales_target) * 100 : 100;
    const atv = sale.transactions > 0 ? sale.net_sales / sale.transactions : 0;
    const return_rate = sale.net_sales > 0 ? (sale.returns_amount / sale.net_sales) * 100 : 0;
    const grossForDiscount = (sale.gross_sales !== null && sale.gross_sales > 0) ? sale.gross_sales : (sale.net_sales + sale.discount_amount);
    const discount_rate = grossForDiscount > 0 ? (sale.discount_amount / grossForDiscount) * 100 : 0;
    const conversion_rate = sale.footfall > 0 ? (sale.transactions / sale.footfall) * 100 : 0;

    return {
      ...sale,
      id: `sale-${idx}-${sale.store_id}-${sale.week_start_date}`,
      store_name,
      region,
      city,
      store_format,
      target_achievement_rate,
      atv,
      return_rate,
      discount_rate,
      conversion_rate,
    };
  });

  return { records, unmatchedCount };
}
