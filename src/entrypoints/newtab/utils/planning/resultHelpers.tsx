import { Icon } from '@iconify/react';
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

  export const getCustomerCount = (result: PlanningResult | undefined, planningStarted: boolean, slug: string, aggregating: boolean, selectedSlugs: Set<string>) => {
    if (!planningStarted) return '-';
    if (!selectedSlugs.has(slug || '')) return '-';
    if (aggregating) return null;
    if (!result) return null;
    if (!result.aggregated) return null;
    if (result.status === 'error') return '0';
    return result.customers !== undefined ? result.customers.toLocaleString() : '-';
  };

  export const getSubjectLine = (result: PlanningResult | undefined, planningStarted: boolean, slug: string, aggregating: boolean, selectedSlugs: Set<string>) => {
    if (!planningStarted) return '-';
    if (!selectedSlugs.has(slug || '')) return '-';
    if (aggregating) return null;
    if (!result) return null;
    if (!result.aggregated) return null;
    return result.subjectLine || '-';
  };

   export const getStatusDisplay = (result: PlanningResult | undefined, planningStarted: boolean, slug: string, ready: boolean, aggregating: boolean, selectedSlugs: Set<string>) => {
    if (!selectedSlugs.has(slug || '') && planningStarted) return null;

    if (!ready)
      return (
        <span>
          <Icon icon="material-symbols:error" width="14" height="14" /> Requires approval
        </span>
      );
    if (planningStarted && aggregating)
      return (
        <span>
          <Icon icon="material-symbols:info" width="14" height="14" /> Fetching customer data...
        </span>
      );
    if (planningStarted && !result)
      return (
        <span>
          <Icon icon="fa:hourglass-start" width="14" height="14" /> Pending...
        </span>
      );
    if (result?.status === 'success')
      return (
        <span>
          <Icon icon="fluent-mdl2:completed-solid" width="14" height="14" /> Ready
        </span>
      );
    if (result?.status === 'error')
      return (
        <span style={{ color: '#f44336' }}>
          <Icon icon="material-symbols:close-rounded" width="14" height="14" /> {result.error}
        </span>
      );
    if (ready && !planningStarted)
      return (
        <span>
          <Icon icon="material-symbols:local-fire-department" width="14" height="14" /> Ready to plan
        </span>
      );

    return null;
  };