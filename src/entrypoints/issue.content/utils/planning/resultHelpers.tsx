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
};

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

export const getCustomerCount = (
  result: PlanningResult | undefined,
  planningStarted: boolean,
  slug: string,
  aggregating: boolean,
  selectedSlugs: Set<string>,
) => {
  if (!planningStarted) return '-';
  if (!selectedSlugs.has(slug || '')) return '-';
  if (aggregating) return null;
  if (!result) return null;
  if (!result.aggregated) return null;
  if (result.status === 'error') return '0';
  return result.customers !== undefined ? result.customers.toLocaleString() : '-';
};

export const getSubjectLine = (
  result: PlanningResult | undefined,
  planningStarted: boolean,
  slug: string,
  aggregating: boolean,
  selectedSlugs: Set<string>,
) => {
  if (!planningStarted) return '-';
  if (!selectedSlugs.has(slug || '')) return '-';
  if (aggregating) return null;
  if (!result) return null;
  if (!result.aggregated) return null;
  return result.subjectLine || '-';
};
