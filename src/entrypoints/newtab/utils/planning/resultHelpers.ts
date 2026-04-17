import { PlanningResult } from '../../types/Planning';

export const getTotalCustomers = (results: PlanningResult[]): number => {
  const shopTotals = new Map<string, number>();
  for (const result of results) {
    if (!shopTotals.has(result.slug)) {
      shopTotals.set(result.slug, result.customers);
    }
  }
  return Array.from(shopTotals.values()).reduce((sum, count) => sum + count, 0);
};

export const getSuccessfulCount = (results: PlanningResult[]): number => {
  return results.filter(r => r.status === 'success').length;
}

export const formatResultsForClipboard = (results: PlanningResult[]): string => {
  return results.map(r => r.customers).join('\n');
};

export const formatShopTotalsForClipboard = (results: PlanningResult[]): string => {
  const shopTotals = new Map<string, number>();
  for (const result of results) {
    if (!shopTotals.has(result.slug)) {
      shopTotals.set(result.slug, result.customers);
    }
  }
  return Array.from(shopTotals.values()).join('\n');
};
