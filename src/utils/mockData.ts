import { StoreMaster, RawWeeklySale } from '../types';

export const DEFAULT_STORE_MASTER: StoreMaster[] = [
  { store_id: 'STR-101', store_name: 'Downtown Flagship', region: 'North', city: 'New York', store_format: 'Flagship' },
  { store_id: 'STR-102', store_name: 'Metro Center Mall', region: 'North', city: 'Boston', store_format: 'Mall Store' },
  { store_id: 'STR-103', store_name: 'Magnificent Mile High St', region: 'Central', city: 'Chicago', store_format: 'High Street' },
  { store_id: 'STR-104', store_name: 'Southlake Town Square', region: 'South', city: 'Dallas', store_format: 'Mall Store' },
  { store_id: 'STR-105', store_name: 'Union Square Boutique', region: 'West', city: 'San Francisco', store_format: 'Flagship' },
  { store_id: 'STR-106', store_name: 'Peachtree Plaza', region: 'South', city: 'Atlanta', store_format: 'High Street' },
  { store_id: 'STR-107', store_name: 'Cherry Creek Pavilion', region: 'Central', city: 'Denver', store_format: 'Mall Store' },
  { store_id: 'STR-108', store_name: 'Brickell City Centre', region: 'South', city: 'Miami', store_format: 'Outlet' },
  { store_id: 'STR-109', store_name: 'Westlake Center', region: 'West', city: 'Seattle', store_format: 'Mall Store' },
  { store_id: 'STR-110', store_name: 'Domain Northside', region: 'South', city: 'Austin', store_format: 'High Street' },
  { store_id: 'STR-111', store_name: 'Liberty Outlet Mall', region: 'East', city: 'Philadelphia', store_format: 'Outlet' },
  { store_id: 'STR-112', store_name: 'Inner Harbor Promenade', region: 'East', city: 'Baltimore', store_format: 'High Street' },
];

export const PRODUCT_CATEGORIES = [
  'Apparel & Fashion',
  'Footwear & Athleisure',
  'Electronics & Gadgets',
  'Home & Living',
  'Beauty & Personal Care',
];

// Helper to generate realistic weekly raw records with realistic variations & edge cases
export function generateBenchmarkWeeklySales(): RawWeeklySale[] {
  const weeks = [
    '2026-01-05',
    '12-01-2026', // DD-MM-YYYY format test
    '2026-01-19',
    '26-01-2026', // DD-MM-YYYY format test
    '2026-02-02',
    '2026-02-09',
    '2026-02-16',
    '2026-02-23',
  ];

  const sales: RawWeeklySale[] = [];

  // Base performance multipliers for each store to create natural leaderboard variances
  const storeModifiers: Record<string, { targetBias: number; volumeBias: number; returnBias: number }> = {
    'STR-101': { targetBias: 1.15, volumeBias: 1.4, returnBias: 0.04 }, // Overachiever
    'STR-102': { targetBias: 1.08, volumeBias: 1.1, returnBias: 0.05 },
    'STR-103': { targetBias: 1.12, volumeBias: 1.25, returnBias: 0.035 },
    'STR-104': { targetBias: 0.94, volumeBias: 0.95, returnBias: 0.06 },
    'STR-105': { targetBias: 0.81, volumeBias: 0.8, returnBias: 0.075 }, // Underperformer <85%
    'STR-106': { targetBias: 1.02, volumeBias: 1.0, returnBias: 0.045 },
    'STR-107': { targetBias: 0.91, volumeBias: 0.88, returnBias: 0.05 },
    'STR-108': { targetBias: 0.79, volumeBias: 0.75, returnBias: 0.08 }, // Underperformer <85%
    'STR-109': { targetBias: 1.05, volumeBias: 1.15, returnBias: 0.04 },
    'STR-110': { targetBias: 1.18, volumeBias: 1.3, returnBias: 0.03 }, // Star performer
    'STR-111': { targetBias: 0.83, volumeBias: 0.82, returnBias: 0.09 }, // Underperformer <85%
    'STR-112': { targetBias: 0.97, volumeBias: 0.9, returnBias: 0.055 },
  };

  const categoryBaseSales: Record<string, { baseGross: number; returnRate: number; discountRate: number }> = {
    'Apparel & Fashion': { baseGross: 24000, returnRate: 0.085, discountRate: 0.12 },
    'Footwear & Athleisure': { baseGross: 19000, returnRate: 0.075, discountRate: 0.09 },
    'Electronics & Gadgets': { baseGross: 32000, returnRate: 0.04, discountRate: 0.06 },
    'Home & Living': { baseGross: 16000, returnRate: 0.035, discountRate: 0.11 },
    'Beauty & Personal Care': { baseGross: 14000, returnRate: 0.025, discountRate: 0.08 },
  };

  weeks.forEach((week, wIdx) => {
    DEFAULT_STORE_MASTER.forEach((store) => {
      const modifier = storeModifiers[store.store_id] || { targetBias: 1.0, volumeBias: 1.0, returnBias: 0.05 };

      PRODUCT_CATEGORIES.forEach((cat) => {
        const catConfig = categoryBaseSales[cat];
        // Introduce small week-over-week seasonal wave
        const weekWave = 1 + Math.sin((wIdx / weeks.length) * Math.PI) * 0.15;
        const grossVal = Math.round(catConfig.baseGross * modifier.volumeBias * weekWave);
        const discountVal = Math.round(grossVal * catConfig.discountRate);
        const netVal = grossVal - discountVal;
        const targetVal = Math.round(netVal / modifier.targetBias);
        const returnsVal = Math.round(netVal * (catConfig.returnRate + (modifier.returnBias - 0.05)));
        const atv = cat === 'Electronics & Gadgets' ? 180 : cat === 'Footwear & Athleisure' ? 95 : cat === 'Apparel & Fashion' ? 70 : 50;
        const txCount = Math.max(1, Math.round(netVal / atv));
        const footfallCount = Math.round(txCount * (cat === 'Beauty & Personal Care' ? 2.8 : 3.8));
        
        // Stockout simulation: higher stockouts for high volume categories & understocked stores
        const stockouts = modifier.targetBias < 0.85 ? Math.floor(Math.random() * 8) + 4 : Math.floor(Math.random() * 4);
        const inventoryOnHand = Math.max(120, Math.round((grossVal / 25) * (1 - (stockouts / 20))));

        // Intentional edge case injections for parsing & sanitization demonstrations
        if (wIdx === 1 && store.store_id === 'STR-104' && cat === 'Apparel & Fashion') {
          // Mixed string format with currency and commas
          sales.push({
            store_id: store.store_id,
            week_start_date: '19-01-2026', // Mixed DD-MM-YYYY format
            product_category: cat,
            gross_sales: `$${grossVal.toLocaleString()}`,
            discount_amount: `$${discountVal.toLocaleString()}`,
            net_sales: null, // Null to test dynamic calculation: (gross_sales - discount_amount)
            sales_target: targetVal,
            returns_amount: returnsVal,
            transactions: txCount,
            footfall: footfallCount,
            stockouts: stockouts,
            inventory_on_hand: inventoryOnHand,
          });
        } else if (wIdx === 3 && store.store_id === 'STR-108' && cat === 'Electronics & Gadgets') {
          // 'not_available' gross sales test
          sales.push({
            store_id: store.store_id,
            week_start_date: 46045, // Excel serial date
            product_category: cat,
            gross_sales: 'not_available', // non-numeric test
            discount_amount: discountVal,
            net_sales: null, // rule d dynamic fallback
            sales_target: targetVal,
            returns_amount: 0,
            transactions: 0,
            footfall: footfallCount,
            stockouts: 12,
            inventory_on_hand: 45,
          });
        } else {
          sales.push({
            store_id: store.store_id,
            week_start_date: week,
            product_category: cat,
            gross_sales: grossVal,
            discount_amount: discountVal,
            net_sales: netVal,
            sales_target: targetVal,
            returns_amount: returnsVal,
            transactions: txCount,
            footfall: footfallCount,
            stockouts: stockouts,
            inventory_on_hand: inventoryOnHand,
          });
        }
      });
    });
  });

  return sales;
}
